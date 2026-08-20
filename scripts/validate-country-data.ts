import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

import { geoContains } from 'd3-geo'

import { climateSources, climateTypes } from '../src/data/climateLearning'
import { climateTypeIds } from '../src/data/climateLearningSchema'
import { climateLayerManifest } from '../src/data/climateRaster'
import {
  countryBoundariesSchema,
  countryCatalogSchema,
  countrySourceRegistrySchema,
} from '../src/data/countrySchema'
import { cityCatalogSchema } from '../src/data/citySchema'
import { linearGeoFeatures } from '../src/data/linearGeoFeatures'
import { mountainRanges } from '../src/data/mountainRanges'
import { deserts } from '../src/data/deserts'
import {
  desertGeometries,
  linearGeoFeatureGeometries,
  mountainRangeGeometries,
  waterbodyGeometries,
} from '../src/data/geometryData'
import { landmarks } from '../src/data/landmarks'
import {
  desertGeometryDefinitions,
  NATURAL_EARTH_DESERT_ARCHIVE_SHA256,
  NATURAL_EARTH_DESERT_ARCHIVE_VERSION,
} from './desert-geometry-content'
import {
  mountainGeometryDefinitions,
  NATURAL_EARTH_MOUNTAIN_ARCHIVE_SHA256,
} from './mountain-geometry-content'
import {
  NATURAL_EARTH_RIVER_ARCHIVE_SHA256,
  riverGeometryDefinitions,
} from './river-geometry-content'
import {
  NATURAL_EARTH_LAKES_ARCHIVE_SHA256,
  NATURAL_EARTH_MARINE_ARCHIVE_SHA256,
  waterbodyGeometryDefinitions,
} from './waterbody-geometry-content'
import { waterbodies } from '../src/data/waterbodies'
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
if (boundaries.features.length !== 166 || boundaryCodes.size !== 166) {
  throw new Error(
    `Expected 166 unique country boundaries, received ${boundaries.features.length}`,
  )
}
const chinaBoundary = boundaries.features.find(
  (boundary) => boundary.properties.code === 'CN',
)
if (
  chinaBoundary?.geometry.type !== 'MultiPolygon' ||
  chinaBoundary.geometry.coordinates.length !== 3 ||
  !geoContains(chinaBoundary as never, [121, 23.7])
) {
  throw new Error(
    'China boundary does not include the reviewed Taiwan island geometry',
  )
}
if (
  countries.some((country) => country.code === 'TW') ||
  boundaryCodes.has('TW')
) {
  throw new Error('Taiwan must not become a separate country catalogue entry')
}
const sourceIds = new Set(sources.map((source) => source.id))
const allowedAdjacentRegionCodes = new Set(Object.keys(adjacentRegionNames))
const countryCodes = new Set(countries.map((country) => country.code))
const citiesByCountry = Map.groupBy(cities, (city) => city.countryCode)
const priorityCountryCodes = Object.keys(priorityCityCounts).sort()

function getDistanceKilometers(
  left: readonly [number, number],
  right: readonly [number, number],
) {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const latitudeDelta = toRadians(right[1] - left[1])
  const longitudeDelta = toRadians(right[0] - left[0])
  const leftLatitude = toRadians(left[1])
  const rightLatitude = toRadians(right[1])
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) *
      Math.cos(rightLatitude) *
      Math.sin(longitudeDelta / 2) ** 2
  return 12_742.0176 * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

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

