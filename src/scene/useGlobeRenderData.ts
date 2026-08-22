import { useMemo } from 'react'

import { deserts } from '../data/deserts'
import { getWaterbody } from '../data/waterbodies'
import {
  getLinearGeoFeature,
  linearGeoFeatures,
} from '../data/linearGeoFeatures'
import { getMountainRange, mountainRanges } from '../data/mountainRanges'
import {
  getVisibleLinearFeatures,
  type CityMarker,
  type GlobePointMarker,
  type WaterbodyMarker,
} from './countrySceneInteraction'
import {
  getDesertGeometryForScene,
  getVisibleDeserts,
} from './desertSceneInteraction'
import {
  addGeographicPathAltitude,
  getGeographicPathAppearance,
} from './geographicPathStyle'
import { getGeographyScenePaths } from './geographyLearningScene'
import type { GlobeWorldProps } from './GlobeScene'
import type { MapLabel } from './globeLabelLayout'
import type { LandmarkMarker } from './landmarkSceneInteraction'
import { getLinearFeatureGeometryForScene } from './linearFeatureSceneInteraction'
import {
  getMountainGeometryForScene,
  getVisibleMountainRanges,
} from './mountainSceneInteraction'

type UseGlobeRenderDataInput = Pick<
  GlobeWorldProps,
  | 'countryBoundaries'
  | 'waterbodyGeometries'
  | 'linearFeatureGeometries'
  | 'mountainGeometries'
  | 'desertGeometries'
  | 'quality'
  | 'selectedClimatePosition'
  | 'selectedWaterbodyId'
  | 'showDesertLayer'
  | 'selectedLinearFeatureId'
  | 'selectedMountainRangeId'
  | 'showRiverAndCanalLayer'
  | 'hoveredLinearFeatureId'
  | 'showMountainLayer'
  | 'hoveredMountainRangeId'
  | 'selectedReferenceLineId'
  | 'showGeographyLearningLayer'
> & { labelItems: MapLabel[] }

