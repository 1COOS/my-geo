import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useTranslation } from 'react-i18next'

import { getClimateType } from '../../data/climateLearning'
import {
  classifyClimatePosition,
  getClimateRasterAsset,
  loadClimateDisplayAssets,
  preloadClimateRaster,
} from '../../data/climateRaster'
import type { ClimateTypeId } from '../../data/climateLearningSchema'
import { getCitiesForCountry, getCity, getCountry } from '../../data/countries'
import { getDesert } from '../../data/deserts'
import {
  geographyLearningOverview,
  getGeographyTopic,
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
  loadWaterbodyGeometries,
  prefetchGeometryAssets,
} from '../../data/geometryResources'
import { getLinearGeoFeature } from '../../data/linearGeoFeatures'
import { getMountainRange } from '../../data/mountainRanges'
import { getWaterbody } from '../../data/waterbodies'
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
import {
  CITY_CAMERA_DISTANCE,
  OVERVIEW_CAMERA_DISTANCE,
} from '../../scene/countrySceneInteraction'
import { LANDMARK_CAMERA_DISTANCE } from '../../scene/landmarkSceneInteraction'
import { CountryDetailPanel } from './CountryDetailPanel'
import { CountrySearch } from './CountrySearch'
import { ClimateLearningPanel } from './ClimateLearningPanel'
import type { PlaceSearchResult } from './countrySearchUtils'
import { DesertDetailPanel } from './DesertDetailPanel'
import { parseExploreDeepLinkPosition } from './exploreDeepLinks'
import { ExploreGuideCard } from './ExploreGuideCard'
import { GeographyLearningPanel } from './GeographyLearningPanel'
import { LinearGeoFeatureDetailPanel } from './LinearGeoFeatureDetailPanel'
import { LandmarkDetailPanel } from './LandmarkDetailPanel'
import { MountainRangeDetailPanel } from './MountainRangeDetailPanel'
import { WaterbodyDetailPanel } from './WaterbodyDetailPanel'
import {
  exploreReducer,
  getSelectedCountryCode,
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.2 4.2" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.8 8 4.4-8 4.4-8-4.4z" />
      <path d="m4 12.1 8 4.4 8-4.4" />
      <path d="m4 16 8 4.4 8-4.4" />
    </svg>
  )
}

type LayerControlProps = {
  open: boolean
  panelId: string
  containerRef: RefObject<HTMLElement | null>
  triggerRef: RefObject<HTMLButtonElement | null>
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
  showClimateLayer: boolean
  onToggleCapitals: () => void
  onToggleCities: () => void
  onToggleOceanLayer: () => void
  onToggleLakeLayer: () => void
  onToggleWaterwayLayer: () => void
  onToggleRiverAndCanalLayer: () => void
  onToggleMountainLayer: () => void
  onToggleDesertLayer: () => void
  onToggleLandmarkLayer: () => void
  onToggleGeographyLearningLayer: () => void
  onToggleClimateLayer: () => void
  onToggleOpen: () => void
}

type LayerOption = {
  id: string
  label: string
  className: string
  pressed: boolean
  onToggle: () => void
  accessibleLabel?: string
  title?: string
  describedBy?: string
}

