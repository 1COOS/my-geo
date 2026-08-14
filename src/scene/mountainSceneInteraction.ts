import type {
  MountainRange,
  MountainRangeGeometry,
} from '../data/mountainRangeSchema'

export type MountainLayerVisibility = {
  showMountainLayer: boolean
  selectedMountainRangeId: string | null
  hoveredMountainRangeId: string | null
}

export function getVisibleMountainRanges(
  ranges: readonly MountainRange[],
  visibility: MountainLayerVisibility,
) {
  return ranges.filter(
    (range) =>
      visibility.showMountainLayer ||
      range.id === visibility.selectedMountainRangeId ||
      range.id === visibility.hoveredMountainRangeId,
  )
}

export function getMountainRangeIdForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  return layer === 'path'
    ? ((value as { mountainRangeId?: string } | undefined)?.mountainRangeId ??
        null)
    : null
}

export function getMountainGeometryForScene(
  geometry: MountainRangeGeometry,
  quality: 'balanced' | 'low',
  selected: boolean,
) {
  if (selected) return geometry.geometry
  return quality === 'low'
    ? geometry.lowDetailGeometry
    : geometry.mediumDetailGeometry
}
