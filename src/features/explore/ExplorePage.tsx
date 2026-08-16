import { useReducedMotion } from 'motion/react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { getCitiesForCountry, getCity, getCountry } from '../../data/countries'
import { getDesert } from '../../data/deserts'
import {
  getLinearGeoFeature,
  getLinearGeoFeatureGeometry,
} from '../../data/linearGeoFeatures'
import { getMountainRange } from '../../data/mountainRanges'
import { getWaterbody } from '../../data/waterbodies'
import { ControlButton } from '../../shared/components/ControlButton'
import { WebGLFallback } from '../../shared/components/WebGLFallback'
import { supportsWebGL } from '../../shared/lib/webgl'
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
import { getCanalCameraDistance } from '../../scene/linearFeatureSceneInteraction'
import { CountryDetailPanel } from './CountryDetailPanel'
import { CountrySearch } from './CountrySearch'
import type { PlaceSearchResult } from './countrySearchUtils'
import { DesertDetailPanel } from './DesertDetailPanel'
import { LinearGeoFeatureDetailPanel } from './LinearGeoFeatureDetailPanel'
import { MountainRangeDetailPanel } from './MountainRangeDetailPanel'
import { WaterbodyDetailPanel } from './WaterbodyDetailPanel'
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
  showCapitals: boolean
  showCities: boolean
  showOceanLayer: boolean
  showWaterwayLayer: boolean
  showRiverAndCanalLayer: boolean
  showMountainLayer: boolean
  showDesertLayer: boolean
  onToggleCapitals: () => void
  onToggleCities: () => void
  onToggleOceanLayer: () => void
  onToggleWaterwayLayer: () => void
  onToggleRiverAndCanalLayer: () => void
  onToggleMountainLayer: () => void
  onToggleDesertLayer: () => void
}

