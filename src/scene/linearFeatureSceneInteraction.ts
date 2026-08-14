import type { LinearGeoFeatureGeometry } from '../data/linearGeoFeatureSchema'

export const MIN_CANAL_CAMERA_DISTANCE = 160
export const MAX_CANAL_CAMERA_DISTANCE = 235

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

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function getAngularDistance(
  left: readonly [number, number],
  right: readonly [number, number],
) {
  const leftLatitude = toRadians(left[1])
  const rightLatitude = toRadians(right[1])
  const latitudeDelta = rightLatitude - leftLatitude
  const longitudeDelta = toRadians(right[0] - left[0])
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) *
      Math.cos(rightLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return (2 * Math.asin(Math.min(1, Math.sqrt(haversine))) * 180) / Math.PI
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

export function getLinearFeatureAngularSpan(
  geometry: LinearGeometry | null | undefined,
) {
  const points = geometry?.coordinates.flat() ?? []
  let maximumSpan = 0

  for (let leftIndex = 0; leftIndex < points.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < points.length;
      rightIndex += 1
    ) {
      maximumSpan = Math.max(
        maximumSpan,
        getAngularDistance(points[leftIndex], points[rightIndex]),
      )
    }
  }

  return maximumSpan
}

function interpolate(
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number,
) {
  const progress = Math.min(
    1,
    Math.max(0, (value - inputStart) / (inputEnd - inputStart)),
  )
  return outputStart + (outputEnd - outputStart) * progress
}

export function getCanalCameraDistance(
  geometry: LinearGeometry | null | undefined,
) {
  const span = getLinearFeatureAngularSpan(geometry)

  if (span <= 0.2) return interpolate(span, 0, 0.2, 160, 166)
  if (span <= 0.45) return interpolate(span, 0.2, 0.45, 166, 174)
  if (span <= 2) return interpolate(span, 0.45, 2, 174, 192)
  return interpolate(span, 2, 10, 192, MAX_CANAL_CAMERA_DISTANCE)
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
