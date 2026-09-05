import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import {
  climateLearningTopic,
  getClimateType,
} from '../../data/climateLearning'
import {
  classifyClimatePosition,
  getClimateRasterAsset,
  loadClimateDisplayAssets,
  preloadClimateRaster,
} from '../../data/climateRaster'
import type { ClimateTypeId } from '../../data/climateLearningSchema'
import { getCitiesForCountry, getCountry } from '../../data/countries'
import { getDesert } from '../../data/deserts'
import {
  getReferenceLine,
  resolveGeographyExploreSelection,
} from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import { getLandmark } from '../../data/landmarks'
import {
  loadCountryBoundaries,
  loadDesertGeometries,
  loadLinearFeatureGeometries,
  loadMountainGeometries,
  loadTerritoryBoundaries,
  loadWaterbodyGeometries,
  prefetchGeometryAssets,
} from '../../data/geometryResources'
import { getLinearGeoFeature } from '../../data/linearGeoFeatures'
import { getMountainRange } from '../../data/mountainRanges'
import { getWaterbody } from '../../data/waterbodies'
import { getTerritory } from '../../data/territories'
import { ControlButton } from '../../shared/components/ControlButton'
import { WebGLFallback } from '../../shared/components/WebGLFallback'
import { supportsWebGL } from '../../shared/lib/webgl'
import { useGeometryResource } from '../../shared/hooks/useGeometryResource'
import { usePrefersReducedMotion } from '../../shared/hooks/usePrefersReducedMotion'
import type {
  CameraTarget,
  GeoPosition,
  GlobeView,
  WorldMiniMapNavigation,
} from '../../shared/types/geo'
import { sceneOverlayRoles } from '../../shared/types/sceneOverlay'
import { OVERVIEW_CAMERA_DISTANCE } from '../../scene/countrySceneInteraction'
import { LANDMARK_CAMERA_DISTANCE } from '../../scene/landmarkSceneInteraction'
import { CountryDetailPanel } from './CountryDetailPanel'
import { TerritoryDetailPanel } from './TerritoryDetailPanel'
import { ClimateLearningPanel } from './ClimateLearningPanel'
import { DesertDetailPanel } from './DesertDetailPanel'
import { parseExploreDeepLinkPosition } from './exploreDeepLinks'
import { ExploreGuideCard } from './ExploreGuideCard'
import { GeographyLearningPanel } from './GeographyLearningPanel'
import { LinearGeoFeatureDetailPanel } from './LinearGeoFeatureDetailPanel'
import { LandmarkDetailPanel } from './LandmarkDetailPanel'
import { LayerControl, type LayerControlGroup } from './LayerControl'
import { MountainRangeDetailPanel } from './MountainRangeDetailPanel'
import { WaterbodyDetailPanel } from './WaterbodyDetailPanel'
import {
  exploreReducer,
  getSelectedCountryCode,
  getSelectedTerritoryId,
  initialExploreState,
  type ExploreHover,
} from './exploreState'
import { useExperienceStore } from './useExperienceStore'
import { WorldMiniMap, type WorldMiniMapHandle } from './WorldMiniMap'

const GlobeScene = lazy(async () => {
  const sceneModule = await import('../../scene/GlobeScene')
  return { default: sceneModule.GlobeScene }
})

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5z" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.2c.7 4.2 2.6 6.1 6.8 6.8-4.2.7-6.1 2.6-6.8 6.8-.7-4.2-2.6-6.1-6.8-6.8 4.2-.7 6.1-2.6 6.8-6.8Z" />
      <path d="M18.7 15.5c.3 1.8 1.1 2.6 2.9 2.9-1.8.3-2.6 1.1-2.9 2.9-.3-1.8-1.1-2.6-2.9-2.9 1.8-.3 2.6-1.1 2.9-2.9Z" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 8.3A8 8 0 1 1 4 14" />
      <path d="M4.5 4.5v4.8h4.8" />
    </svg>
  )
}

