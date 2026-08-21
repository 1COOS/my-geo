import {
  geographyReferenceLines,
  getReferenceLineScenePoints,
} from '../data/geographyLearning'
import type {
  ReferenceLine,
  ReferenceLineId,
} from '../data/geographyLearningSchema'
import { addGeographicPathAltitude } from './geographicPathStyle'

export type GeographyReferencePath = {
  referenceLineId: ReferenceLineId
  category: ReferenceLine['category']
  interactionOnly: boolean
  points: ReturnType<typeof addGeographicPathAltitude>
  color: string
  stroke: number
  dashLength: number
  dashGap: number
}

const categoryColors: Record<ReferenceLine['category'], string> = {
  equator: '#ffd65a',
  tropic: '#ffae42',
  'polar-circle': '#8ce9ff',
  'latitude-zone-boundary': '#8ba9be',
  'longitude-origin': '#e8f6ff',
  'hemisphere-boundary': '#d291ff',
}

export function getGeographyReferencePaths(
  quality: 'balanced' | 'low',
  selectedReferenceLineId: ReferenceLineId | null,
): GeographyReferencePath[] {
  return geographyReferenceLines.map((line) => {
    const selected = line.id === selectedReferenceLineId
    const dashed =
      line.category === 'hemisphere-boundary' ||
      line.category === 'latitude-zone-boundary'
    const altitude = selected ? 0.082 : 0.071
    return {
      referenceLineId: line.id,
      category: line.category,
      interactionOnly: false,
      points: addGeographicPathAltitude(
        getReferenceLineScenePoints(line),
        altitude,
      ),
      color: selected ? '#ffffff' : categoryColors[line.category],
      stroke: selected
        ? quality === 'balanced'
          ? 1.7
          : 1.25
        : line.category === 'latitude-zone-boundary'
          ? quality === 'balanced'
            ? 0.42
            : 0.3
          : quality === 'balanced'
            ? 0.8
            : 0.6,
      dashLength: dashed ? 0.08 : 1,
      dashGap: dashed ? 0.055 : 0,
    }
  })
}

export function getGeographyReferenceHitPaths(touchDevice: boolean) {
  return geographyReferenceLines.map((line): GeographyReferencePath => ({
    referenceLineId: line.id,
    category: line.category,
    interactionOnly: true,
    points: addGeographicPathAltitude(getReferenceLineScenePoints(line), 0.069),
    color: 'rgba(255,255,255,0)',
    stroke: touchDevice ? 18 : 10,
    dashLength: 1,
    dashGap: 0,
  }))
}

export function getGeographyScenePaths(
  quality: 'balanced' | 'low',
  selectedReferenceLineId: ReferenceLineId | null,
  touchDevice: boolean,
  visible: boolean,
) {
  if (!visible) return []
  return [
    ...getGeographyReferenceHitPaths(touchDevice),
    ...getGeographyReferencePaths(quality, selectedReferenceLineId),
  ]
}

export function getGeographyPointerDragThreshold(pointerType: string) {
  return pointerType === 'touch' ? 10 : 6
}

export function getGeographyCanvasCursor(
  referenceLineId: ReferenceLineId | null,
) {
  return referenceLineId ? 'pointer' : ''
}

export function hasExceededGeographyDragThreshold(
  start: { x: number; y: number; pointerType: string },
  current: { x: number; y: number },
) {
  return (
    Math.hypot(current.x - start.x, current.y - start.y) >=
    getGeographyPointerDragThreshold(start.pointerType)
  )
}

export function getReferenceLineIdForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  if (layer !== 'path' || !value) return null
  const id = (value as { referenceLineId?: unknown }).referenceLineId
  return typeof id === 'string' ? (id as ReferenceLineId) : null
}

export const geographyCoordinateLabels = [
  ...[-60, -30, 30, 60].map((latitude) => ({
    id: `latitude-${latitude}`,
    latitude,
    longitude: -135,
    label: `${Math.abs(latitude)}°${latitude > 0 ? 'N' : 'S'}`,
  })),
  ...[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((longitude) => ({
    id: `longitude-${longitude}`,
    latitude: -12,
    longitude,
    label:
      longitude === 0
        ? '0°'
        : `${Math.abs(longitude)}°${longitude > 0 ? 'E' : 'W'}`,
  })),
]
