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
  resolveProximityCountryCode,
} from '../../scene/countrySceneInteraction'
import { CountryDetailPanel } from './CountryDetailPanel'
import { CountrySearch } from './CountrySearch'
import { useExperienceStore } from './useExperienceStore'
import { WorldMiniMap, type WorldMiniMapHandle } from './WorldMiniMap'
import { findCountryAtPosition } from './worldMiniMapUtils'

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
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null)
  const [proximityCountryCode, setProximityCountryCode] = useState<
    string | null
  >(null)
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
  const visibleCityCountryCode = selectedCountryCode ?? proximityCountryCode
  const visibleCountryCities = getCitiesForCountry(selectedCountryCode)
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
      setProximityCountryCode(null)
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
      setProximityCountryCode(null)
      selectCountry(city.countryCode)
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
  }, [selectCountry])
  const handleMiniMapNavigation = useCallback(
    (navigation: WorldMiniMapNavigation) => {
      if (navigation.kind === 'country') {
        navigateToCountry(navigation.countryCode)
        return
      }

      clearSelection()
      setProximityCountryCode(null)
      requestCameraTarget(navigation.position)
    },
    [clearSelection, navigateToCountry, requestCameraTarget],
  )
  const handleViewCenterChange = useCallback((view: GlobeView) => {
    miniMapRef.current?.setViewCenter(view.position)
  }, [])
  const handleViewCenterCommit = useCallback(
    (view: GlobeView) => {
      miniMapRef.current?.setViewCenter(view.position)
      if (selectedCountryCode) {
        setProximityCountryCode(null)
        return
      }
      const centerCountryCode = findCountryAtPosition(view.position)
      setProximityCountryCode((previousCountryCode) =>
        resolveProximityCountryCode(
          previousCountryCode,
          centerCountryCode,
          view.distance,
        ),
      )
    },
    [selectedCountryCode],
  )

  const effectiveAutoRotate =
    autoRotate &&
    !reducedMotion &&
    selectedCountryCode === null &&
    hoveredCountryCode === null &&
    hoveredCityId === null

  return (
    <main
      className={
        selectedCountry ? 'explore-shell has-country-detail' : 'explore-shell'
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
            visibleCityCountryCode={visibleCityCountryCode}
            selectedCountryCode={selectedCountryCode}
            selectedCityId={selectedCityId}
            hoveredCountryCode={hoveredCountryCode}
            hoveredCityId={hoveredCityId}
            onSelectCountry={navigateToCountry}
            onSelectCity={navigateToCity}
            onHoverCountry={hoverCountry}
            onHoverCity={setHoveredCityId}
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
              aria-label="搜索国家"
            >
              <CountrySearch
                key={selectedCountry?.code ?? 'no-selection'}
                selectedCountry={selectedCountry}
                onSelect={navigateToCountry}
                onClearSelection={clearSelection}
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
              label="搜索国家"
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
    </main>
  )
}
