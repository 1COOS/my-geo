import {
  geographyReferenceLines,
  getReferenceLineScenePoints,
} from '../data/geographyLearning'
import type {
  ReferenceLine,
  ReferenceLineId,
} from '../data/geographyLearningSchema'
import type { GeoPosition } from '../shared/types/geo'
import type { Intersection, Object3D, Raycaster } from 'three'
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
          ? 2.6
          : 2
        : quality === 'balanced'
          ? 1.2
          : 0.9,
      dashLength: dashed ? 0.08 : 1,
      dashGap: dashed ? 0.055 : 0,
    }
  })
}

export function getGeographyScenePaths(
  quality: 'balanced' | 'low',
  selectedReferenceLineId: ReferenceLineId | null,
  visible: boolean,
) {
  if (!visible) return []
  return getGeographyReferencePaths(quality, selectedReferenceLineId)
}

type GlobePathGroup = Object3D & {
  __globeObjType?: string
  __data?: unknown
}

type RaycastableLine = Object3D & {
  material?: { linewidth?: number }
}

type Line2RaycasterParams = Raycaster['params'] & {
  Line2?: { threshold?: number }
}

const originalRaycasts = new WeakMap<
  RaycastableLine,
  RaycastableLine['raycast']
>()
const geographyHitWidths = new WeakMap<RaycastableLine, number>()

function hasReferenceLineId(value: unknown): value is GeographyReferencePath {
  if (!value || typeof value !== 'object') return false
  const referenceLineId = (value as { referenceLineId?: unknown })
    .referenceLineId
  return (
    typeof referenceLineId === 'string' &&
    geographyReferenceLines.some((line) => line.id === referenceLineId)
  )
}

export function getGeographyLineHitWidth(touchDevice: boolean) {
  return touchDevice ? 80 : 48
}

export function getGeographyAngularHitRadius(
  hitRadiusPixels: number,
  globeRadius: number,
  cameraDistance: number,
  viewportHeight: number,
  verticalFovDegrees: number,
) {
  const focalLengthPixels =
    viewportHeight / (2 * Math.tan((verticalFovDegrees * Math.PI) / 360))
  const visibleDistance = Math.max(cameraDistance - globeRadius, globeRadius)
  const pixelsPerSurfaceRadian =
    (focalLengthPixels * globeRadius) / visibleDistance
  return (Math.atan(hitRadiusPixels / pixelsPerSurfaceRadian) * 180) / Math.PI
}

function normalizeLongitudeDelta(longitude: number) {
  return ((longitude + 540) % 360) - 180
}

export function getReferenceLineAngularDistance(
  line: ReferenceLine,
  position: GeoPosition,
) {
  if (line.orientation === 'latitude') {
    return Math.abs(position.latitude - line.coordinate)
  }

  const longitudeDelta = Math.abs(
    normalizeLongitudeDelta(position.longitude - line.coordinate),
  )
  if (longitudeDelta > 90) return 90 - Math.abs(position.latitude)

  const latitudeRadians = (position.latitude * Math.PI) / 180
  const longitudeRadians = (longitudeDelta * Math.PI) / 180
  return (
    (Math.asin(
      Math.min(
        1,
        Math.abs(Math.cos(latitudeRadians) * Math.sin(longitudeRadians)),
      ),
    ) *
      180) /
    Math.PI
  )
}

export function getNearestGeographyReferenceLineId(
  position: GeoPosition,
  maxAngularDistance: number,
) {
  let nearestId: ReferenceLineId | null = null
  let nearestDistance = maxAngularDistance

  for (const line of geographyReferenceLines) {
    const distance = getReferenceLineAngularDistance(line, position)
    if (distance > nearestDistance) continue
    nearestDistance = distance
    nearestId = line.id
  }

  return nearestId
}

export function applyGeographyReferenceLineHitAreas(
  scene: Object3D,
  touchDevice: boolean,
) {
  const hitWidth = getGeographyLineHitWidth(touchDevice)
  let patchedCount = 0

  scene.traverse((object) => {
    const group = object as GlobePathGroup
    if (group.__globeObjType !== 'path' || !hasReferenceLineId(group.__data)) {
      return
    }

    const line = group.children[0] as RaycastableLine | undefined
    if (!line || typeof line.raycast !== 'function') return

    if (!originalRaycasts.has(line)) {
      originalRaycasts.set(line, line.raycast.bind(line))
      line.raycast = function geographyReferenceLineRaycast(
        raycaster: Raycaster,
        intersections: Intersection[],
      ) {
        const originalRaycast = originalRaycasts.get(this)
        const targetWidth = geographyHitWidths.get(this)
        if (!originalRaycast || targetWidth === undefined) return

        const params = raycaster.params as Line2RaycasterParams
        const previousLine2 = params.Line2
        const visibleWidth = this.material?.linewidth ?? 0
        const threshold = Math.max(0, targetWidth - visibleWidth)
        params.Line2 = {
          ...previousLine2,
          threshold: Math.max(previousLine2?.threshold ?? 0, threshold),
        }

        try {
          originalRaycast(raycaster, intersections)
        } finally {
          if (previousLine2) params.Line2 = previousLine2
          else delete params.Line2
        }
      }
    }

    geographyHitWidths.set(line, hitWidth)
    patchedCount += 1
  })

  return patchedCount
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
