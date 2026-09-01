import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import prettier from 'prettier'

import countriesJson from '../src/data/generated/countries.json'

type FactbookValue = { text?: string }
type FactbookDocument = {
  Government?: {
    'Country name'?: Record<string, FactbookValue>
  }
  Geography?: {
    'Natural resources'?: FactbookValue
  }
}

const factbookDirectory = process.env.FACTBOOK_JSON_DIR
if (!factbookDirectory) {
  throw new Error(
    'FACTBOOK_JSON_DIR must point to the pinned factbook checkout',
  )
}

const manualNames: Record<string, string> = {
  BS: 'Bahamas',
  BO: 'Bolivia',
  BN: 'Brunei',
  CD: 'Congo, Democratic Republic of the',
  CG: 'Congo, Republic of the',
  CI: "Cote d'Ivoire",
  CZ: 'Czechia',
  GM: 'Gambia, The',
  IR: 'Iran',
  KP: 'Korea, North',
  KR: 'Korea, South',
  LA: 'Laos',
  MD: 'Moldova',
  MK: 'North Macedonia',
  MM: 'Burma',
  PS: 'West Bank',
  RU: 'Russia',
  SY: 'Syria',
  TZ: 'Tanzania',
  TR: 'Turkey',
  US: 'United States',
  VA: 'Holy See (Vatican City)',
  VE: 'Venezuela',
  VN: 'Vietnam',
}

const entries = await loadFactbookEntries(factbookDirectory)
const index = new Map<string, (typeof entries)[number]>()
for (const entry of entries) {
  for (const name of entry.names) index.set(normalizeName(name), entry)
}

const countries = Object.fromEntries(
  countriesJson.map((country) => {
    const candidates = [
      country.name.en,
      country.officialName.en,
      manualNames[country.code],
    ].filter((value): value is string => Boolean(value))
    const entry = candidates
      .map((name) => index.get(normalizeName(name)))
      .find(Boolean)
    if (!entry)
      throw new Error(`Missing Factbook resource entry for ${country.code}`)
    return [
      country.code,
      {
        raw: entry.resources,
        sourcePath: entry.sourcePath,
      },
    ]
  }),
)

const output = {
  sourceId: 'cia-world-factbook',
  version: 'c8cfe21cd019d7748a6b0d57a75d6a77f5ec6ac6',
  countries,
}

const outputPath = path.resolve(
  import.meta.dirname,
  'country-resource-source.json',
)
await writeFile(
  outputPath,
  await prettier.format(JSON.stringify(output), { parser: 'json' }),
)
console.log(`Extracted ${Object.keys(countries).length} resource profiles.`)

async function loadFactbookEntries(directory: string) {
  const files = await collectJsonFiles(directory)
  const result: Array<{
    names: string[]
    resources: string
    sourcePath: string
  }> = []
  for (const filePath of files) {
    const document = JSON.parse(
      await readFile(filePath, 'utf8'),
    ) as FactbookDocument
    const resources = document.Geography?.['Natural resources']?.text?.trim()
    const names = Object.values(document.Government?.['Country name'] ?? {})
      .map((value) => value.text?.trim())
      .filter((value): value is string => Boolean(value))
    if (resources && names.length > 0) {
      result.push({
        names,
        resources,
        sourcePath: path.relative(directory, filePath),
      })
    }
  }
  return result
}

async function collectJsonFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectJsonFiles(entryPath)))
    else if (entry.name.endsWith('.json')) files.push(entryPath)
  }
  return files
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]/g, '')
}
