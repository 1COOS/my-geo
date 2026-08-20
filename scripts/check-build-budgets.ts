import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const projectRoot = path.resolve(import.meta.dirname, '..')
const distRoot = path.join(projectRoot, 'dist')
const sourceMapsEnabled = process.env.GENERATE_SOURCEMAP === 'true'
const maxJavaScriptGzipBytes = 700 * 1024
const maxCssRawBytes = 100 * 1024
const maxCssGzipBytes = 20 * 1024
const maxPrecacheBytes = 8 * 1024 * 1024
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

function formatKiB(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`
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

if (cssRawBytes > maxCssRawBytes) {
  failures.push(
    `CSS raw ${formatKiB(cssRawBytes)} exceeds ${formatKiB(maxCssRawBytes)}`,
  )
}
if (cssGzipBytes > maxCssGzipBytes) {
  failures.push(
    `CSS gzip ${formatKiB(cssGzipBytes)} exceeds ${formatKiB(maxCssGzipBytes)}`,
  )
}
if (precacheBytes > maxPrecacheBytes) {
  failures.push(
    `Precache assets ${formatKiB(precacheBytes)} exceed ${formatKiB(maxPrecacheBytes)}`,
  )
}

if (failures.length > 0) {
  throw new Error(`Build budget failed:\n${failures.join('\n')}`)
}

console.log(
  `Build budgets passed: CSS ${formatKiB(cssRawBytes)} raw / ${formatKiB(cssGzipBytes)} gzip, precache ${formatKiB(precacheBytes)}.`,
)
