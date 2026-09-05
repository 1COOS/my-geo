import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

import {
  evaluateBudgets,
  formatBudgetEvaluation,
  formatKiB,
} from './build-budget'

const projectRoot = path.resolve(import.meta.dirname, '..')
const distRoot = path.join(projectRoot, 'dist')
const sourceMapsEnabled = process.env.GENERATE_SOURCEMAP === 'true'
const maxJavaScriptGzipBytes = 700 * 1024
const cssRawThreshold = { soft: 112 * 1024, hard: 128 * 1024 }
const cssGzipThreshold = { soft: 20 * 1024, hard: 24 * 1024 }
const maxPrecacheBytes = 8.5 * 1024 * 1024
const precacheExtensions = new Set([
  '.js',
  '.css',
  '.html',
  '.svg',
  '.png',
  '.woff2',
  '.json',
])

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? await listFiles(entryPath) : [entryPath]
    }),
  )
  return nested.flat()
}

const files = await listFiles(distRoot)
const failures: string[] = []
let cssRawBytes = 0
let cssGzipBytes = 0
let precacheBytes = 0

for (const file of files) {
  const relativePath = path.relative(distRoot, file)
  const extension = path.extname(file)
  const bytes = await readFile(file)
  if (!sourceMapsEnabled && extension === '.map') {
    failures.push(`Unexpected source map in default build: ${relativePath}`)
  }
  if (extension === '.js') {
    const gzipBytes = gzipSync(bytes).byteLength
    if (gzipBytes > maxJavaScriptGzipBytes) {
      failures.push(
        `${relativePath} gzip ${formatKiB(gzipBytes)} exceeds ${formatKiB(maxJavaScriptGzipBytes)}`,
      )
    }
  }
  if (extension === '.css') {
    cssRawBytes += bytes.byteLength
    cssGzipBytes += gzipSync(bytes).byteLength
  }
  if (precacheExtensions.has(extension)) precacheBytes += bytes.byteLength
}

const cssBudgets = evaluateBudgets([
  { label: 'CSS raw', actual: cssRawBytes, threshold: cssRawThreshold },
  { label: 'CSS gzip', actual: cssGzipBytes, threshold: cssGzipThreshold },
])
failures.push(
  ...cssBudgets.failures.map(
    (item) => `${formatBudgetEvaluation(item)} exceeds hard limit`,
  ),
)
if (precacheBytes > maxPrecacheBytes) {
  failures.push(
    `Precache assets ${formatKiB(precacheBytes)} exceed ${formatKiB(maxPrecacheBytes)}`,
  )
}

if (failures.length > 0) {
  throw new Error(`Build budget failed:\n${failures.join('\n')}`)
}

if (cssBudgets.warnings.length > 0) {
  console.warn(
    `Build budget warning:\n${cssBudgets.warnings.map(formatBudgetEvaluation).join('\n')}`,
  )
}

console.log(
  `Build budgets passed: ${cssBudgets.evaluations.map(formatBudgetEvaluation).join('; ')}; precache ${formatKiB(precacheBytes)} (hard ${formatKiB(maxPrecacheBytes)}, hard headroom ${formatKiB(maxPrecacheBytes - precacheBytes)}).`,
)
