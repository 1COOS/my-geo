import type { Landmark } from '../data/landmarkSchema'

export const LANDMARK_CAMERA_DISTANCE = 185

export type LandmarkMarker = {
  markerType: 'landmark'
  landmarkId: string
  lat: number
  lng: number
  name: string
}

export function getVisibleLandmarks(
  landmarks: readonly Landmark[],
  visibility: { showLandmarkLayer: boolean },
) {
  return visibility.showLandmarkLayer ? [...landmarks] : []
}

export function getLandmarkMarker(value: object | undefined) {
  const marker = value as LandmarkMarker | undefined
  return marker?.markerType === 'landmark' && marker.landmarkId ? marker : null
}

export function getLandmarkIdForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  return layer === 'point'
    ? (getLandmarkMarker(value)?.landmarkId ?? null)
    : null
}

export function getLandmarkLabelPriority(
  landmark: Landmark,
  state: {
    selectedLandmarkId: string | null
    hoveredLandmarkId: string | null
  },
) {
  if (landmark.id === state.selectedLandmarkId) return 0
  if (landmark.id === state.hoveredLandmarkId) return 1
  return 2.6 + landmark.labelPriority / 100
}
