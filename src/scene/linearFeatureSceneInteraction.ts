import type { LinearGeoFeatureGeometry } from '../data/linearGeoFeatureSchema'
export {
  getCanalCameraDistance,
  getLinearFeatureAngularSpan,
  MAX_CANAL_CAMERA_DISTANCE,
  MIN_CANAL_CAMERA_DISTANCE,
} from '../data/linearFeatureGeometry'

type LinearGeometry = LinearGeoFeatureGeometry['geometry']

export type LinearFeatureEndpoint = {
  longitude: number
  latitude: number
}

export type LinearFeatureEndpointPair = {
  start: LinearFeatureEndpoint
  end: LinearFeatureEndpoint
}

export type ScreenPoint = {
  x: number
  y: number
}

export function getLinearFeatureEndpoints(
  geometry: LinearGeometry | null | undefined,
) {
  const lines = geometry?.coordinates.filter((line) => line.length > 0) ?? []
  const first = lines[0]?.[0]
  const lastLine = lines.at(-1)
  const last = lastLine?.at(-1)
  if (!first || !last) return null

  return {
    start: { longitude: first[0], latitude: first[1] },
    end: { longitude: last[0], latitude: last[1] },
  } satisfies {
    start: LinearFeatureEndpoint
    end: LinearFeatureEndpoint
  }
}

export function getLinearFeatureEndpointPairs(
  geometry: LinearGeometry | null | undefined,
) {
  return (geometry?.coordinates ?? []).flatMap((line) => {
    const first = line[0]
    const last = line.at(-1)
    return first && last
      ? [
          {
            start: { longitude: first[0], latitude: first[1] },
            end: { longitude: last[0], latitude: last[1] },
          } satisfies LinearFeatureEndpointPair,
        ]
      : []
  })
}

export function getLinearFeatureGeometryForScene(
  geometry: LinearGeoFeatureGeometry,
  quality: 'balanced' | 'low',
  selected: boolean,
) {
  if (selected) return geometry.geometry
  return quality === 'low'
    ? geometry.lowDetailGeometry
    : geometry.mediumDetailGeometry
}

export function getSelectedLinearFeatureLabelOffset(
  projectedPoints: readonly ScreenPoint[],
) {
  const start = projectedPoints[0]
  const end = projectedPoints.at(-1)
  if (!start || !end) return { x: 18, y: -42 }

  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const length = Math.hypot(deltaX, deltaY)
  if (length < 0.01) return { x: 18, y: -42 }

  let perpendicularX = -deltaY / length
  let perpendicularY = deltaX / length
  if (perpendicularY > 0) {
    perpendicularX *= -1
    perpendicularY *= -1
  }

  return {
    x: perpendicularX * 18,
    y: perpendicularY * 18 - 38,
  }
}