function LayerControl({
  open,
  panelId,
  containerRef,
  triggerRef,
  showCapitals,
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
  onToggleCapitals,
  onToggleCities,
  onToggleOceanLayer,
  onToggleLakeLayer,
  onToggleWaterwayLayer,
  onToggleRiverAndCanalLayer,
  onToggleMountainLayer,
  onToggleDesertLayer,
  onToggleLandmarkLayer,
  onToggleGeographyLearningLayer,
  onToggleClimateLayer,
  onToggleOpen,
}: LayerControlProps) {
  const groups: Array<{ id: string; label: string; items: LayerOption[] }> = [
    {
      id: 'labels',
      label: '标注',
      items: [
        {
          id: 'capitals',
          label: '首都',
          className: 'is-capital',
          pressed: showCapitals,
          onToggle: onToggleCapitals,
        },
        {
          id: 'cities',
          label: '城市',
          className: 'is-city',
          pressed: showCities,
          onToggle: onToggleCities,
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
          accessibleLabel:
            '经纬图层：经度基准、半球界线、纬度分区线与五带分界线',
          title: '经纬：地球重要经纬线',
          onToggle: onToggleGeographyLearningLayer,
        },
        {
          id: 'climate',
          label: '气候',
          className: 'is-climate',
          pressed: showClimateLayer,
          accessibleLabel: '世界气候类型教学图层',
          title: '气候：世界13类气候类型',
          onToggle: onToggleClimateLayer,
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
          describedBy: 'ocean-layer-description',
          onToggle: onToggleOceanLayer,
        },
        {
          id: 'lake',
          label: '湖泊',
          className: 'is-lake',
          pressed: showLakeLayer,
          accessibleLabel: '湖泊图层：世界著名淡水与咸水湖泊',
          title: '湖泊：世界著名淡水与咸水湖泊',
          onToggle: onToggleLakeLayer,
        },
        {
          id: 'waterway',
          label: '水域',
          className: 'is-waterway',
          pressed: showWaterwayLayer,
          describedBy: 'waterway-layer-description',
          onToggle: onToggleWaterwayLayer,
        },
        {
          id: 'river',
          label: '河流',
          className: 'is-river',
          pressed: showRiverAndCanalLayer,
          accessibleLabel: '河流图层：世界重要河流与人工运河',
          title: '河流：世界重要河流与人工运河',
          onToggle: onToggleRiverAndCanalLayer,
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
          accessibleLabel: '山脉图层：世界著名山脉与最高峰',
          title: '山脉：世界著名山脉与最高峰',
          onToggle: onToggleMountainLayer,
        },
        {
          id: 'desert',
          label: '沙漠',
          className: 'is-desert',
          pressed: showDesertLayer,
          accessibleLabel: '沙漠图层：世界主要沙漠与荒漠景观',
          title: '沙漠：世界主要沙漠与荒漠景观',
          onToggle: onToggleDesertLayer,
        },
        {
          id: 'landmark',
          label: '古迹',
          className: 'is-landmark',
          pressed: showLandmarkLayer,
          accessibleLabel: '名胜古迹图层：世界著名文化与历史遗产',
          title: '古迹：世界著名文化与历史遗产',
          onToggle: onToggleLandmarkLayer,
        },
      ],
    },
  ]
  const activeCount = groups.reduce(
    (count, group) => count + group.items.filter((item) => item.pressed).length,
    0,
  )

  return (
    <section
      ref={containerRef}
      className="layer-control"
      data-scene-overlay="layers"
      aria-label="地球图层控制"
    >
      <button
        ref={triggerRef}
        type="button"
        className="layer-control-trigger"
        aria-label={`图层，已开启 ${activeCount} 项`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.stopPropagation()
          onToggleOpen()
        }}
      >
        <span className="layer-control-icon" aria-hidden="true">
          <LayersIcon />
        </span>
        <span>图层</span>
        <strong aria-hidden="true">{activeCount}</strong>
      </button>
      {open ? (
        <div
          id={panelId}
          className="layer-control-panel"
          role="region"
          aria-label="图层选择"
        >
          <div className="layer-control-groups">
            {groups.map((group) => (
              <section
                key={group.id}
                className="layer-control-group"
                aria-labelledby={`${panelId}-${group.id}`}
              >
                <h2 id={`${panelId}-${group.id}`}>{group.label}</h2>
                <div className="layer-control-options">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`layer-toggle ${item.className}`}
                      aria-pressed={item.pressed}
                      aria-label={item.accessibleLabel}
                      aria-describedby={item.describedBy}
                      title={item.title}
                      onClick={item.onToggle}
                    >
                      <span className="layer-toggle-dot" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
      <span id="ocean-layer-description" className="sr-only">
        海洋：大洋、海与海湾
      </span>
      <span id="waterway-layer-description" className="sr-only">
        水域：海峡与海沟
      </span>
    </section>
  )
}

export function ExplorePage() {
  const { t } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()
  const searchDialogId = useId()
  const layerPanelId = useId()
  const cameraRequestIdRef = useRef(0)
  const climateRequestIdRef = useRef(0)
  const currentViewCenterRef = useRef<GeoPosition>(getCountry('CN')!.center)
  const miniMapRef = useRef<WorldMiniMapHandle>(null)
  const layerControlRef = useRef<HTMLElement>(null)
  const layerButtonRef = useRef<HTMLButtonElement>(null)
  const controlDeckRef = useRef<HTMLDivElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const [exploreState, dispatch] = useReducer(
    exploreReducer,
    initialExploreState,
  )
  const [miniMapExpanded, setMiniMapExpanded] = useState(false)
  const [activeControlPanel, setActiveControlPanel] = useState<
    'layers' | 'search' | null
  >(null)
  const layerPanelOpen = activeControlPanel === 'layers'
  const searchOpen = activeControlPanel === 'search'
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
    capitals: showCapitals,
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
  const selectedCityId = selection?.kind === 'city' ? selection.cityId : null
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
  const hoveredCityId = hover?.kind === 'city' ? hover.cityId : null
  const hoveredWaterbodyId =
    hover?.kind === 'waterbody' ? hover.waterbodyId : null
  const hoveredLinearFeatureId =
    hover?.kind === 'linearFeature' ? hover.featureId : null
  const hoveredMountainRangeId =
    hover?.kind === 'mountainRange' ? hover.rangeId : null
  const hoveredDesertId = hover?.kind === 'desert' ? hover.desertId : null
  const hoveredLandmarkId = hover?.kind === 'landmark' ? hover.landmarkId : null
  const countryBoundaryResource = useGeometryResource(loadCountryBoundaries)
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

  const closeControlPanel = useCallback((panel: 'layers' | 'search') => {
    setActiveControlPanel((current) => (current === panel ? null : current))
    queueMicrotask(() =>
      (panel === 'layers' ? layerButtonRef : searchButtonRef).current?.focus({
        preventScroll: true,
      }),
    )
  }, [])

  const closeSearch = useCallback(
    () => closeControlPanel('search'),
    [closeControlPanel],
  )

  useEffect(() => {
    if (!activeControlPanel) return

    const handleClick = (event: MouseEvent) => {
      const activeContainer =
        activeControlPanel === 'layers'
          ? layerControlRef.current
          : controlDeckRef.current
      if (activeContainer?.contains(event.target as Node)) return
      closeControlPanel(activeControlPanel)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeControlPanel(activeControlPanel)
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeControlPanel, closeControlPanel])

  const selectedCountry = getCountry(selectedCountryCode)
  const selectedCity = getCity(selectedCityId)
  const selectedWaterbody = getWaterbody(selectedWaterbodyId)
  const selectedLinearFeature = getLinearGeoFeature(selectedLinearFeatureId)
  const selectedMountainRange = getMountainRange(selectedMountainRangeId)
  const selectedDesert = getDesert(selectedDesertId)
  const selectedLandmark = getLandmark(selectedLandmarkId)
  const selectedGeographyTopic = getGeographyTopic(selectedGeographyTopicId)
  const selectedReferenceLine = getReferenceLine(selectedReferenceLineId)
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
  const toggleCapitalLayer = useCallback(() => {
    dispatch({ type: 'toggleLayer', layer: 'capitals' })
  }, [])
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
  const openGeographyTopic = useCallback(
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
      if (referenceLine) {
        requestCameraTarget(
          referenceLine.focusPosition,
          referenceLine.cameraDistance,
        )
      }
    },
    [requestCameraTarget],
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
  const navigateToCountry = useCallback(
    (countryCode: string) => {
      const country = getCountry(countryCode)
      if (!country) return
      setMiniMapExpanded(false)
      dispatch({
        type: 'select',
        selection: { kind: 'country', countryCode },
      })
      requestCameraTarget(country.center)
    },
    [requestCameraTarget],
  )
  const navigateToCity = useCallback(
    (cityId: string) => {
      const city = getCity(cityId)
      if (!city) return
      setMiniMapExpanded(false)
      dispatch({
        type: 'select',
        selection: {
          kind: 'city',
          cityId: city.id,
          countryCode: city.countryCode,
        },
      })
      requestCameraTarget(
        { latitude: city.latitude, longitude: city.longitude },
        CITY_CAMERA_DISTANCE,
      )
    },
    [requestCameraTarget],
  )
  const navigateToWaterbody = useCallback(
    (waterbodyId: string) => {
      const waterbody = getWaterbody(waterbodyId)
      if (!waterbody) return
      setMiniMapExpanded(false)
      dispatch({
        type: 'select',
        selection: { kind: 'waterbody', waterbodyId: waterbody.id },
      })
      requestCameraTarget(waterbody.center, waterbody.cameraDistance)
    },
    [requestCameraTarget],
  )
  const navigateToLinearFeature = useCallback(
    (featureId: string) => {
      const feature = getLinearGeoFeature(featureId)
      if (!feature) return
      setMiniMapExpanded(false)
      dispatch({
        type: 'select',
        selection: { kind: 'linearFeature', featureId: feature.id },
      })
      requestCameraTarget(feature.cameraPosition, feature.cameraDistance)
    },
    [requestCameraTarget],
  )
  const navigateToMountainRange = useCallback(
    (rangeId: string) => {
      const range = getMountainRange(rangeId)
      if (!range) return
      setMiniMapExpanded(false)
      dispatch({
        type: 'select',
        selection: { kind: 'mountainRange', rangeId: range.id },
      })
      requestCameraTarget(range.cameraPosition, range.cameraDistance)
    },
    [requestCameraTarget],
  )
  const navigateToDesert = useCallback(
    (desertId: string) => {
      const desert = getDesert(desertId)
      if (!desert) return
      setMiniMapExpanded(false)
      dispatch({
        type: 'select',
        selection: { kind: 'desert', desertId: desert.id },
      })
      requestCameraTarget(desert.center, desert.cameraDistance)
    },
    [requestCameraTarget],
  )
  const requestedDeepLinks = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search)
    return {
      countryCode: searchParams.get('country')?.toUpperCase(),
      geography: resolveGeographyExploreSelection(
        searchParams.get('geography'),
        searchParams.get('line'),
      ),
      waterbodyId: searchParams.get('waterbody'),
      linearFeatureId: searchParams.get('linearFeature'),
      mountainRangeId: searchParams.get('mountainRange'),
      desertId: searchParams.get('desert'),
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
    navigateToMountainRange,
    navigateToWaterbody,
    openGeographyOverview,
    openGeographyTopic,
    requestCameraTarget,
    requestedDeepLinks,
  ])
  const navigateToLandmark = useCallback(
    (landmarkId: string) => {
      const landmark = getLandmark(landmarkId)
      if (!landmark) return
      setMiniMapExpanded(false)
      dispatch({
        type: 'select',
        selection: { kind: 'landmark', landmarkId: landmark.id },
      })
      requestCameraTarget(landmark.position, LANDMARK_CAMERA_DISTANCE)
    },
    [requestCameraTarget],
  )
  const navigateToSearchResult = useCallback(
    (result: PlaceSearchResult) => {
      if (result.type === 'country') navigateToCountry(result.country.code)
      else if (result.type === 'city') navigateToCity(result.city.id)
      else if (result.type === 'waterbody')
        navigateToWaterbody(result.waterbody.id)
      else if (result.type === 'linearFeature')
        navigateToLinearFeature(result.feature.id)
      else if (result.type === 'mountainRange')
        navigateToMountainRange(result.range.id)
      else if (result.type === 'desert') navigateToDesert(result.desert.id)
      else if (result.type === 'landmark')
        navigateToLandmark(result.landmark.id)
      else if (result.type === 'geographyTopic')
        openGeographyTopic(result.topic.id, result.referenceLine?.id ?? null)
      else if (result.type === 'climateType')
        navigateToClimateType(result.climateType.id)
      else openClimateOverview()
    },
    [
      navigateToCity,
      navigateToCountry,
      navigateToDesert,
      navigateToLinearFeature,
      navigateToLandmark,
      navigateToMountainRange,
      navigateToWaterbody,
      navigateToClimateType,
      openClimateOverview,
      openGeographyTopic,
    ],
  )
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
  const hoverCity = useCallback(
    (cityId: string | null) =>
      setEntityHover(cityId ? { kind: 'city', cityId } : null),
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
    hoveredCountryCode === null &&
    hoveredCityId === null &&
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
              showCapitals,
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
              selectedCityId,
              selectedWaterbodyId,
              selectedLinearFeatureId,
              selectedMountainRangeId,
              selectedDesertId,
              selectedLandmarkId,
            }}
            hover={{
              hoveredCountryCode,
              hoveredCityId,
              hoveredWaterbodyId,
              hoveredLinearFeatureId,
              hoveredMountainRangeId,
              hoveredDesertId,
              hoveredLandmarkId,
            }}
            events={{
              onSelectCountry: navigateToCountry,
              onSelectCity: navigateToCity,
              onHoverCountry: hoverCountry,
              onHoverCity: hoverCity,
              onSelectWaterbody: navigateToWaterbody,
              onHoverWaterbody: hoverWaterbody,
              onSelectLinearFeature: navigateToLinearFeature,
              onHoverLinearFeature: hoverLinearFeature,
              onSelectMountainRange: navigateToMountainRange,
              onHoverMountainRange: hoverMountainRange,
              onSelectDesert: navigateToDesert,
              onHoverDesert: hoverDesert,
              onSelectLandmark: navigateToLandmark,
              onHoverLandmark: hoverLandmark,
              onSelectGeographyTopic: openGeographyTopic,
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

      {webGLAvailable ? (
        <LayerControl
          open={layerPanelOpen}
          panelId={layerPanelId}
          containerRef={layerControlRef}
          triggerRef={layerButtonRef}
          showCapitals={showCapitals}
          showCities={showCities}
          showOceanLayer={showOceanLayer}
          showLakeLayer={showLakeLayer}
          showWaterwayLayer={showWaterwayLayer}
          showRiverAndCanalLayer={showRiverAndCanalLayer}
          showMountainLayer={showMountainLayer}
          showDesertLayer={showDesertLayer}
          showLandmarkLayer={showLandmarkLayer}
          showGeographyLearningLayer={showGeographyLearningLayer}
          showClimateLayer={showClimateLayer}
          onToggleCapitals={toggleCapitalLayer}
          onToggleCities={toggleCityLayer}
          onToggleOceanLayer={toggleOceanLayer}
          onToggleLakeLayer={toggleLakeLayer}
          onToggleWaterwayLayer={toggleWaterwayLayer}
          onToggleRiverAndCanalLayer={toggleRiverAndCanalLayer}
          onToggleMountainLayer={toggleMountainLayer}
          onToggleDesertLayer={toggleDesertLayer}
          onToggleLandmarkLayer={toggleLandmarkLayer}
          onToggleGeographyLearningLayer={toggleGeographyLearningLayer}
          onToggleClimateLayer={toggleClimateLayer}
          onToggleOpen={() =>
            setActiveControlPanel((current) =>
              current === 'layers' ? null : 'layers',
            )
          }
        />
      ) : null}

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

      <div className="control-deck" data-scene-overlay="controls">
        <div ref={controlDeckRef} className="control-deck-content">
          {searchOpen ? (
            <section
              id={searchDialogId}
              className="search-dialog"
              role="dialog"
              aria-label="搜索地点"
            >
              <CountrySearch
                key={
                  selectedCountry?.code ??
                  selectedCity?.id ??
                  selectedWaterbody?.id ??
                  selectedLinearFeature?.id ??
                  selectedMountainRange?.id ??
                  selectedDesert?.id ??
                  selectedLandmark?.id ??
                  selectedReferenceLine?.id ??
                  selectedGeographyTopic?.id ??
                  selectedClimateType?.id ??
                  (climateSelection ? 'climate-overview' : null) ??
                  'no-selection'
                }
                selectedLabel={
                  selectedCity?.name.zh ??
                  selectedCountry?.name.zh ??
                  selectedWaterbody?.name.zh ??
                  selectedLinearFeature?.name.zh ??
                  selectedMountainRange?.name.zh ??
                  selectedDesert?.name.zh ??
                  selectedLandmark?.name.zh ??
                  selectedReferenceLine?.name.zh ??
                  (geographySelection
                    ? geographyLearningOverview.name.zh
                    : undefined) ??
                  selectedClimateType?.name.zh ??
                  (climateSelection ? '世界气候类型' : undefined)
                }
                onSelect={navigateToSearchResult}
                autoFocus
                onRequestClose={closeSearch}
              />
            </section>
          ) : null}
          <nav className="control-dock" aria-label="地球显示控制">
            {webGLAvailable ? (
              <>
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
              </>
            ) : null}
            <ControlButton
              ref={searchButtonRef}
              className="search-control"
              icon={<SearchIcon />}
              label="搜索地点"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              aria-controls={searchDialogId}
              onClick={(event) => {
                event.stopPropagation()
                setActiveControlPanel((current) =>
                  current === 'search' ? null : 'search',
                )
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

      {selectedCountry ? (
        <CountryDetailPanel
          key={selectedCountry.code}
          country={selectedCountry}
          cities={visibleCountryCities}
          selectedCity={selectedCity}
          onSelectCity={navigateToCity}
          onBackToCountry={() => dispatch({ type: 'backToCountry' })}
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
