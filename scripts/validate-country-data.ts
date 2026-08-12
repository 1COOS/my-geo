import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  countryBoundariesSchema,
  countryCatalogSchema,
  countrySourceRegistrySchema,
} from '../src/data/countrySchema'
import {
  adjacentRegionNames,
  capitalChineseNames,
  FEATURED_COUNTRY_CODES,
} from './country-content'

const projectRoot = path.resolve(import.meta.dirname, '..')

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, 'utf8')) as unknown
}

const countries = countryCatalogSchema.parse(
  await readJson(path.join(projectRoot, 'src/data/generated/countries.json')),
)
const boundaries = countryBoundariesSchema.parse(
  await readJson(
    path.join(projectRoot, 'src/data/generated/country-boundaries.json'),
  ),
)
const sources = countrySourceRegistrySchema.parse(
  await readJson(
    path.join(projectRoot, 'src/data/generated/country-sources.json'),
  ),
)

const featuredCodes = countries
  .filter((country) => country.featured)
  .map((country) => country.code)
  .sort()
const expectedFeaturedCodes = [...FEATURED_COUNTRY_CODES].sort()

if (JSON.stringify(featuredCodes) !== JSON.stringify(expectedFeaturedCodes)) {
  throw new Error(
    `Unexpected featured country set: ${featuredCodes.join(', ')}`,
  )
}

const boundaryCodes = new Set(
  boundaries.features.map((boundary) => boundary.properties.code),
)
const sourceIds = new Set(sources.map((source) => source.id))
const allowedAdjacentRegionCodes = new Set(Object.keys(adjacentRegionNames))
const countryCodes = new Set(countries.map((country) => country.code))

for (const country of countries) {
  await access(path.join(projectRoot, `public${country.flagAsset}`))
  if (country.hasGeometry !== boundaryCodes.has(country.code)) {
    throw new Error(`Geometry availability mismatch for ${country.code}`)
  }
  if (!country.officialName.zh || !country.subregion.zh) {
    throw new Error(`Missing localized core content for ${country.code}`)
  }
  for (const capital of country.capitals) {
    if (
      capitalChineseNames[`${country.code}:${capital.name.en}`] !==
      capital.name.zh
    ) {
      throw new Error(
        `Capital localization mismatch for ${country.code}:${capital.name.en}`,
      )
    }
  }
  for (const language of country.languages) {
    if (!language.name.zh || language.name.zh === language.code) {
      throw new Error(`Missing Chinese language name for ${language.code}`)
    }
  }
  for (const currency of country.currencies) {
    if (!currency.name.zh || currency.name.zh === currency.code) {
      throw new Error(`Missing Chinese currency name for ${currency.code}`)
    }
  }
  if (country.highlights.length !== (country.featured ? 3 : 1)) {
    throw new Error(`Unexpected highlight count for ${country.code}`)
  }
  for (const highlight of country.highlights) {
    for (const sourceId of highlight.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`Unknown source ${sourceId} on ${country.code}`)
      }
    }
  }
  for (const borderCode of country.borderCountryCodes) {
    if (!countryCodes.has(borderCode)) {
      throw new Error(`Unknown sovereign border ${borderCode}`)
    }
  }
  for (const region of country.adjacentRegions) {
    if (!allowedAdjacentRegionCodes.has(region.code)) {
      throw new Error(`Unknown adjacent region ${region.code}`)
    }
  }
}

console.log(
  `Validated ${countries.length} complete country cards, ${featuredCodes.length} featured entries, ${sources.length} sources, ${boundaries.features.length} boundaries, and all local flags.`,
)
