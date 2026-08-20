import type { LinearGeoFeatureGeometry } from './linearGeoFeatureSchema'

export const MIN_CANAL_CAMERA_DISTANCE = 160
export const MAX_CANAL_CAMERA_DISTANCE = 235

type LinearGeometry = LinearGeoFeatureGeometry['geometry']

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