if (mountainRanges.length !== 30 || mountainRangeGeometries.length !== 30) {
  throw new Error('Expected exactly 30 mountain ranges and geometries')
}
const mountainGeometryIds = new Set(
  mountainRangeGeometries.map((geometry) => geometry.id),
)
const mountainDefinitionsById = new Map(
  mountainGeometryDefinitions.map((definition) => [definition.id, definition]),
)
let mediumMountainPointCount = 0
let lowMountainPointCount = 0
for (const range of mountainRanges) {
  const geometry = mountainRangeGeometries.find(
    (candidate) => candidate.id === range.id,
  )
  const definition = mountainDefinitionsById.get(range.id)
  if (!geometry || !mountainGeometryIds.has(range.id) || !definition) {
    throw new Error(`Missing mountain geometry or mapping for ${range.id}`)
  }
  if (
    geometry.provenance.archiveSha256 !==
      NATURAL_EARTH_MOUNTAIN_ARCHIVE_SHA256 ||
    geometry.provenance.naturalEarthNeId !== definition.naturalEarthNeId
  ) {
    throw new Error(`Unexpected mountain provenance on ${range.id}`)
  }
  for (const countryCode of [
    ...range.countryCodes,
    ...range.highestPeak.countryCodes,
  ]) {
    if (!countryCodes.has(countryCode)) {
      throw new Error(`Unknown country ${countryCode} on ${range.id}`)
    }
  }
  for (const sourceId of [
    ...range.sourceIds,
    ...geometry.provenance.correctionSourceIds,
  ]) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`Unknown source ${sourceId} on ${range.id}`)
    }
  }
  mediumMountainPointCount +=
    geometry.mediumDetailGeometry.coordinates.flat().length
  lowMountainPointCount += geometry.lowDetailGeometry.coordinates.flat().length
  const peakPosition = [
    range.highestPeak.position.longitude,
    range.highestPeak.position.latitude,
  ] as const
  const peakDistance = Math.min(
    ...geometry.geometry.coordinates
      .flatMap((line) => line)
      .map((point) => getDistanceKilometers(point, peakPosition)),
  )
  if (peakDistance > 85) {
    throw new Error(
      `${range.id} peak is ${peakDistance.toFixed(1)} km from its ridge`,
    )
  }
}
if (mediumMountainPointCount > 4_200 || lowMountainPointCount > 1_440) {
  throw new Error(
    `Mountain geometry budgets exceeded: ${mediumMountainPointCount} medium, ${lowMountainPointCount} low`,
  )
}

if (deserts.length !== 20 || desertGeometries.length !== 20) {
  throw new Error('Expected exactly 20 deserts and geometries')
}
const desertDefinitionsById = new Map(
  desertGeometryDefinitions.map((definition) => [definition.id, definition]),
)
const countDesertPoints = (
  geometry: (typeof desertGeometries)[number]['lowDetailGeometry'],
) =>
  geometry.type === 'Polygon'
    ? geometry.coordinates.flat().length
    : geometry.coordinates.flat(2).length
let lowDetailDesertPointCount = 0
for (const desert of deserts) {
  const geometry = desertGeometries.find(
    (candidate) => candidate.id === desert.id,
  )
  const definition = desertDefinitionsById.get(desert.id)
  if (!geometry || !definition) {
    throw new Error(`Missing desert geometry or mapping for ${desert.id}`)
  }
  if (
    geometry.provenance.archiveVersion !==
      NATURAL_EARTH_DESERT_ARCHIVE_VERSION ||
    geometry.provenance.archiveSha256 !== NATURAL_EARTH_DESERT_ARCHIVE_SHA256 ||
    geometry.provenance.naturalEarthNeId !== definition.naturalEarthNeId
  ) {
    throw new Error(`Unexpected desert provenance on ${desert.id}`)
  }
  if (
    !geoContains(
      { type: 'Feature', properties: {}, geometry: geometry.geometry } as never,
      [desert.center.longitude, desert.center.latitude],
    )
  ) {
    throw new Error(`Desert center is outside its geometry on ${desert.id}`)
  }
  const lowPointCount = countDesertPoints(geometry.lowDetailGeometry)
  if (lowPointCount > definition.lowDetailMaximumPoints) {
    throw new Error(
      `${desert.id} exceeds its low-detail point budget: ${lowPointCount}`,
    )
  }
  lowDetailDesertPointCount += lowPointCount
  for (const countryCode of desert.countryCodes) {
    if (!countryCodes.has(countryCode)) {
      throw new Error(`Unknown country ${countryCode} on ${desert.id}`)
    }
  }
  for (const sourceId of desert.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`Unknown source ${sourceId} on desert ${desert.id}`)
    }
  }
}
if (lowDetailDesertPointCount > 3_600) {
  throw new Error(
    `Desert low-detail point budget exceeded: ${lowDetailDesertPointCount}`,
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
  sea: 26,
  gulf: 4,
  bay: 2,
  lake: 20,
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
const surfaceWaterbodyIds = new Set(
  waterbodies
    .filter((waterbody) => waterbody.kind !== 'trench')
    .map((waterbody) => waterbody.id),
)
if (
  waterbodyGeometryDefinitions.length !== 67 ||
  waterbodyGeometryDefinitions.some(
    (definition) => !surfaceWaterbodyIds.has(definition.id),
  )
) {
  throw new Error('Surface waterbody geometry definitions do not match data')
}

const countSurfacePoints = (
  geometry: Extract<
    (typeof waterbodyGeometries)[number],
    { kind: 'surface' }
  >['geometry'],
) =>
  geometry.type === 'Polygon'
    ? geometry.coordinates.reduce((total, ring) => total + ring.length, 0)
    : geometry.coordinates.reduce(
        (total, polygon) =>
          total +
          polygon.reduce((polygonTotal, ring) => polygonTotal + ring.length, 0),
        0,
      )

let lowDetailWaterbodyPointCount = 0
for (const geometry of waterbodyGeometries) {
  if (geometry.kind !== 'surface') continue
  const waterbody = waterbodies.find((item) => item.id === geometry.id)!
  const maximumPoints =
    waterbody.kind === 'ocean'
      ? 600
      : waterbody.kind === 'strait'
        ? 100
        : waterbody.kind === 'lake'
          ? 120
          : 300
  const lowPointCount = countSurfacePoints(geometry.lowDetailGeometry)
  if (lowPointCount > maximumPoints) {
    throw new Error(
      `${geometry.id} exceeds its low-detail point budget: ${lowPointCount}`,
    )
  }
  const expectedArchiveSha256 =
    waterbody.kind === 'lake'
      ? NATURAL_EARTH_LAKES_ARCHIVE_SHA256
      : NATURAL_EARTH_MARINE_ARCHIVE_SHA256
  if (geometry.provenance.archiveSha256 !== expectedArchiveSha256) {
    throw new Error(`Unexpected archive SHA on ${geometry.id}`)
  }
  lowDetailWaterbodyPointCount += lowPointCount
}
if (lowDetailWaterbodyPointCount > 11_000) {
  throw new Error(
    `Waterbody low-detail point budget exceeded: ${lowDetailWaterbodyPointCount}`,
  )
}

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

for (const landmark of landmarks) {
  if (!countryCodes.has(landmark.countryCode)) {
    throw new Error(
      `Unknown country ${landmark.countryCode} on landmark ${landmark.id}`,
    )
  }
  for (const sourceId of landmark.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`Unknown source ${sourceId} on landmark ${landmark.id}`)
    }
  }
}

