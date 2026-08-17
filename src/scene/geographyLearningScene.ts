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
      points: addGeographicPathAltitude(
        getReferenceLineScenePoints(line),
        altitude,
      ),
      color: selected ? '#ffffff' : categoryColors[line.category],
      stroke: selected
        ? quality === 'balanced'
          ? 1.1
          : 0.82
        : line.category === 'latitude-zone-boundary'
          ? quality === 'balanced'
            ? 0.24
            : 0.16
          : quality === 'balanced'
            ? 0.52
            : 0.36,
      dashLength: dashed ? 0.08 : 1,
      dashGap: dashed ? 0.055 : 0,
    }
  })
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
