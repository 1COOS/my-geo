import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import prettier from 'prettier'

import { parseFlagSections } from './country-flag-source-parser'
import resourceSourceJson from './country-resource-source.json'

type FactbookValue = { text?: string }
type FactbookDocument = {
  Government?: {
    Flag?: FactbookValue
  }
}

const factbookDirectory = process.env.FACTBOOK_JSON_DIR
if (!factbookDirectory) {
  throw new Error(
    'FACTBOOK_JSON_DIR must point to the pinned factbook checkout',
  )
}

const resourceCountries = resourceSourceJson.countries as Record<
  string,
  { sourcePath: string }
>

const countries: Record<
  string,
  {
    raw: string
    rawSha256: string
    sourcePath: string
    description: string | null
    meaning: string | null
    history: string | null
  }
> = Object.fromEntries(
  await Promise.all(
    Object.entries(resourceCountries).map(
      async ([countryCode, { sourcePath }]) => {
        const document = JSON.parse(
          await readFile(path.join(factbookDirectory, sourcePath), 'utf8'),
        ) as FactbookDocument

        const raw = document.Government?.Flag?.text?.trim() ?? ''
        return [
          countryCode,
          {
            raw,
            rawSha256: createHash('sha256').update(raw).digest('hex'),
            sourcePath,
            ...parseFlagSections(raw),
          },
        ] as const
      },
    ),
  ),
)

const output = {
  sourceId: 'cia-world-factbook',
  version: resourceSourceJson.version,
  countries,
}

const outputPath = path.resolve(import.meta.dirname, 'country-flag-source.json')
await writeFile(
  outputPath,
  await prettier.format(JSON.stringify(output), { parser: 'json' }),
)
console.log(`Extracted ${Object.keys(countries).length} flag source entries.`)
