import { geoEquirectangular, geoPath, type GeoProjection } from 'd3-geo'

import type { CountryBoundary } from '../../data/countrySchema'

export type KnowledgeRegionMapPosition = {
  latitude: number
  longitude: number
}

export type KnowledgeRegionMapViewport = {
  width: number
  height: number
}

export type KnowledgeRegionMapProjection = KnowledgeRegionMapViewport & {
  projection: GeoProjection
  path: ReturnType<typeof geoPath>
}

export function getCircularMeanLongitude(
  positions: readonly KnowledgeRegionMapPosition[],
) {
  if (positions.length === 0) return 0

  const vector = positions.reduce(
    (current, position) => {
      const radians = (position.longitude * Math.PI) / 180
      return {
        x: current.x + Math.cos(radians),
        y: current.y + Math.sin(radians),
      }
    },
    { x: 0, y: 0 },
  )

  if (Math.hypot(vector.x, vector.y) < 0.000001) {
    return positions[0].longitude
  }
  return (Math.atan2(vector.y, vector.x) * 180) / Math.PI
}

export function createKnowledgeRegionMapProjection({
  boundaries,
  positions,
  viewport,
}: {
  boundaries: readonly CountryBoundary[]
  positions: readonly KnowledgeRegionMapPosition[]
  viewport: KnowledgeRegionMapViewport
}): KnowledgeRegionMapProjection {
  const width = Math.max(1, Math.round(viewport.width))
  const height = Math.max(1, Math.round(viewport.height))
  const padding = Math.max(8, Math.min(width, height) * 0.08)
  const centerLongitude = getCircularMeanLongitude(positions)
  const projection = geoEquirectangular()
    .rotate([-centerLongitude, 0])
    .precision(0.1)
  const fitFeatures = [
    ...boundaries,
    ...positions.map((position, index) => ({
      type: 'Feature' as const,
      properties: { id: `region-center-${index}` },
      geometry: {
        type: 'Point' as const,
        coordinates: [position.longitude, position.latitude],
      },
    })),
  ]

  projection
    .fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      { type: 'FeatureCollection', features: fitFeatures } as never,
    )
    .clipExtent([
      [0, 0],
      [width, height],
    ])

  return { width, height, projection, path: geoPath(projection) }
}

export function projectKnowledgeRegionMapPosition(
  projection: GeoProjection,
  position: KnowledgeRegionMapPosition,
) {
  return projection([position.longitude, position.latitude])
}