export function useGlobeRenderData({
  countryBoundaries,
  waterbodyGeometries,
  linearFeatureGeometries,
  mountainGeometries,
  desertGeometries,
  quality,
  labelItems,
  selectedClimatePosition,
  selectedWaterbodyId,
  showDesertLayer,
  selectedLinearFeatureId,
  selectedMountainRangeId,
  showRiverAndCanalLayer,
  hoveredLinearFeatureId,
  showMountainLayer,
  hoveredMountainRangeId,
  selectedReferenceLineId,
  showGeographyLearningLayer,
}: UseGlobeRenderDataInput) {
  const pointMarkers = useMemo<GlobePointMarker[]>(() => {
    const markers: GlobePointMarker[] = []
    for (const item of labelItems) {
      if (item.type === 'city') {
        markers.push({
          markerType: 'city',
          cityId: item.city.id,
          countryCode: item.city.countryCode,
          lat: item.city.latitude,
          lng: item.city.longitude,
          name: item.city.name.zh,
          isCapital: item.city.isCapital,
        } satisfies CityMarker)
      } else if (item.type === 'waterbody') {
        markers.push({
          markerType: 'waterbody',
          waterbodyId: item.waterbody.id,
          layer: item.waterbody.layer,
          kind: item.waterbody.kind,
          lat: item.waterbody.center.latitude,
          lng: item.waterbody.center.longitude,
          name: item.waterbody.name.zh,
        } satisfies WaterbodyMarker)
      } else if (item.type === 'landmark') {
        markers.push({
          markerType: 'landmark',
          landmarkId: item.landmark.id,
          lat: item.landmark.position.latitude,
          lng: item.landmark.position.longitude,
          name: item.landmark.name.zh,
        } satisfies LandmarkMarker)
      }
    }
    if (selectedClimatePosition) {
      markers.push({
        markerType: 'climate',
        lat: selectedClimatePosition.latitude,
        lng: selectedClimatePosition.longitude,
        name: '气候判读点',
      })
    }
    return markers
  }, [labelItems, selectedClimatePosition])
  const waterbodyGeometryById = useMemo(
    () => new Map((waterbodyGeometries ?? []).map((item) => [item.id, item])),
    [waterbodyGeometries],
  )
  const linearGeometryById = useMemo(
    () =>
      new Map((linearFeatureGeometries ?? []).map((item) => [item.id, item])),
    [linearFeatureGeometries],
  )
  const mountainGeometryById = useMemo(
    () => new Map((mountainGeometries ?? []).map((item) => [item.id, item])),
    [mountainGeometries],
  )
  const desertGeometryById = useMemo(
    () => new Map((desertGeometries ?? []).map((item) => [item.id, item])),
    [desertGeometries],
  )
  const selectedWaterbody = getWaterbody(selectedWaterbodyId)
  const selectedWaterbodyGeometry = selectedWaterbodyId
    ? waterbodyGeometryById.get(selectedWaterbodyId)
    : undefined
  const selectedSurfaceFeature = useMemo(
    () =>
      selectedWaterbody?.layer !== 'lake' &&
      selectedWaterbodyGeometry?.kind === 'surface'
        ? {
            type: 'Feature' as const,
            properties: { waterbodyId: selectedWaterbodyGeometry.id },
            geometry:
              quality === 'low'
                ? selectedWaterbodyGeometry.lowDetailGeometry
                : selectedWaterbodyGeometry.geometry,
          }
        : null,
    [quality, selectedWaterbody, selectedWaterbodyGeometry],
  )
  const visibleLakeSurfaceFeatures = useMemo(
    () =>
      labelItems.flatMap((item) => {
        if (item.type !== 'waterbody' || item.waterbody.layer !== 'lake') {
          return []
        }
        const geometry = waterbodyGeometryById.get(item.waterbody.id)
        return geometry?.kind === 'surface'
          ? [
              {
                type: 'Feature' as const,
                properties: { waterbodyId: geometry.id },
                geometry:
                  quality === 'low'
                    ? geometry.lowDetailGeometry
                    : geometry.geometry,
              },
            ]
          : []
      }),
    [labelItems, quality, waterbodyGeometryById],
  )
  const selectedTrenchPath = useMemo(() => {
    if (selectedWaterbodyGeometry?.kind !== 'trench') return null
    const pathState = {
      waterbodyId: selectedWaterbodyGeometry.id,
      kind: 'trench' as const,
      selected: true,
    }
    const appearance = getGeographicPathAppearance(pathState, quality)
    const points =
      quality === 'low'
        ? selectedWaterbodyGeometry.lowDetailPoints
        : selectedWaterbodyGeometry.points
    return {
      ...pathState,
      ...appearance,
      points: addGeographicPathAltitude(points, appearance.altitude),
    }
  }, [quality, selectedWaterbodyGeometry])
  const visibleDesertFeatures = useMemo(
    () =>
      getVisibleDeserts(deserts, { showDesertLayer }).flatMap((desert) => {
        const geometry = desertGeometryById.get(desert.id)
        return geometry
          ? [
              {
                type: 'Feature' as const,
                properties: { desertId: desert.id },
                geometry: getDesertGeometryForScene(geometry, quality),
              },
            ]
          : []
      }),
    [desertGeometryById, quality, showDesertLayer],
  )
  const selectedLinearFeature = getLinearGeoFeature(selectedLinearFeatureId)
  const selectedMountainRange = getMountainRange(selectedMountainRangeId)
  const selectedPathKind =
    selectedLinearFeature?.kind ??
    (selectedMountainRange ? ('mountain' as const) : undefined)
  const selectedPathAltitude = getGeographicPathAppearance(
    { kind: selectedPathKind, selected: true },
    quality,
  ).altitude
  const selectedLinearFeatureGeometry = useMemo(() => {
    if (selectedLinearFeature) {
      const geometry = linearGeometryById.get(selectedLinearFeature.id)
      return geometry
        ? getLinearFeatureGeometryForScene(geometry, quality, true)
        : null
    }
    if (selectedMountainRange) {
      const geometry = mountainGeometryById.get(selectedMountainRange.id)
      return geometry
        ? getMountainGeometryForScene(geometry, quality, true)
        : null
    }
    return null
  }, [
    linearGeometryById,
    mountainGeometryById,
    quality,
    selectedLinearFeature,
    selectedMountainRange,
  ])
  const visibleLinearFeatures = useMemo(
    () =>
      getVisibleLinearFeatures(linearGeoFeatures, {
        showRiverAndCanalLayer,
        selectedLinearFeatureId,
        hoveredLinearFeatureId,
      }),
    [hoveredLinearFeatureId, selectedLinearFeatureId, showRiverAndCanalLayer],
  )
  const linearPaths = useMemo(
    () =>
      visibleLinearFeatures.flatMap((feature) => {
        const geometry = linearGeometryById.get(feature.id)
        if (!geometry) return []
        const lines = getLinearFeatureGeometryForScene(
          geometry,
          quality,
          feature.id === selectedLinearFeatureId,
        ).coordinates
        return lines.map((points, segmentIndex) => {
          const pathState = {
            kind: feature.kind,
            selected: feature.id === selectedLinearFeatureId,
            hovered: feature.id === hoveredLinearFeatureId,
          }
          const appearance = getGeographicPathAppearance(pathState, quality)
          return {
            linearFeatureId: feature.id,
            ...pathState,
            ...appearance,
            segmentIndex,
            points: addGeographicPathAltitude(
              points.map(([longitude, latitude]) => [latitude, longitude]),
              appearance.altitude,
            ),
          }
        })
      }),
    [
      hoveredLinearFeatureId,
      linearGeometryById,
      quality,
      selectedLinearFeatureId,
      visibleLinearFeatures,
    ],
  )
  const visibleMountains = useMemo(
    () =>
      getVisibleMountainRanges(mountainRanges, {
        showMountainLayer,
        selectedMountainRangeId,
        hoveredMountainRangeId,
      }),
    [hoveredMountainRangeId, selectedMountainRangeId, showMountainLayer],
  )
  const mountainPaths = useMemo(
    () =>
      visibleMountains.flatMap((range) => {
        const geometry = mountainGeometryById.get(range.id)
        if (!geometry) return []
        const lines = getMountainGeometryForScene(
          geometry,
          quality,
          range.id === selectedMountainRangeId,
        ).coordinates
        return lines.map((points, segmentIndex) => {
          const pathState = {
            kind: 'mountain' as const,
            selected: range.id === selectedMountainRangeId,
            hovered: range.id === hoveredMountainRangeId,
          }
          const appearance = getGeographicPathAppearance(pathState, quality)
          return {
            mountainRangeId: range.id,
            ...pathState,
            ...appearance,
            segmentIndex,
            points: addGeographicPathAltitude(
              points.map(([longitude, latitude]) => [latitude, longitude]),
              appearance.altitude,
            ),
          }
        })
      }),
    [
      hoveredMountainRangeId,
      mountainGeometryById,
      quality,
      selectedMountainRangeId,
      visibleMountains,
    ],
  )
  const geographyPaths = useMemo(
    () =>
      getGeographyScenePaths(
        quality,
        selectedReferenceLineId,
        showGeographyLearningLayer,
      ),
    [quality, selectedReferenceLineId, showGeographyLearningLayer],
  )
  const pathData = useMemo(
    () => [
      ...(selectedTrenchPath ? [selectedTrenchPath] : []),
      ...linearPaths,
      ...mountainPaths,
      ...geographyPaths,
    ],
    [geographyPaths, linearPaths, mountainPaths, selectedTrenchPath],
  )
  const polygonsData = useMemo(
    () => [
      ...(countryBoundaries?.features ?? []),
      ...visibleDesertFeatures,
      ...visibleLakeSurfaceFeatures,
      ...(selectedSurfaceFeature ? [selectedSurfaceFeature] : []),
    ],
    [
      countryBoundaries,
      selectedSurfaceFeature,
      visibleDesertFeatures,
      visibleLakeSurfaceFeatures,
    ],
  )

  return {
    pointMarkers,
    selectedMountainRange,
    selectedPathAltitude,
    selectedLinearFeatureGeometry,
    pathData,
    polygonsData,
  }
}
