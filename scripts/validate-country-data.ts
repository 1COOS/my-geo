import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  countryBoundariesSchema,
  countryCatalogSchema,
  countrySourceRegistrySchema,
} from '../src/data/countrySchema'
import { cityCatalogSchema } from '../src/data/citySchema'
import {
  linearGeoFeatureGeometries,
  linearGeoFeatures,
} from '../src/data/linearGeoFeatures'
import {
  NATURAL_EARTH_RIVER_ARCHIVE_SHA256,
  riverGeometryDefinitions,
} from './river-geometry-content'
import { waterbodies, waterbodyGeometries } from '../src/data/waterbodies'
import { priorityCityCounts } from './city-content'
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
const cities = cityCatalogSchema.parse(
  await readJson(path.join(projectRoot, 'src/data/generated/cities.json')),
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
const citiesByCountry = Map.groupBy(cities, (city) => city.countryCode)
const priorityCountryCodes = Object.keys(priorityCityCounts).sort()

if (
  linearGeoFeatures.filter((feature) => feature.kind === 'river').length !== 30
) {
  throw new Error('Expected exactly 30 river systems')
}
if (
  linearGeoFeatures.filter((feature) => feature.kind === 'canal').length !== 10
) {
  throw new Error('Expected exactly 10 artificial canals')
}
const linearGeometryIds = new Set(
  linearGeoFeatureGeometries.map((geometry) => geometry.id),
)
const riverGeometryDefinitionsById = new Map(
  riverGeometryDefinitions.map((definition) => [definition.id, definition]),
)
let mediumRiverPointCount = 0
let lowRiverPointCount = 0
for (const feature of linearGeoFeatures) {
  if (!linearGeometryIds.has(feature.id)) {
    throw new Error(`Missing geometry for linear feature ${feature.id}`)
  }
  for (const countryCode of feature.countryCodes) {
    if (!countryCodes.has(countryCode)) {
      throw new Error(`Unknown country ${countryCode} on ${feature.id}`)
    }
  }
  for (const sourceId of feature.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`Unknown source ${sourceId} on ${feature.id}`)
    }
  }
  const geometry = linearGeoFeatureGeometries.find(
    (candidate) => candidate.id === feature.id,
  )!
  if (feature.kind === 'river') {
    const definition = riverGeometryDefinitionsById.get(feature.id)
    if (!definition) {
      throw new Error(`Missing reviewed river mapping for ${feature.id}`)
    }
    if (
      geometry.provenance?.archiveSha256 !== NATURAL_EARTH_RIVER_ARCHIVE_SHA256
    ) {
      throw new Error(`Unexpected river archive SHA-256 on ${feature.id}`)
    }
    if (geometry.geometry.coordinates.length !== definition.stems.length) {
      throw new Error(`Unexpected main-stem count on ${feature.id}`)
    }
    mediumRiverPointCount +=
      geometry.mediumDetailGeometry.coordinates.flat().length
    lowRiverPointCount += geometry.lowDetailGeometry.coordinates.flat().length
    for (
      let index = 0;
      index < geometry.geometry.coordinates.length;
      index += 1
    ) {
      const high = geometry.geometry.coordinates[index]
      const medium = geometry.mediumDetailGeometry.coordinates[index]
      const low = geometry.lowDetailGeometry.coordinates[index]
      if (high.length > 2_000 || medium.length > 320 || low.length > 96) {
        throw new Error(`River point cap exceeded on ${feature.id}`)
      }
      if (high.length < medium.length || medium.length < low.length) {
        throw new Error(`Non-monotonic detail levels on ${feature.id}`)
      }
    }
    for (const supplement of geometry.provenance.supplements) {
      for (const sourceId of supplement.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          throw new Error(
            `Unknown supplemental source ${sourceId} on ${feature.id}`,
          )
        }
      }
    }
  }
}