if (climateTypes.length !== 13 || climateSources.length < 2) {
  throw new Error('Expected 13 sourced climate types')
}
const climateSourceIds = new Set(climateSources.map((source) => source.id))
const climateColors = new Set<string>()
for (const climateType of climateTypes) {
  if (climateColors.has(climateType.color)) {
    throw new Error(`Duplicate climate color ${climateType.color}`)
  }
  climateColors.add(climateType.color)
  for (const climateSourceId of climateType.sourceIds) {
    if (!climateSourceIds.has(climateSourceId)) {
      throw new Error(
        `Unknown climate source ${climateSourceId} on ${climateType.id}`,
      )
    }
  }
}
const climateRasterAssets = [
  ...Object.values(climateLayerManifest.assets),
  ...(['balanced', 'low'] as const).flatMap((quality) =>
    climateTypeIds.flatMap((climateTypeId) => [
      climateLayerManifest.highlightAssets[quality][climateTypeId],
      climateLayerManifest.highlightBoundaryAssets[quality][climateTypeId],
    ]),
  ),
]
for (const asset of climateRasterAssets) {
  const assetPath = path.join(projectRoot, 'public', asset.url)
  const bytes = await readFile(assetPath)
  if (bytes.byteLength !== asset.bytes) {
    throw new Error(`Climate asset size mismatch for ${asset.url}`)
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== asset.sha256) {
    throw new Error(`Climate asset SHA-256 mismatch for ${asset.url}`)
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
  if (!sourceIds.has(country.populationSourceId)) {
    throw new Error(
      `Unknown population source ${country.populationSourceId} on ${country.code}`,
    )
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
  `Validated ${countries.length} complete country cards, ${cities.length} capital and reviewed city entries, ${waterbodies.length} waterbodies, ${linearGeoFeatures.length} rivers and canals, ${mountainRanges.length} mountain ranges, ${deserts.length} deserts, ${landmarks.length} landmarks, ${climateTypes.length} climate types, ${priorityCityTotal} entries across 50 priority countries, ${featuredCodes.length} featured entries, ${sources.length} sources, ${boundaries.features.length} boundaries, and all local assets.`,
)
