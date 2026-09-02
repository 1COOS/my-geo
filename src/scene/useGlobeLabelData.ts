import { useMemo } from 'react'

import { cities } from '../data/countries'
import { deserts } from '../data/deserts'
import { geographyReferenceLines } from '../data/geographyLearning'
import { landmarks } from '../data/landmarks'
import { linearGeoFeatures } from '../data/linearGeoFeatures'
import { mountainRanges } from '../data/mountainRanges'
import { waterbodies } from '../data/waterbodies'
import type { ClimateTypeId } from '../data/climateLearningSchema'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../data/geographyLearningSchema'
import {
  getVisibleLayerCities,
  getVisibleLayerWaterbodies,
  getVisibleLinearFeatures,
} from './countrySceneInteraction'
import { getVisibleDeserts } from './desertSceneInteraction'
import { geographyCoordinateLabels } from './geographyLearningScene'
import { getVisibleLandmarks } from './landmarkSceneInteraction'
import { getVisibleMountainRanges } from './mountainSceneInteraction'
import type { MapLabel } from './globeLabelLayout'

type GlobeLabelDataInput = {
  quality: 'balanced' | 'low'
  showCapitals: boolean
  showCities: boolean
  showOceanLayer: boolean
  showLakeLayer: boolean
  showWaterwayLayer: boolean
  showRiverAndCanalLayer: boolean
  showMountainLayer: boolean
  showDesertLayer: boolean
  showLandmarkLayer: boolean
  showGeographyLearningLayer: boolean
  selectedClimateTypeId: ClimateTypeId | null
  selectedGeographyTopicId: GeographyTopicId | null
  selectedReferenceLineId: ReferenceLineId | null
  selectedWaterbodyId: string | null
  hoveredWaterbodyId: string | null
  selectedLinearFeatureId: string | null
  hoveredLinearFeatureId: string | null
  selectedMountainRangeId: string | null
  hoveredMountainRangeId: string | null
}

export function useGlobeLabelData(input: GlobeLabelDataInput) {
  const labelCities = useMemo(
    () =>
      getVisibleLayerCities(cities, {
        showCapitals: input.showCapitals,
        showCities: input.showCities,
      }),
    [input.showCapitals, input.showCities],
  )
  const labelWaterbodies = useMemo(
    () =>
      getVisibleLayerWaterbodies(waterbodies, {
        showOceanLayer: input.showOceanLayer,
        showLakeLayer: input.showLakeLayer,
        showWaterwayLayer: input.showWaterwayLayer,
        selectedWaterbodyId: input.selectedWaterbodyId,
        hoveredWaterbodyId: input.hoveredWaterbodyId,
      }),
    [
      input.hoveredWaterbodyId,
      input.selectedWaterbodyId,
      input.showLakeLayer,
      input.showOceanLayer,
      input.showWaterwayLayer,
    ],
  )
  const labelLinearFeatures = useMemo(
    () =>
      getVisibleLinearFeatures(linearGeoFeatures, {
        showRiverAndCanalLayer: input.showRiverAndCanalLayer,
        selectedLinearFeatureId: input.selectedLinearFeatureId,
        hoveredLinearFeatureId: input.hoveredLinearFeatureId,
      }),
    [
      input.hoveredLinearFeatureId,
      input.selectedLinearFeatureId,
      input.showRiverAndCanalLayer,
    ],
  )
  const labelMountainRanges = useMemo(
    () =>
      getVisibleMountainRanges(mountainRanges, {
        showMountainLayer: input.showMountainLayer,
        selectedMountainRangeId: input.selectedMountainRangeId,
        hoveredMountainRangeId: input.hoveredMountainRangeId,
      }),
    [
      input.hoveredMountainRangeId,
      input.selectedMountainRangeId,
      input.showMountainLayer,
    ],
  )
  const labelDeserts = useMemo(
    () =>
      getVisibleDeserts(deserts, { showDesertLayer: input.showDesertLayer }),
    [input.showDesertLayer],
  )
  const labelLandmarks = useMemo(
    () =>
      getVisibleLandmarks(landmarks, {
        showLandmarkLayer: input.showLandmarkLayer,
      }),
    [input.showLandmarkLayer],
  )
  const labelReferenceLines = useMemo(
    () => (input.showGeographyLearningLayer ? geographyReferenceLines : []),
    [input.showGeographyLearningLayer],
  )
  const labelCoordinateItems = useMemo(
    () =>
      input.showGeographyLearningLayer
        ? input.quality === 'balanced'
          ? geographyCoordinateLabels
          : geographyCoordinateLabels.filter(
              (item) =>
                item.label === '0°' ||
                item.label.startsWith('60°') ||
                item.label.startsWith('120°'),
            )
        : [],
    [input.quality, input.showGeographyLearningLayer],
  )
  const labelItems = useMemo<MapLabel[]>(
    () => [
      ...labelCities.map((city) => ({
        id: city.id,
        type: 'city' as const,
        latitude: city.latitude,
        longitude: city.longitude,
        city,
      })),
      ...labelWaterbodies.map((waterbody) => ({
        id: waterbody.id,
        type: 'waterbody' as const,
        latitude: waterbody.center.latitude,
        longitude: waterbody.center.longitude,
        waterbody,
      })),
      ...labelLinearFeatures.map((feature) => ({
        id: feature.id,
        type: 'linearFeature' as const,
        latitude: feature.labelPosition.latitude,
        longitude: feature.labelPosition.longitude,
        feature,
      })),
      ...labelMountainRanges.map((range) => ({
        id: range.id,
        type: 'mountainRange' as const,
        latitude: range.labelPosition.latitude,
        longitude: range.labelPosition.longitude,
        range,
      })),
      ...labelDeserts.map((desert) => ({
        id: desert.id,
        type: 'desert' as const,
        latitude: desert.center.latitude,
        longitude: desert.center.longitude,
        desert,
      })),
      ...labelLandmarks.map((landmark) => ({
        id: landmark.id,
        type: 'landmark' as const,
        latitude: landmark.position.latitude,
        longitude: landmark.position.longitude,
        landmark,
      })),
      ...labelReferenceLines.map((line) => ({
        id: `reference-${line.id}`,
        type: 'referenceLine' as const,
        latitude: line.anchorPosition.latitude,
        longitude: line.anchorPosition.longitude,
        line,
      })),
      ...labelCoordinateItems.map((item) => ({
        ...item,
        id: `coordinate-${item.id}`,
        type: 'coordinateLabel' as const,
      })),
    ],
    [
      labelCities,
      labelCoordinateItems,
      labelDeserts,
      labelLandmarks,
      labelLinearFeatures,
      labelMountainRanges,
      labelReferenceLines,
      labelWaterbodies,
    ],
  )

  return {
    labelCities,
    labelWaterbodies,
    labelLinearFeatures,
    labelMountainRanges,
    labelDeserts,
    labelLandmarks,
    labelReferenceLines,
    labelCoordinateItems,
    labelItems,
  }
}

export type GlobeLabelData = ReturnType<typeof useGlobeLabelData>
