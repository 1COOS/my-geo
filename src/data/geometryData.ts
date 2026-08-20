import countryBoundariesJson from './generated/country-boundaries.json'
import desertGeometriesJson from './generated/desert-geometries.json'
import mountainGeometriesJson from './generated/mountain-geometries.json'
import riverGeometriesJson from './generated/river-geometries.json'
import waterbodyGeometriesJson from './generated/waterbody-geometries.json'
import { countryBoundariesSchema } from './countrySchema'
import { desertGeometryCatalogSchema } from './desertSchema'
import { getEmbeddedLinearFeatureGeometries } from './linearGeoFeatures'
import { linearGeoFeatureGeometryCatalogSchema } from './linearGeoFeatureSchema'
import { mountainRangeGeometryCatalogSchema } from './mountainRangeSchema'
import { getEmbeddedWaterbodyGeometries } from './waterbodies'
import { waterbodyGeometryCatalogSchema } from './waterbodySchema'

export const countryBoundaries = countryBoundariesSchema.parse(
  countryBoundariesJson,
)

export const waterbodyGeometries = waterbodyGeometryCatalogSchema.parse([
  ...waterbodyGeometriesJson,
  ...getEmbeddedWaterbodyGeometries(),
])

export const linearGeoFeatureGeometries =
  linearGeoFeatureGeometryCatalogSchema.parse([
    ...riverGeometriesJson,
    ...getEmbeddedLinearFeatureGeometries(),
  ])

export const mountainRangeGeometries = mountainRangeGeometryCatalogSchema.parse(
  mountainGeometriesJson,
)

export const desertGeometries =
  desertGeometryCatalogSchema.parse(desertGeometriesJson)

const linearGeometryById = new Map(
  linearGeoFeatureGeometries.map((geometry) => [geometry.id, geometry]),
)
const mountainGeometryById = new Map(
  mountainRangeGeometries.map((geometry) => [geometry.id, geometry]),
)

export function getLinearGeoFeatureGeometry(id: string | null | undefined) {
  return id ? linearGeometryById.get(id) : undefined
}

export function getMountainRangeGeometry(id: string | null | undefined) {
  return id ? (mountainGeometryById.get(id) ?? null) : null
}
