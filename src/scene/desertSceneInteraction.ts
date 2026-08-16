import type { Desert, DesertGeometry } from '../data/desertSchema'

export type DesertLayerVisibility = {
  showDesertLayer: boolean
}

export function getVisibleDeserts(
  deserts: readonly Desert[],
  visibility: DesertLayerVisibility,
) {
  return visibility.showDesertLayer ? [...deserts] : []
}

export function getDesertIdForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  return layer === 'polygon'
    ? ((value as { properties?: { desertId?: string } } | undefined)?.properties
        ?.desertId ?? null)
    : null
}

export function getDesertPolygonState(
  value: object | undefined,
  selectedDesertId: string | null,
  hoveredDesertId: string | null,
) {
  const desertId = getDesertIdForLayer('polygon', value)
  if (!desertId) return null
  if (desertId === selectedDesertId) return 'selected' as const
  if (desertId === hoveredDesertId) return 'hovered' as const
  return 'ordinary' as const
}

export function getDesertGeometryForScene(
  geometry: DesertGeometry,
  quality: 'balanced' | 'low',
) {
  return quality === 'low' ? geometry.lowDetailGeometry : geometry.geometry
}