if (mediumRiverPointCount > 10_000 || lowRiverPointCount > 3_000) {
  throw new Error(
    `River geometry budgets exceeded: ${mediumRiverPointCount} medium, ${lowRiverPointCount} low`,
  )
}

for (const featureId of [
  'yangtze-system',
  'mekong-system',
  'amazon-system',
  'parana-paraguay-system',
  'saint-lawrence-great-lakes-system',
]) {
  const geometry = linearGeoFeatureGeometries.find(
    (candidate) => candidate.id === featureId,
  )
  if (!geometry?.provenance?.supplements.length) {
    throw new Error(`Known river source gap is not declared on ${featureId}`)
  }
}

const expectedWaterbodyKinds = {
  ocean: 5,
  sea: 25,
  gulf: 4,
  bay: 2,
  strait: 10,
  trench: 4,
} as const

for (const [kind, expectedCount] of Object.entries(expectedWaterbodyKinds)) {
  const count = waterbodies.filter(
    (waterbody) => waterbody.kind === kind,
  ).length
  if (count !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} ${kind} entries, received ${count}`,
    )
  }
}

const waterbodyGeometryIds = new Set(
  waterbodyGeometries.map((geometry) => geometry.id),
)
for (const waterbody of waterbodies) {
  if (!waterbodyGeometryIds.has(waterbody.id)) {
    throw new Error(`Missing geometry for waterbody ${waterbody.id}`)
  }
  for (const countryCode of waterbody.adjacentCountryCodes) {
    if (!countryCodes.has(countryCode)) {
      throw new Error(
        `Unknown adjacent country ${countryCode} on ${waterbody.id}`,
      )
    }
  }
  for (const sourceId of waterbody.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`Unknown source ${sourceId} on waterbody ${waterbody.id}`)
    }
  }
}

if (priorityCountryCodes.length !== 50) {
  throw new Error(
    `Expected 50 priority countries, received ${priorityCountryCodes.length}`,
  )
}

if (cities.filter((city) => city.isCapital).length !== 197) {
  throw new Error('Expected exactly 197 capital city entries')
}

if (cities.length !== 338) {
  throw new Error(`Expected 338 total city entries, received ${cities.length}`)
}

const priorityCityTotal = priorityCountryCodes.reduce(
  (total, countryCode) =>
    total + (citiesByCountry.get(countryCode)?.length ?? 0),
  0,
)
if (priorityCityTotal !== 193) {
  throw new Error(
    `Expected 193 priority-country city entries, received ${priorityCityTotal}`,
  )
}

for (const city of cities) {
  if (!countryCodes.has(city.countryCode)) {
    throw new Error(`Unknown country ${city.countryCode} on city ${city.id}`)
  }
  for (const sourceId of city.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`Unknown source ${sourceId} on city ${city.id}`)
    }
  }
}

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
  const countryCities = citiesByCountry.get(country.code) ?? []
  const capitalCityNames = countryCities
    .filter((city) => city.isCapital)
    .map((city) => city.name.en)
  if (
    JSON.stringify(capitalCityNames) !==
    JSON.stringify(country.capitals.map((capital) => capital.name.en))
  ) {
    throw new Error(`Capital city authority mismatch for ${country.code}`)
  }
  const expectedCityCount =
    priorityCityCounts[country.code as keyof typeof priorityCityCounts]
  if (expectedCityCount && countryCities.length !== expectedCityCount) {
    throw new Error(
      `Expected ${expectedCityCount} reviewed cities for ${country.code}`,
    )
  }
  if (!expectedCityCount && countryCities.some((city) => !city.isCapital)) {
    throw new Error(`Unreviewed non-capital city found for ${country.code}`)
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
  `Validated ${countries.length} complete country cards, ${cities.length} capital and reviewed city entries, ${waterbodies.length} waterbodies, ${linearGeoFeatures.length} rivers and canals, ${priorityCityTotal} entries across 50 priority countries, ${featuredCodes.length} featured entries, ${sources.length} sources, ${boundaries.features.length} boundaries, and all local flags.`,
)
