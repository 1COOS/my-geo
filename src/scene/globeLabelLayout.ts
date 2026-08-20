import type { City } from '../data/citySchema'
import type { Desert } from '../data/desertSchema'
import type {
  ReferenceLine,
  ReferenceLineId,
} from '../data/geographyLearningSchema'
import type { Landmark } from '../data/landmarkSchema'
import type { LinearGeoFeature } from '../data/linearGeoFeatureSchema'
import type { MountainRange } from '../data/mountainRangeSchema'
import type { Waterbody } from '../data/waterbodySchema'
import { getLandmarkLabelPriority } from './landmarkSceneInteraction'

export type MapLabel =
  | {
      id: string
      type: 'city'
      latitude: number
      longitude: number
      city: City
    }
  | {
      id: string
      type: 'waterbody'
      latitude: number
      longitude: number
      waterbody: Waterbody
    }
  | {
      id: string
      type: 'linearFeature'
      latitude: number
      longitude: number
      feature: LinearGeoFeature
    }
  | {
      id: string
      type: 'mountainRange'
      latitude: number
      longitude: number
      range: MountainRange
    }
  | {
      id: string
      type: 'desert'
      latitude: number
      longitude: number
      desert: Desert
    }
  | {
      id: string
      type: 'landmark'
      latitude: number
      longitude: number
      landmark: Landmark
    }
  | {
      id: string
      type: 'referenceLine'
      latitude: number
      longitude: number
      line: ReferenceLine
    }
  | {
      id: string
      type: 'coordinateLabel'
      latitude: number
      longitude: number
      label: string
    }

export type LabelRect = {
  left: number
  top: number
  right: number
  bottom: number
}

export type LabelGroup =
  | 'capital'
  | 'city'
  | 'ocean'
  | 'lake'
  | 'waterway'
  | 'river'
  | 'canal'
  | 'mountain'
  | 'desert'
  | 'landmark'
  | 'geography'

export function getLabelGroup(item: MapLabel): LabelGroup {
  if (item.type === 'city') return item.city.isCapital ? 'capital' : 'city'
  if (item.type === 'waterbody') return item.waterbody.layer
  if (item.type === 'linearFeature') return item.feature.kind
  if (item.type === 'mountainRange') return 'mountain'
  if (item.type === 'referenceLine' || item.type === 'coordinateLabel') {
    return 'geography'
  }
  return item.type
}

export function getMapLabelName(item: MapLabel) {
  if (item.type === 'city') return item.city.name.zh
  if (item.type === 'waterbody') return item.waterbody.name.zh
  if (item.type === 'linearFeature') return item.feature.name.zh
  if (item.type === 'mountainRange') return item.range.name.zh
  if (item.type === 'desert') return item.desert.name.zh
  if (item.type === 'landmark') return item.landmark.name.zh
  if (item.type === 'referenceLine') return item.line.shortLabel
  return item.label
}

export function labelRectsOverlap(left: LabelRect, right: LabelRect) {
  return !(
    left.right < right.left ||
    left.left > right.right ||
    left.bottom < right.top ||
    left.top > right.bottom
  )
}

type LabelPriorityState = {
  selectedCityId: string | null
  hoveredCityId: string | null
  selectedWaterbodyId: string | null
  hoveredWaterbodyId: string | null
  selectedLinearFeatureId: string | null
  hoveredLinearFeatureId: string | null
  selectedMountainRangeId: string | null
  hoveredMountainRangeId: string | null
  selectedDesertId: string | null
  hoveredDesertId: string | null
  selectedLandmarkId: string | null
  hoveredLandmarkId: string | null
  selectedReferenceLineId: ReferenceLineId | null
}

export function getLabelPriority(
  item: MapLabel,
  {
    selectedCityId,
    hoveredCityId,
    selectedWaterbodyId,
    hoveredWaterbodyId,
    selectedLinearFeatureId,
    hoveredLinearFeatureId,
    selectedMountainRangeId,
    hoveredMountainRangeId,
    selectedDesertId,
    hoveredDesertId,
    selectedLandmarkId,
    hoveredLandmarkId,
    selectedReferenceLineId,
  }: LabelPriorityState,
) {
  if (
    item.type === 'referenceLine' &&
    item.line.id === selectedReferenceLineId
  ) {
    return 0
  }
  if (item.type === 'referenceLine') {
    return item.line.category === 'latitude-zone-boundary' ? 4.5 : 1.4
  }
  if (item.type === 'coordinateLabel') return 6
  if (item.type === 'landmark') {
    return getLandmarkLabelPriority(item.landmark, {
      selectedLandmarkId,
      hoveredLandmarkId,
    })
  }
  if (
    item.id === selectedCityId ||
    item.id === selectedWaterbodyId ||
    item.id === selectedLinearFeatureId ||
    item.id === selectedMountainRangeId ||
    item.id === selectedDesertId ||
    item.id === selectedLandmarkId
  ) {
    return 0
  }
  if (
    item.id === hoveredCityId ||
    item.id === hoveredWaterbodyId ||
    item.id === hoveredLinearFeatureId ||
    item.id === hoveredMountainRangeId ||
    item.id === hoveredDesertId ||
    item.id === hoveredLandmarkId
  ) {
    return 1
  }
  if (item.type === 'waterbody') return 2 + item.waterbody.labelPriority / 100
  if (item.type === 'linearFeature') {
    return 2.5 + item.feature.labelPriority / 100
  }
  if (item.type === 'mountainRange') {
    return 2.7 + item.range.labelPriority / 100
  }
  if (item.type === 'desert') return 2.8 + item.desert.labelPriority / 100
  return (item.city.isCapital ? 3 : 10) + item.city.order / 10
}