function LayerControl({
  showCapitals,
  showCities,
  showOceanLayer,
  showWaterwayLayer,
  showRiverAndCanalLayer,
  showMountainLayer,
  showDesertLayer,
  onToggleCapitals,
  onToggleCities,
  onToggleOceanLayer,
  onToggleWaterwayLayer,
  onToggleRiverAndCanalLayer,
  onToggleMountainLayer,
  onToggleDesertLayer,
}: LayerControlProps) {
  return (
    <section className="layer-control" aria-label="地球图层控制">
      <div className="layer-control-heading">
        <span className="layer-control-icon" aria-hidden="true">
          <LayersIcon />
        </span>
        <span>图层</span>
      </div>
      <div className="layer-control-options">
        <button
          type="button"
          className="layer-toggle is-capital"
          aria-pressed={showCapitals}
          onClick={onToggleCapitals}
        >
          <span className="layer-toggle-dot" aria-hidden="true" />
          <span>首都</span>
        </button>
        <button
          type="button"
          className="layer-toggle is-city"
          aria-pressed={showCities}
          onClick={onToggleCities}
        >
          <span className="layer-toggle-dot" aria-hidden="true" />
          <span>城市</span>
        </button>
        <button
          type="button"
          className="layer-toggle is-ocean"
          aria-pressed={showOceanLayer}
          aria-describedby="ocean-layer-description"
          onClick={onToggleOceanLayer}
        >
          <span className="layer-toggle-dot" aria-hidden="true" />
          <span>海洋</span>
        </button>
        <button
          type="button"
          className="layer-toggle is-waterway"
          aria-pressed={showWaterwayLayer}
          aria-describedby="waterway-layer-description"
          onClick={onToggleWaterwayLayer}
        >
          <span className="layer-toggle-dot" aria-hidden="true" />
          <span>水域</span>
        </button>
        <button
          type="button"
          className="layer-toggle is-river"
          aria-pressed={showRiverAndCanalLayer}
          aria-label="河流图层：世界重要河流与人工运河"
          title="河流：世界重要河流与人工运河"
          onClick={onToggleRiverAndCanalLayer}
        >
          <span className="layer-toggle-dot" aria-hidden="true" />
          <span>河流</span>
        </button>
        <button
          type="button"
          className="layer-toggle is-mountain"
          aria-pressed={showMountainLayer}
          aria-label="山脉图层：世界著名山脉与最高峰"
          title="山脉：世界著名山脉与最高峰"
          onClick={onToggleMountainLayer}
        >
          <span className="layer-toggle-dot" aria-hidden="true" />
          <span>山脉</span>
        </button>
        <button
          type="button"
          className="layer-toggle is-desert"
          aria-pressed={showDesertLayer}
          aria-label="沙漠图层：世界主要沙漠与荒漠景观"
          title="沙漠：世界主要沙漠与荒漠景观"
          onClick={onToggleDesertLayer}
        >
          <span className="layer-toggle-dot" aria-hidden="true" />
          <span>沙漠</span>
        </button>
      </div>
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
  const reducedMotion = useReducedMotion() ?? false
  const searchDialogId = useId()
  const cameraRequestIdRef = useRef(0)
  const miniMapRef = useRef<WorldMiniMapHandle>(null)
  const controlDeckRef = useRef<HTMLDivElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const [miniMapExpanded, setMiniMapExpanded] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showCapitals, setShowCapitals] = useState(false)
  const [showCities, setShowCities] = useState(false)
  const [showOceanLayer, setShowOceanLayer] = useState(false)
  const [showWaterwayLayer, setShowWaterwayLayer] = useState(false)
  const [showRiverAndCanalLayer, setShowRiverAndCanalLayer] = useState(false)
  const [showMountainLayer, setShowMountainLayer] = useState(false)
  const [showDesertLayer, setShowDesertLayer] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null)
  const [selectedWaterbodyId, setSelectedWaterbodyId] = useState<string | null>(
    null,
  )
  const [hoveredWaterbodyId, setHoveredWaterbodyId] = useState<string | null>(
    null,
  )
  const [selectedLinearFeatureId, setSelectedLinearFeatureId] = useState<
    string | null
  >(null)
  const [hoveredLinearFeatureId, setHoveredLinearFeatureId] = useState<
    string | null
  >(null)
  const [selectedMountainRangeId, setSelectedMountainRangeId] = useState<
    string | null
  >(null)
  const [hoveredMountainRangeId, setHoveredMountainRangeId] = useState<
    string | null
  >(null)
  const [selectedDesertId, setSelectedDesertId] = useState<string | null>(null)
  const [hoveredDesertId, setHoveredDesertId] = useState<string | null>(null)
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(() => ({
    requestId: 0,
    position: getCountry('CN')!.center,
    distance: OVERVIEW_CAMERA_DISTANCE,
  }))
  const webGLAvailable = useMemo(() => supportsWebGL(), [])
  const {
    autoRotate,
    quality,
    selectedCountryCode,
    hoveredCountryCode,
    hydrate,
    toggleAutoRotate,
    toggleQuality,
    selectCountry,
    hoverCountry,
  } = useExperienceStore()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    queueMicrotask(() =>
      searchButtonRef.current?.focus({ preventScroll: true }),
    )
  }, [])

  useEffect(() => {
    if (!searchOpen) return

    const handleClick = (event: MouseEvent) => {
      if (controlDeckRef.current?.contains(event.target as Node)) return
      closeSearch()
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [closeSearch, searchOpen])

  const selectedCountry = getCountry(selectedCountryCode)
  const selectedCity = getCity(selectedCityId)
  const selectedWaterbody = getWaterbody(selectedWaterbodyId)
  const selectedLinearFeature = getLinearGeoFeature(selectedLinearFeatureId)
  const selectedMountainRange = getMountainRange(selectedMountainRangeId)
  const selectedDesert = getDesert(selectedDesertId)
  const visibleCountryCities = getCitiesForCountry(selectedCountryCode)
  const toggleCapitalLayer = useCallback(() => {
    const nextVisible = !showCapitals
    setShowCapitals(nextVisible)
    if (nextVisible) return
    setHoveredCityId((cityId) => {
      const city = getCity(cityId)
      return city?.isCapital && city.id !== selectedCityId ? null : cityId
    })
  }, [selectedCityId, showCapitals])
  const toggleCityLayer = useCallback(() => {
    const nextVisible = !showCities
    setShowCities(nextVisible)
    if (nextVisible) return
    setHoveredCityId((cityId) => {
      const city = getCity(cityId)
      return city && !city.isCapital && city.id !== selectedCityId
        ? null
        : cityId
    })
  }, [selectedCityId, showCities])
  const toggleOceanLayer = useCallback(() => {
    const nextVisible = !showOceanLayer
    setShowOceanLayer(nextVisible)
    if (!nextVisible) {
      setHoveredWaterbodyId((id) => {
        const waterbody = getWaterbody(id)
        return waterbody?.layer === 'ocean' && id !== selectedWaterbodyId
          ? null
          : id
      })
    }
  }, [selectedWaterbodyId, showOceanLayer])
  const toggleWaterwayLayer = useCallback(() => {
    const nextVisible = !showWaterwayLayer
    setShowWaterwayLayer(nextVisible)
    if (!nextVisible) {
      setHoveredWaterbodyId((id) => {
        const waterbody = getWaterbody(id)
        return waterbody?.layer === 'waterway' && id !== selectedWaterbodyId
          ? null
          : id
      })
    }
  }, [selectedWaterbodyId, showWaterwayLayer])
  const toggleRiverAndCanalLayer = useCallback(() => {
    const nextVisible = !showRiverAndCanalLayer
    setShowRiverAndCanalLayer(nextVisible)
    if (!nextVisible) {
      setHoveredLinearFeatureId((id) => {
        return id && id !== selectedLinearFeatureId ? null : id
      })
    }
  }, [selectedLinearFeatureId, showRiverAndCanalLayer])
  const toggleMountainLayer = useCallback(() => {
    const nextVisible = !showMountainLayer
    setShowMountainLayer(nextVisible)
    if (!nextVisible && hoveredMountainRangeId !== selectedMountainRangeId) {
      setHoveredMountainRangeId(null)
    }
  }, [hoveredMountainRangeId, selectedMountainRangeId, showMountainLayer])
  const toggleDesertLayer = useCallback(() => {
    const nextVisible = !showDesertLayer
    setShowDesertLayer(nextVisible)
    if (!nextVisible) setHoveredDesertId(null)
  }, [showDesertLayer])
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
  const navigateToCountry = useCallback(
    (countryCode: string) => {
      const country = getCountry(countryCode)
      if (!country) return
      setMiniMapExpanded(false)
      setSelectedCityId(null)
      setHoveredCityId(null)
      setSelectedWaterbodyId(null)
      setHoveredWaterbodyId(null)
      setSelectedLinearFeatureId(null)
      setHoveredLinearFeatureId(null)
      setSelectedMountainRangeId(null)
      setHoveredMountainRangeId(null)
      setSelectedDesertId(null)
      setHoveredDesertId(null)
      selectCountry(countryCode)
      requestCameraTarget(country.center)
    },
    [requestCameraTarget, selectCountry],
  )
  const navigateToCity = useCallback(
    (cityId: string) => {
      const city = getCity(cityId)
      if (!city) return
      setMiniMapExpanded(false)
      selectCountry(city.countryCode)
      setSelectedWaterbodyId(null)
      setHoveredWaterbodyId(null)
      setSelectedLinearFeatureId(null)
      setHoveredLinearFeatureId(null)
      setSelectedMountainRangeId(null)
      setHoveredMountainRangeId(null)
      setSelectedDesertId(null)
      setHoveredDesertId(null)
      setSelectedCityId(city.id)
      requestCameraTarget(
        { latitude: city.latitude, longitude: city.longitude },
        CITY_CAMERA_DISTANCE,
      )
    },
    [requestCameraTarget, selectCountry],
  )
  const clearSelection = useCallback(() => {
    setSelectedCityId(null)
    setHoveredCityId(null)
    selectCountry(null)
    setSelectedWaterbodyId(null)
    setHoveredWaterbodyId(null)
    setSelectedLinearFeatureId(null)
    setHoveredLinearFeatureId(null)
    setSelectedMountainRangeId(null)
    setHoveredMountainRangeId(null)
    setSelectedDesertId(null)
    setHoveredDesertId(null)
  }, [selectCountry])
  const navigateToWaterbody = useCallback(
    (waterbodyId: string) => {
      const waterbody = getWaterbody(waterbodyId)
      if (!waterbody) return
      setMiniMapExpanded(false)
      selectCountry(null)
      setSelectedCityId(null)
      setHoveredCityId(null)
      setSelectedWaterbodyId(waterbody.id)
      setSelectedLinearFeatureId(null)
      setHoveredLinearFeatureId(null)
      setSelectedMountainRangeId(null)
      setHoveredMountainRangeId(null)
      setSelectedDesertId(null)
      setHoveredDesertId(null)
      requestCameraTarget(waterbody.center, waterbody.cameraDistance)
    },
    [requestCameraTarget, selectCountry],
  )
  const navigateToLinearFeature = useCallback(
    (featureId: string) => {
      const feature = getLinearGeoFeature(featureId)
      if (!feature) return
      setMiniMapExpanded(false)
      selectCountry(null)
      setSelectedCityId(null)
      setHoveredCityId(null)
      setSelectedWaterbodyId(null)
      setHoveredWaterbodyId(null)
      setSelectedMountainRangeId(null)
      setHoveredMountainRangeId(null)
      setSelectedDesertId(null)
      setHoveredDesertId(null)
      setSelectedLinearFeatureId(feature.id)
      const geometry = getLinearGeoFeatureGeometry(feature.id)?.geometry
      const cameraDistance =
        feature.kind === 'canal'
          ? getCanalCameraDistance(geometry)
          : feature.cameraDistance
      requestCameraTarget(feature.cameraPosition, cameraDistance)
    },
    [requestCameraTarget, selectCountry],
  )
  const navigateToMountainRange = useCallback(
    (rangeId: string) => {
      const range = getMountainRange(rangeId)
      if (!range) return
      setMiniMapExpanded(false)
      selectCountry(null)
      setSelectedCityId(null)
      setHoveredCityId(null)
      setSelectedWaterbodyId(null)
      setHoveredWaterbodyId(null)
      setSelectedLinearFeatureId(null)
      setHoveredLinearFeatureId(null)
      setSelectedMountainRangeId(range.id)
      setHoveredMountainRangeId(null)
      setSelectedDesertId(null)
      setHoveredDesertId(null)
      requestCameraTarget(range.cameraPosition, range.cameraDistance)
    },
    [requestCameraTarget, selectCountry],
  )
  const navigateToDesert = useCallback(
    (desertId: string) => {
      const desert = getDesert(desertId)
      if (!desert) return
      setMiniMapExpanded(false)
      selectCountry(null)
      setSelectedCityId(null)
      setHoveredCityId(null)
      setSelectedWaterbodyId(null)
      setHoveredWaterbodyId(null)
      setSelectedLinearFeatureId(null)
      setHoveredLinearFeatureId(null)
      setSelectedMountainRangeId(null)
      setHoveredMountainRangeId(null)
      setShowDesertLayer(true)
      setSelectedDesertId(desert.id)
      setHoveredDesertId(null)
      requestCameraTarget(desert.center, desert.cameraDistance)
    },
    [requestCameraTarget, selectCountry],
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
      else navigateToDesert(result.desert.id)
    },
    [
      navigateToCity,
      navigateToCountry,
      navigateToDesert,
      navigateToLinearFeature,
      navigateToMountainRange,
      navigateToWaterbody,
    ],
  )
  const handleMiniMapNavigation = useCallback(
    (navigation: WorldMiniMapNavigation) => {
      if (navigation.kind === 'country') {
        navigateToCountry(navigation.countryCode)
        return
      }

      clearSelection()
      requestCameraTarget(navigation.position)
    },
    [clearSelection, navigateToCountry, requestCameraTarget],
  )
  const handleViewCenterChange = useCallback((view: GlobeView) => {
    miniMapRef.current?.setViewCenter(view.position)
  }, [])
  const handleViewCenterCommit = useCallback((view: GlobeView) => {
    miniMapRef.current?.setViewCenter(view.position)
  }, [])

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
    hoveredDesertId === null

  return (
    <main
      className={
        selectedCountry ||
        selectedWaterbody ||
        selectedLinearFeature ||
        selectedMountainRange ||
        selectedDesert
          ? 'explore-shell has-country-detail'
          : 'explore-shell'
      }
    >
      <div className="space-glow space-glow-one" aria-hidden="true" />
      <div className="space-glow space-glow-two" aria-hidden="true" />

      {webGLAvailable ? (
        <Suspense
          fallback={
            <div className="scene-loading" role="status">
              正在唤醒地球…
            </div>
          }
        >
          <GlobeScene
            autoRotate={effectiveAutoRotate}
            cameraTarget={cameraTarget}
            quality={quality}
            reducedMotion={reducedMotion}
            showCapitals={showCapitals}
            showCities={showCities}
            showOceanLayer={showOceanLayer}
            showWaterwayLayer={showWaterwayLayer}
            showRiverAndCanalLayer={showRiverAndCanalLayer}
            showMountainLayer={showMountainLayer}
            showDesertLayer={showDesertLayer}
            selectedCountryCode={selectedCountryCode}
            selectedCityId={selectedCityId}
            hoveredCountryCode={hoveredCountryCode}
            hoveredCityId={hoveredCityId}
            selectedWaterbodyId={selectedWaterbodyId}
            hoveredWaterbodyId={hoveredWaterbodyId}
            selectedLinearFeatureId={selectedLinearFeatureId}
            hoveredLinearFeatureId={hoveredLinearFeatureId}
            selectedMountainRangeId={selectedMountainRangeId}
            hoveredMountainRangeId={hoveredMountainRangeId}
            selectedDesertId={selectedDesertId}
            hoveredDesertId={hoveredDesertId}
            onSelectCountry={navigateToCountry}
            onSelectCity={navigateToCity}
            onHoverCountry={hoverCountry}
            onHoverCity={setHoveredCityId}
            onSelectWaterbody={navigateToWaterbody}
            onHoverWaterbody={setHoveredWaterbodyId}
            onSelectLinearFeature={navigateToLinearFeature}
            onHoverLinearFeature={setHoveredLinearFeatureId}
            onSelectMountainRange={navigateToMountainRange}
            onHoverMountainRange={setHoveredMountainRangeId}
            onSelectDesert={navigateToDesert}
            onHoverDesert={setHoveredDesertId}
            onViewCenterChange={handleViewCenterChange}
            onViewCenterCommit={handleViewCenterCommit}
          />
        </Suspense>
      ) : (
        <div className="fallback-stage">
          <WebGLFallback />
        </div>
      )}

      {webGLAvailable ? (
        <LayerControl
          showCapitals={showCapitals}
          showCities={showCities}
          showOceanLayer={showOceanLayer}
          showWaterwayLayer={showWaterwayLayer}
          showRiverAndCanalLayer={showRiverAndCanalLayer}
          showMountainLayer={showMountainLayer}
          showDesertLayer={showDesertLayer}
          onToggleCapitals={toggleCapitalLayer}
          onToggleCities={toggleCityLayer}
          onToggleOceanLayer={toggleOceanLayer}
          onToggleWaterwayLayer={toggleWaterwayLayer}
          onToggleRiverAndCanalLayer={toggleRiverAndCanalLayer}
          onToggleMountainLayer={toggleMountainLayer}
          onToggleDesertLayer={toggleDesertLayer}
        />
      ) : null}

      {webGLAvailable ? (
        <WorldMiniMap
          ref={miniMapRef}
          expanded={miniMapExpanded}
          selectedCountryCode={selectedCountryCode}
          onExpandedChange={setMiniMapExpanded}
          onNavigate={handleMiniMapNavigation}
        />
      ) : null}

      <div className="control-deck">
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
                  'no-selection'
                }
                selectedLabel={
                  selectedCity?.name.zh ??
                  selectedCountry?.name.zh ??
                  selectedWaterbody?.name.zh ??
                  selectedLinearFeature?.name.zh ??
                  selectedMountainRange?.name.zh ??
                  selectedDesert?.name.zh
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
              onClick={() => setSearchOpen((open) => !open)}
            />
          </nav>
        </div>
      </div>

      {selectedCountry ? (
        <CountryDetailPanel
          key={selectedCountry.code}
          country={selectedCountry}
          cities={visibleCountryCities}
          selectedCity={selectedCity}
          onSelectCity={navigateToCity}
          onBackToCountry={() => setSelectedCityId(null)}
          onClose={clearSelection}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedWaterbody ? (
        <WaterbodyDetailPanel
          key={selectedWaterbody.id}
          waterbody={selectedWaterbody}
          onClose={clearSelection}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedLinearFeature ? (
        <LinearGeoFeatureDetailPanel
          key={selectedLinearFeature.id}
          feature={selectedLinearFeature}
          onClose={clearSelection}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedMountainRange ? (
        <MountainRangeDetailPanel
          key={selectedMountainRange.id}
          range={selectedMountainRange}
          onClose={clearSelection}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
      {selectedDesert ? (
        <DesertDetailPanel
          key={selectedDesert.id}
          desert={selectedDesert}
          onClose={clearSelection}
          onSelectCountry={navigateToCountry}
        />
      ) : null}
    </main>
  )
}
