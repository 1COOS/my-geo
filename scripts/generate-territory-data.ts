import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import { geoContains } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopology from 'world-atlas/countries-110m.json'

import { territoryBoundaryCatalogSchema } from '../src/data/territorySchema'

type Geometry = {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: unknown[]
}

type SourceFeature = {
  type: 'Feature'
  id?: string | number
  properties: Record<string, unknown>
  geometry: Geometry
}

const projectRoot = path.resolve(import.meta.dirname, '..')
const collection = feature(
  worldTopology as never,
  (worldTopology as { objects: { countries: unknown } }).objects
    .countries as never,
) as unknown as { features: SourceFeature[] }

const byNumericCode = new Map(
  collection.features.map((item) => [String(item.id).padStart(3, '0'), item]),
)

function requiredFeature(numericCode: string) {
  const item = byNumericCode.get(numericCode)
  if (!item) throw new Error(`Missing territory geometry ${numericCode}`)
  return item
}

function featureForTerritory(territoryId: string, geometry: Geometry) {
  return {
    type: 'Feature' as const,
    properties: { territoryId },
    geometry,
  }
}

const france = requiredFeature('250')
if (france.geometry.type !== 'MultiPolygon') {
  throw new Error('Expected France geometry to be a MultiPolygon')
}
const frenchGuianaPolygon = france.geometry.coordinates.find((coordinates) =>
  geoContains(
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates },
    } as never,
    [-53.13, 3.93],
  ),
)
if (!frenchGuianaPolygon) {
  throw new Error('Unable to isolate French Guiana from France geometry')
}

const boundaries = territoryBoundaryCatalogSchema.parse([
  featureForTerritory('greenland', requiredFeature('304').geometry),
  featureForTerritory('puerto-rico', requiredFeature('630').geometry),
  featureForTerritory('french-guiana', {
    type: 'Polygon',
    coordinates: frenchGuianaPolygon as unknown[],
  }),
  featureForTerritory('new-caledonia', requiredFeature('540').geometry),
])

await writeFile(
  path.join(projectRoot, 'src/data/generated/territory-boundaries.json'),
  `${JSON.stringify(boundaries, null, 2)}\n`,
)

console.log(`Generated ${boundaries.length} territory boundaries.`)