export function ExplorePage() {
  const { t } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()
  const cameraRequestIdRef = useRef(0)
  const climateRequestIdRef = useRef(0)
  const currentViewCenterRef = useRef<GeoPosition>(getCountry('CN')!.center)
  const miniMapRef = useRef<WorldMiniMapHandle>(null)
  const [exploreState, dispatch] = useReducer(
    exploreReducer,
    initialExploreState,
  )
  const [miniMapExpanded, setMiniMapExpanded] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(() => ({
    requestId: 0,
    position: getCountry('CN')!.center,
    distance: OVERVIEW_CAMERA_DISTANCE,
  }))
  const [committedViewCenter, setCommittedViewCenter] = useState<GeoPosition>(
    () => getCountry('CN')!.center,
  )
  const webGLAvailable = useMemo(() => supportsWebGL(), [])
  const {
    autoRotate,
    quality,
    persistenceStatus,
    hydrate,
    toggleAutoRotate,
    toggleQuality,
  } = useExperienceStore()

  const {
    cities: showCities,
    ocean: showOceanLayer,
    lake: showLakeLayer,
    waterway: showWaterwayLayer,
    riverAndCanal: showRiverAndCanalLayer,
    mountain: showMountainLayer,
    desert: showDesertLayer,
    landmark: showLandmarkLayer,
    geography: showGeographyLearningLayer,
    climate: showClimateLayer,
  } = exploreState.layers
  const selection = exploreState.selection
  const hover = exploreState.hover
  const selectedCountryCode = getSelectedCountryCode(selection)
  const selectedTerritoryId = getSelectedTerritoryId(selection)
  const selectedTerritory = getTerritory(selectedTerritoryId)
  const selectedWaterbodyId =
    selection?.kind === 'waterbody' ? selection.waterbodyId : null
  const selectedLinearFeatureId =
    selection?.kind === 'linearFeature' ? selection.featureId : null
  const selectedMountainRangeId =
    selection?.kind === 'mountainRange' ? selection.rangeId : null
  const selectedDesertId =
    selection?.kind === 'desert' ? selection.desertId : null
  const selectedLandmarkId =
    selection?.kind === 'landmark' ? selection.landmarkId : null
  const geographySelection =
    selection?.kind === 'geography' ? selection.value : null
  const selectedGeographyTopicId =
    geographySelection?.kind === 'line'
      ? geographySelection.topicId
      : (geographySelection?.focusTopicId ?? null)
  const selectedReferenceLineId =
    geographySelection?.kind === 'line'
      ? geographySelection.referenceLineId
      : null
  const climateSelection =
    selection?.kind === 'climate' ? selection.value : null
  const hoveredCountryCode =
    hover?.kind === 'country' ? hover.countryCode : null
  const hoveredWaterbodyId =
    hover?.kind === 'waterbody' ? hover.waterbodyId : null
  const hoveredLinearFeatureId =
    hover?.kind === 'linearFeature' ? hover.featureId : null
  const hoveredMountainRangeId =
    hover?.kind === 'mountainRange' ? hover.rangeId : null
  const hoveredDesertId = hover?.kind === 'desert' ? hover.desertId : null
  const hoveredLandmarkId = hover?.kind === 'landmark' ? hover.landmarkId : null
  const countryBoundaryResource = useGeometryResource(loadCountryBoundaries)
  const territoryBoundaryResource = useGeometryResource(
    loadTerritoryBoundaries,
    selectedTerritory?.displayMode === 'polygon',
  )
  const waterbodyGeometryResource = useGeometryResource(
    loadWaterbodyGeometries,
    showOceanLayer ||
      showLakeLayer ||
      showWaterwayLayer ||
      selectedWaterbodyId !== null,
  )
  const linearGeometryResource = useGeometryResource(
    loadLinearFeatureGeometries,
    showRiverAndCanalLayer || selectedLinearFeatureId !== null,
  )
  const mountainGeometryResource = useGeometryResource(
    loadMountainGeometries,
    showMountainLayer || selectedMountainRangeId !== null,
  )
  const desertGeometryResource = useGeometryResource(
    loadDesertGeometries,
    showDesertLayer || selectedDesertId !== null,
  )

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    let timeoutId: number | null = null
    let idleId: number | null = null
    const prefetch = () => void prefetchGeometryAssets()
    const runtimeWindow = window as Window & {
      requestIdleCallback?: typeof window.requestIdleCallback
      cancelIdleCallback?: typeof window.cancelIdleCallback
    }
    if (runtimeWindow.requestIdleCallback) {
      idleId = runtimeWindow.requestIdleCallback(prefetch, { timeout: 4_000 })
    } else {
      timeoutId = globalThis.setTimeout(prefetch, 1_500)
    }
    return () => {
      if (idleId !== null && runtimeWindow.cancelIdleCallback) {
        runtimeWindow.cancelIdleCallback(idleId)
      }
      if (timeoutId !== null) globalThis.clearTimeout(timeoutId)
    }
  }, [])

  const selectedCountry = getCountry(selectedCountryCode)
  const selectedWaterbody = getWaterbody(selectedWaterbodyId)
  const selectedLinearFeature = getLinearGeoFeature(selectedLinearFeatureId)
  const selectedMountainRange = getMountainRange(selectedMountainRangeId)
  const selectedDesert = getDesert(selectedDesertId)
  const selectedLandmark = getLandmark(selectedLandmarkId)
  const selectedClimateType =
    climateSelection?.kind === 'type'
      ? getClimateType(climateSelection.climateTypeId)
      : null
  const selectedClimateTypeId = selectedClimateType?.id ?? null
  const selectedClimatePosition =
    climateSelection?.classification?.position ?? null
  const climateDisplayKey = `${quality}:${showClimateLayer ? (selectedClimateTypeId ?? 'overview') : 'hidden'}`
  const baseClimateRasterUrl = getClimateRasterAsset(quality).url
  const [loadedClimateDisplay, setLoadedClimateDisplay] = useState<{
    key: string
    rasterUrl: string
    boundaryUrl: string | null
  }>({
    key: 'balanced:hidden',
    rasterUrl: getClimateRasterAsset('balanced').url,
    boundaryUrl: null,
  })
  const climateRasterUrl =
    loadedClimateDisplay.key === climateDisplayKey
      ? loadedClimateDisplay.rasterUrl
      : baseClimateRasterUrl
  const climateBoundaryRasterUrl =
    loadedClimateDisplay.key === climateDisplayKey
      ? loadedClimateDisplay.boundaryUrl
      : null
  useEffect(() => {
    let active = true
    const climateTypeId = showClimateLayer ? selectedClimateTypeId : null
    void loadClimateDisplayAssets(quality, climateTypeId).then(
      ({ raster, boundary }) => {
        if (!active) return
        setLoadedClimateDisplay({
          key: climateDisplayKey,
          rasterUrl: raster.url,
          boundaryUrl: boundary?.url ?? null,
        })
      },
    )
    return () => {
      active = false
    }
  }, [climateDisplayKey, quality, selectedClimateTypeId, showClimateLayer])
  const visibleCountryCities = getCitiesForCountry(selectedCountryCode)
  const toggleCityLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'cities' })
  }, [])
  const toggleOceanLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'ocean' })
  }, [])
  const toggleWaterwayLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'waterway' })
  }, [])
  const toggleLakeLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'lake' })
  }, [])
  const toggleRiverAndCanalLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'riverAndCanal' })
  }, [])
  const toggleMountainLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'mountain' })
  }, [])
  const toggleDesertLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'desert' })
  }, [])
  const toggleLandmarkLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'landmark' })
  }, [])
  const toggleGeographyLearningLayer = useCallback(() => {
    if (showGeographyLearningLayer) {
      dispatch({ type: 'toggleLayer', layer: 'geography' })
      return
    }
    setCommittedViewCenter(currentViewCenterRef.current)
    dispatch({
      type: 'select',
      selection: {
        kind: 'geography',
        value: { kind: 'overview', focusTopicId: null },
      },
    })
  }, [showGeographyLearningLayer])
  const toggleClimateLayer = useCallback(() => {
    if (showClimateLayer) {
      dispatch({ type: 'toggleLayer', layer: 'climate' })
      return
    }
    dispatch({ type: 'showClimateOverview' })
    void preloadClimateRaster(quality).catch(() => undefined)
  }, [quality, showClimateLayer])
  const layerGroups: readonly LayerControlGroup[] = [
    {
      id: 'labels',
      label: '标注',
      items: [
        {
          id: 'cities',
          label: '城市',
          className: 'is-city',
          pressed: showCities,
          onToggle: toggleCityLayer,
        },
      ],
    },
    {
      id: 'earth-knowledge',
      label: '地球知识',
      items: [
        {
          id: 'geography',
          label: '经纬',
          className: 'is-geography',
          pressed: showGeographyLearningLayer,
          ariaLabel: '经纬图层：经度基准、半球界线、纬度分区线与五带分界线',
          title: '经纬：地球重要经纬线',
          onToggle: toggleGeographyLearningLayer,
        },
        {
          id: 'climate',
          label: '气候',
          className: 'is-climate',
          pressed: showClimateLayer,
          ariaLabel: '世界气候类型教学图层',
          title: '气候：世界13类气候类型',
          onToggle: toggleClimateLayer,
        },
      ],
    },
    {
      id: 'water',
      label: '水域',
      items: [
        {
          id: 'ocean',
          label: '海洋',
          className: 'is-ocean',
          pressed: showOceanLayer,
          description: '海洋：大洋、海与海湾',
          onToggle: toggleOceanLayer,
        },
        {
          id: 'lake',
          label: '湖泊',
          className: 'is-lake',
          pressed: showLakeLayer,
          ariaLabel: '湖泊图层：世界著名淡水与咸水湖泊',
          title: '湖泊：世界著名淡水与咸水湖泊',
          onToggle: toggleLakeLayer,
        },
        {
          id: 'waterway',
          label: '水域',
          className: 'is-waterway',
          pressed: showWaterwayLayer,
          description: '水域：海峡与海沟',
          onToggle: toggleWaterwayLayer,
        },
        {
          id: 'river',
          label: '河流',
          className: 'is-river',
          pressed: showRiverAndCanalLayer,
          ariaLabel: '河流图层：世界重要河流与人工运河',
          title: '河流：世界重要河流与人工运河',
          onToggle: toggleRiverAndCanalLayer,
        },
      ],
    },
    {
      id: 'terrain-culture',
      label: '地貌与文化',
      items: [
        {
          id: 'mountain',
          label: '山脉',
          className: 'is-mountain',
          pressed: showMountainLayer,
          ariaLabel: '山脉图层：世界著名山脉与最高峰',
          title: '山脉：世界著名山脉与最高峰',
          onToggle: toggleMountainLayer,
        },
        {
          id: 'desert',
          label: '沙漠',
          className: 'is-desert',
          pressed: showDesertLayer,
          ariaLabel: '沙漠图层：世界主要沙漠与荒漠景观',
          title: '沙漠：世界主要沙漠与荒漠景观',
          onToggle: toggleDesertLayer,
        },
        {
          id: 'landmark',
          label: '古迹',
          className: 'is-landmark',
          pressed: showLandmarkLayer,
          ariaLabel: '名胜古迹图层：世界著名文化与历史遗产',
          title: '古迹：世界著名文化与历史遗产',
          onToggle: toggleLandmarkLayer,
        },
      ],
    },
  ]
  const requestCameraTarget = useCallback(
    (position: GeoPosition, distance = OVERVIEW_CAMERA_DISTANCE) => {
      cameraRequestIdRef.current += 1
      setCameraTarget({
        requestId: cameraRequestIdRef.current,
        position,
        distance,
      })
    },
    [],
  )
  const selectGeographyTopic = useCallback(
    (
      topicId: GeographyTopicId,
      referenceLineId: ReferenceLineId | null = null,
    ) => {
      setCommittedViewCenter(currentViewCenterRef.current)
      const referenceLine = getReferenceLine(referenceLineId)
      dispatch({
        type: 'select',
        selection: {
          kind: 'geography',
          value:
            referenceLine?.topicId === topicId
              ? {
                  kind: 'line',
                  topicId,
                  referenceLineId: referenceLine.id,
                }
              : { kind: 'overview', focusTopicId: topicId },
        },
      })
    },
    [],
  )
  const openGeographyTopic = useCallback(
    (
      topicId: GeographyTopicId,
      referenceLineId: ReferenceLineId | null = null,
    ) => {
      const referenceLine = getReferenceLine(referenceLineId)
      selectGeographyTopic(topicId, referenceLineId)
      if (referenceLine) {
        requestCameraTarget(
          referenceLine.focusPosition,
          referenceLine.cameraDistance,
        )
      }
    },
    [requestCameraTarget, selectGeographyTopic],
  )
  const openGeographyOverview = useCallback(
    (focusTopicId: GeographyTopicId | null = null) => {
      setCommittedViewCenter(currentViewCenterRef.current)
      dispatch({
        type: 'select',
        selection: {
          kind: 'geography',
          value: { kind: 'overview', focusTopicId },
        },
      })
    },
    [],
  )
  const openGeographyLine = useCallback(
    (referenceLineId: ReferenceLineId) => {
      const referenceLine = getReferenceLine(referenceLineId)
      if (!referenceLine) return
      openGeographyTopic(referenceLine.topicId, referenceLine.id)
    },
    [openGeographyTopic],
  )
  const selectClimateType = useCallback((climateTypeId: ClimateTypeId) => {
    dispatch({ type: 'selectClimateType', climateTypeId })
  }, [])
  const openClimateOverview = useCallback(() => {
    dispatch({ type: 'showClimateOverview' })
    void preloadClimateRaster(quality).catch(() => undefined)
  }, [quality])
  const navigateToClimateType = useCallback(
    (climateTypeId: ClimateTypeId) => {
      const climateType = getClimateType(climateTypeId)
      if (!climateType) return
      dispatch({ type: 'selectClimateType', climateTypeId })
      void preloadClimateRaster(quality).catch(() => undefined)
      requestCameraTarget(
        climateType.representativePosition,
        climateType.cameraDistance,
      )
    },
    [quality, requestCameraTarget],
  )
  const selectClimateAtPosition = useCallback(
    (position: GeoPosition, moveCamera: boolean) => {
      climateRequestIdRef.current += 1
      const requestId = climateRequestIdRef.current
      dispatch({ type: 'showClimateOverview' })
      if (moveCamera) requestCameraTarget(position)
      void classifyClimatePosition(position, quality)
        .then((classification) => {
          if (requestId !== climateRequestIdRef.current) return
          dispatch({
            type: 'select',
            selection: {
              kind: 'climate',
              value: classification.climateTypeId
                ? {
                    kind: 'type',
                    climateTypeId: classification.climateTypeId,
                    classification,
                  }
                : { kind: 'overview', classification },
            },
          })
        })
        .catch(() => {
          if (requestId !== climateRequestIdRef.current) return
          dispatch({
            type: 'select',
            selection: {
              kind: 'climate',
              value: {
                kind: 'overview',
                classification: {
                  position,
                  climateTypeId: null,
                  period: '1991–2020',
                },
              },
            },
          })
        })
    },
    [quality, requestCameraTarget],
  )
  const selectCountry = useCallback((countryCode: string) => {
    const country = getCountry(countryCode)
    if (!country) return
    setMiniMapExpanded(false)
    dispatch({
      type: 'select',
      selection: { kind: 'country', countryCode },
    })
  }, [])
  const navigateToCountry = useCallback(
    (countryCode: string) => {
      const country = getCountry(countryCode)
      if (!country) return
      selectCountry(countryCode)
      requestCameraTarget(country.center)
    },
    [requestCameraTarget, selectCountry],
  )
  const selectTerritory = useCallback((territoryId: string) => {
    const territory = getTerritory(territoryId)
    if (!territory) return
    setMiniMapExpanded(false)
    dispatch({
      type: 'select',
      selection: { kind: 'territory', territoryId: territory.id },
    })
  }, [])
  const navigateToTerritory = useCallback(
    (territoryId: string) => {
      const territory = getTerritory(territoryId)
      if (!territory) return
      selectTerritory(territory.id)
      requestCameraTarget(territory.center, territory.cameraDistance)
    },
    [requestCameraTarget, selectTerritory],
  )
  const selectWaterbody = useCallback((waterbodyId: string) => {
    const waterbody = getWaterbody(waterbodyId)
    if (!waterbody) return
    setMiniMapExpanded(false)
    dispatch({
      type: 'select',
      selection: { kind: 'waterbody', waterbodyId: waterbody.id },
    })
  }, [])
  const navigateToWaterbody = useCallback(
    (waterbodyId: string) => {
      const waterbody = getWaterbody(waterbodyId)
      if (!waterbody) return
      selectWaterbody(waterbodyId)
      requestCameraTarget(waterbody.center, waterbody.cameraDistance)
    },
    [requestCameraTarget, selectWaterbody],
  )
  const selectLinearFeature = useCallback((featureId: string) => {
    const feature = getLinearGeoFeature(featureId)
    if (!feature) return
    setMiniMapExpanded(false)
    dispatch({
      type: 'select',
      selection: { kind: 'linearFeature', featureId: feature.id },
    })
  }, [])
  const navigateToLinearFeature = useCallback(
    (featureId: string) => {
      const feature = getLinearGeoFeature(featureId)
      if (!feature) return
      selectLinearFeature(featureId)
      requestCameraTarget(feature.cameraPosition, feature.cameraDistance)
    },
    [requestCameraTarget, selectLinearFeature],
  )
  const selectMountainRange = useCallback((rangeId: string) => {
    const range = getMountainRange(rangeId)
    if (!range) return
    setMiniMapExpanded(false)
    dispatch({
      type: 'select',
      selection: { kind: 'mountainRange', rangeId: range.id },
    })
  }, [])
  const navigateToMountainRange = useCallback(
    (rangeId: string) => {
      const range = getMountainRange(rangeId)
      if (!range) return
      selectMountainRange(rangeId)
      requestCameraTarget(range.cameraPosition, range.cameraDistance)
    },
    [requestCameraTarget, selectMountainRange],
  )
  const selectDesert = useCallback((desertId: string) => {
    const desert = getDesert(desertId)
    if (!desert) return
    setMiniMapExpanded(false)
    dispatch({
      type: 'select',
      selection: { kind: 'desert', desertId: desert.id },
    })
  }, [])
  const navigateToDesert = useCallback(
    (desertId: string) => {
      const desert = getDesert(desertId)
      if (!desert) return
      selectDesert(desertId)
      requestCameraTarget(desert.center, desert.cameraDistance)
    },
    [requestCameraTarget, selectDesert],
  )
  const selectLandmark = useCallback((landmarkId: string) => {
    const landmark = getLandmark(landmarkId)
    if (!landmark) return
    setMiniMapExpanded(false)
    dispatch({
      type: 'select',
      selection: { kind: 'landmark', landmarkId: landmark.id },
    })
  }, [])
  const navigateToLandmark = useCallback(
    (landmarkId: string) => {
      const landmark = getLandmark(landmarkId)
      if (!landmark) return
      selectLandmark(landmarkId)
      requestCameraTarget(landmark.position, LANDMARK_CAMERA_DISTANCE)
    },
    [requestCameraTarget, selectLandmark],
  )
  const requestedDeepLinks = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search)
    return {
      countryCode: searchParams.get('country')?.toUpperCase(),
      territoryId: searchParams.get('territory'),
      geography: resolveGeographyExploreSelection(
        searchParams.get('geography'),
        searchParams.get('line'),
      ),
      waterbodyId: searchParams.get('waterbody'),
      linearFeatureId: searchParams.get('linearFeature'),
      mountainRangeId: searchParams.get('mountainRange'),
      desertId: searchParams.get('desert'),
      landmarkId: searchParams.get('landmark'),
      climateId: searchParams.get('climate'),
      position: parseExploreDeepLinkPosition(searchParams),
    }
  }, [])
  const handledDeepLinkRef = useRef<string | null>(null)
  useEffect(() => {
    if (handledDeepLinkRef.current) return
    const timeoutId = window.setTimeout(() => {
      const focusPosition = () => {
        if (requestedDeepLinks.position) {
          requestCameraTarget(requestedDeepLinks.position)
        }
      }
      const country = getCountry(requestedDeepLinks.countryCode)
      if (country) {
        handledDeepLinkRef.current = `country:${country.code}`
        navigateToCountry(country.code)
        focusPosition()
        return
      }

      const territory = getTerritory(requestedDeepLinks.territoryId)
      if (territory) {
        handledDeepLinkRef.current = `territory:${territory.id}`
        navigateToTerritory(territory.id)
        focusPosition()
        return
      }

      if (requestedDeepLinks.geography) {
        handledDeepLinkRef.current = 'geography'
        if (requestedDeepLinks.geography.kind === 'line') {
          openGeographyTopic(
            requestedDeepLinks.geography.topicId,
            requestedDeepLinks.geography.referenceLineId,
          )
        } else {
          openGeographyOverview(requestedDeepLinks.geography.focusTopicId)
        }
        focusPosition()
        return
      }

      const waterbody = getWaterbody(requestedDeepLinks.waterbodyId)
      if (waterbody) {
        handledDeepLinkRef.current = `waterbody:${waterbody.id}`
        navigateToWaterbody(waterbody.id)
        focusPosition()
        return
      }

      const linearFeature = getLinearGeoFeature(
        requestedDeepLinks.linearFeatureId,
      )
      if (linearFeature) {
        handledDeepLinkRef.current = `linearFeature:${linearFeature.id}`
        navigateToLinearFeature(linearFeature.id)
        focusPosition()
        return
      }

      const mountainRange = getMountainRange(requestedDeepLinks.mountainRangeId)
      if (mountainRange) {
        handledDeepLinkRef.current = `mountainRange:${mountainRange.id}`
        navigateToMountainRange(mountainRange.id)
        focusPosition()
        return
      }

      const desert = getDesert(requestedDeepLinks.desertId)
      if (desert) {
        handledDeepLinkRef.current = `desert:${desert.id}`
        navigateToDesert(desert.id)
        focusPosition()
        return
      }

      const landmark = getLandmark(requestedDeepLinks.landmarkId)
      if (landmark) {
        handledDeepLinkRef.current = `landmark:${landmark.id}`
        navigateToLandmark(landmark.id)
        focusPosition()
        return
      }

      if (requestedDeepLinks.climateId === climateLearningTopic.id) {
        handledDeepLinkRef.current = 'climate:overview'
        openClimateOverview()
        focusPosition()
        return
      }

      const climateType = getClimateType(requestedDeepLinks.climateId)
      if (climateType) {
        handledDeepLinkRef.current = `climate:${climateType.id}`
        navigateToClimateType(climateType.id)
        focusPosition()
        return
      }

      if (requestedDeepLinks.position) {
        handledDeepLinkRef.current = 'coordinate'
        requestCameraTarget(requestedDeepLinks.position)
      }
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [
    navigateToCountry,
    navigateToDesert,
    navigateToLinearFeature,
    navigateToLandmark,
    navigateToMountainRange,
    navigateToTerritory,
    navigateToWaterbody,
    navigateToClimateType,
    openClimateOverview,
    openGeographyOverview,
    openGeographyTopic,
    requestCameraTarget,
    requestedDeepLinks,
  ])
  const handleMiniMapNavigation = useCallback(
    (navigation: WorldMiniMapNavigation) => {
      if (navigation.kind === 'country') {
        navigateToCountry(navigation.countryCode)
        return
      }

      requestCameraTarget(navigation.position)
    },
    [navigateToCountry, requestCameraTarget],
  )
  const handleViewCenterChange = useCallback((view: GlobeView) => {
    currentViewCenterRef.current = view.position
    miniMapRef.current?.setViewCenter(view.position)
  }, [])
  const handleViewCenterCommit = useCallback((view: GlobeView) => {
    currentViewCenterRef.current = view.position
    miniMapRef.current?.setViewCenter(view.position)
    setCommittedViewCenter(view.position)
  }, [])

  const setEntityHover = useCallback((nextHover: ExploreHover) => {
    dispatch({ type: 'hover', hover: nextHover })
  }, [])
  const hoverCountry = useCallback(
    (countryCode: string | null) =>
      setEntityHover(countryCode ? { kind: 'country', countryCode } : null),
    [setEntityHover],
  )
  const hoverWaterbody = useCallback(
    (waterbodyId: string | null) =>
      setEntityHover(waterbodyId ? { kind: 'waterbody', waterbodyId } : null),
    [setEntityHover],
  )
  const hoverLinearFeature = useCallback(
    (featureId: string | null) =>
      setEntityHover(featureId ? { kind: 'linearFeature', featureId } : null),
    [setEntityHover],
  )
  const hoverMountainRange = useCallback(
    (rangeId: string | null) =>
      setEntityHover(rangeId ? { kind: 'mountainRange', rangeId } : null),
    [setEntityHover],
  )
  const hoverDesert = useCallback(
    (desertId: string | null) =>
      setEntityHover(desertId ? { kind: 'desert', desertId } : null),
    [setEntityHover],
  )
  const hoverLandmark = useCallback(
    (landmarkId: string | null) =>
      setEntityHover(landmarkId ? { kind: 'landmark', landmarkId } : null),
    [setEntityHover],
  )
  const failedGeometryResources = [
    {
      label: '世界边界',
      status: countryBoundaryResource.status,
      retry: countryBoundaryResource.retry,
    },
    {
      label: '地区几何',
      status: territoryBoundaryResource.status,
      retry: territoryBoundaryResource.retry,
    },
    {
      label: '水域几何',
      status: waterbodyGeometryResource.status,
      retry: waterbodyGeometryResource.retry,
    },
    {
      label: '河流几何',
      status: linearGeometryResource.status,
      retry: linearGeometryResource.retry,
    },
    {
      label: '山脉几何',
      status: mountainGeometryResource.status,
      retry: mountainGeometryResource.retry,
    },
    {
      label: '沙漠几何',
      status: desertGeometryResource.status,
      retry: desertGeometryResource.retry,
    },
  ].filter((resource) => resource.status === 'error')

  const effectiveAutoRotate =
    autoRotate &&
    !reducedMotion &&
    selectedCountryCode === null &&
    selectedTerritoryId === null &&
    hoveredCountryCode === null &&
    hoveredWaterbodyId === null &&
    selectedWaterbodyId === null &&
    selectedLinearFeatureId === null &&
    hoveredLinearFeatureId === null &&
    selectedMountainRangeId === null &&
    hoveredMountainRangeId === null &&
    selectedDesertId === null &&
    hoveredDesertId === null &&
    selectedLandmarkId === null &&
    hoveredLandmarkId === null &&
    geographySelection === null &&
    climateSelection === null

  return (
    <main className="explore-shell has-country-detail">
      {webGLAvailable ? (
        <Suspense
          fallback={
            <div className="scene-loading" role="status">
              正在唤醒地球…
            </div>
          }
        >
          <GlobeScene
            geometry={{
              countryBoundaries: countryBoundaryResource.data,
              territoryBoundaries: territoryBoundaryResource.data,
              waterbodyGeometries: waterbodyGeometryResource.data,
              linearFeatureGeometries: linearGeometryResource.data,
              mountainGeometries: mountainGeometryResource.data,
              desertGeometries: desertGeometryResource.data,
            }}
            view={{
              autoRotate: effectiveAutoRotate,
              cameraTarget,
              quality,
              reducedMotion,
            }}
            layers={{
              showCities,
              showOceanLayer,
              showLakeLayer,
              showWaterwayLayer,
              showRiverAndCanalLayer,
              showMountainLayer,
              showDesertLayer,
              showLandmarkLayer,
              showGeographyLearningLayer,
              showClimateLayer,
            }}
            climate={{
              selectedClimateTypeId,
              climateRasterUrl,
              climateBoundaryRasterUrl,
              selectedClimatePosition,
            }}
            selection={{
              selectedGeographyTopicId,
              selectedReferenceLineId,
              selectedCountryCode,
              selectedTerritoryId,
              selectedWaterbodyId,
              selectedLinearFeatureId,
              selectedMountainRangeId,
              selectedDesertId,
              selectedLandmarkId,
            }}
            hover={{
              hoveredCountryCode,
              hoveredWaterbodyId,
              hoveredLinearFeatureId,
              hoveredMountainRangeId,
              hoveredDesertId,
              hoveredLandmarkId,
            }}
            events={{
              onSelectCountry: selectCountry,
              onHoverCountry: hoverCountry,
              onSelectWaterbody: selectWaterbody,
              onHoverWaterbody: hoverWaterbody,
              onSelectLinearFeature: selectLinearFeature,
              onHoverLinearFeature: hoverLinearFeature,
              onSelectMountainRange: selectMountainRange,
              onHoverMountainRange: hoverMountainRange,
              onSelectDesert: selectDesert,
              onHoverDesert: hoverDesert,
              onSelectLandmark: selectLandmark,
              onHoverLandmark: hoverLandmark,
              onSelectGeographyTopic: selectGeographyTopic,
              onSelectClimatePosition: (position) =>
                selectClimateAtPosition(position, false),
              onViewCenterChange: handleViewCenterChange,
              onViewCenterCommit: handleViewCenterCommit,
            }}
          />
        </Suspense>
      ) : (
        <div className="fallback-stage">
          <WebGLFallback />
        </div>
      )}

      {webGLAvailable ? <LayerControl groups={layerGroups} /> : null}

      {failedGeometryResources.length > 0 ? (
        <div className="geometry-resource-status" role="alert">
          <span>部分地图资源加载失败，基础探索仍可继续。</span>
          {failedGeometryResources.map((resource) => (
            <button key={resource.label} type="button" onClick={resource.retry}>
              重新加载{resource.label}
            </button>
          ))}
        </div>
      ) : null}

      <WorldMiniMap
        countryBoundaries={countryBoundaryResource.data}
        ref={miniMapRef}
        expanded={miniMapExpanded}
        selectedCountryCode={selectedCountryCode}
        showGeographyLearningLayer={showGeographyLearningLayer}
        showClimateLayer={showClimateLayer}
        selectedClimateTypeId={selectedClimateTypeId}
        climateRasterUrl={climateRasterUrl}
        climateBoundaryRasterUrl={climateBoundaryRasterUrl}
        selectedClimatePosition={selectedClimatePosition}
        onSelectGeographyTopic={openGeographyTopic}
        onSelectClimatePosition={(position) =>
          selectClimateAtPosition(position, true)
        }
        onExpandedChange={setMiniMapExpanded}
        onNavigate={handleMiniMapNavigation}
      />

      {webGLAvailable ? (
        <div
          className="control-deck"
          data-scene-overlay={sceneOverlayRoles.controls}
        >
          <div className="control-deck-content">
            <nav className="control-dock" aria-label="地球显示控制">
              <ControlButton
                icon={<CompassIcon />}
                label={t(effectiveAutoRotate ? 'rotateOn' : 'rotateOff')}
                onClick={toggleAutoRotate}
                disabled={reducedMotion}
                aria-pressed={effectiveAutoRotate}
              />
              <ControlButton
                icon={<SparkleIcon />}
                label={t(
                  quality === 'balanced' ? 'qualityBalanced' : 'qualityLow',
                )}
                onClick={toggleQuality}
                aria-pressed={quality === 'balanced'}
              />
              <ControlButton
                icon={<ResetIcon />}
                label={t('reset')}
                onClick={() => {
                  navigateToCountry('CN')
                }}
              />
            </nav>
            {persistenceStatus === 'saving' ||
            persistenceStatus === 'memory-only' ||
            persistenceStatus === 'error' ? (
              <output className="experience-persistence-status" role="status">
                {persistenceStatus === 'saving'
                  ? '正在保存本机偏好…'
                  : persistenceStatus === 'memory-only'
                    ? '当前偏好仅在本次使用期间保留'
                    : '本机偏好保存失败，当前设置仍可继续使用'}
              </output>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedCountry ? (
        <CountryDetailPanel
          key={selectedCountry.code}
          country={selectedCountry}
          cities={visibleCountryCities}
          onSelectCountry={navigateToCountry}
          onSelectTerritory={navigateToTerritory}
        />
      ) : null}
      {selectedTerritory ? (
        <TerritoryDetailPanel
          key={selectedTerritory.id}
          territory={selectedTerritory}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedWaterbody ? (
        <WaterbodyDetailPanel
          key={selectedWaterbody.id}
          waterbody={selectedWaterbody}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedLinearFeature ? (
        <LinearGeoFeatureDetailPanel
          key={selectedLinearFeature.id}
          feature={selectedLinearFeature}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedMountainRange ? (
        <MountainRangeDetailPanel
          key={selectedMountainRange.id}
          range={selectedMountainRange}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedDesert ? (
        <DesertDetailPanel
          key={selectedDesert.id}
          desert={selectedDesert}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedLandmark ? (
        <LandmarkDetailPanel
          key={selectedLandmark.id}
          landmark={selectedLandmark}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {geographySelection ? (
        <GeographyLearningPanel
          selection={geographySelection}
          viewCenter={committedViewCenter}
          onSelectLine={openGeographyLine}
          onShowOverview={openGeographyOverview}
        />
      ) : null}
      {climateSelection ? (
        <ClimateLearningPanel
          selection={climateSelection}
          onSelectType={selectClimateType}
          onShowOverview={() => dispatch({ type: 'showClimateOverview' })}
        />
      ) : null}
      {selection === null ? <ExploreGuideCard /> : null}
    </main>
  )
}
