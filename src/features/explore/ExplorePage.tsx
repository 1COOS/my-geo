import { useReducedMotion } from 'motion/react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { getCountry } from '../../data/countries'
import { ControlButton } from '../../shared/components/ControlButton'
import { WebGLFallback } from '../../shared/components/WebGLFallback'
import { supportsWebGL } from '../../shared/lib/webgl'
import type {
  CameraTarget,
  GeoPosition,
  WorldMiniMapNavigation,
} from '../../shared/types/geo'
import { CountryDetailPanel } from './CountryDetailPanel'
import { CountrySearch } from './CountrySearch'
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
  const reducedMotion = useReducedMotion() ?? false
  const cameraRequestIdRef = useRef(0)
  const miniMapRef = useRef<WorldMiniMapHandle>(null)
  const [miniMapExpanded, setMiniMapExpanded] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(() => ({
    requestId: 0,
    position: getCountry('CN')!.center,
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

  const selectedCountry = getCountry(selectedCountryCode)
  const requestCameraTarget = useCallback((position: GeoPosition) => {
    cameraRequestIdRef.current += 1
    setCameraTarget({
      requestId: cameraRequestIdRef.current,
      position,
    })
  }, [])
  const navigateToCountry = useCallback(
    (countryCode: string) => {
      const country = getCountry(countryCode)
      if (!country) return
      setMiniMapExpanded(false)
      selectCountry(countryCode)
      requestCameraTarget(country.center)
    },
    [requestCameraTarget, selectCountry],
  )
  const handleMiniMapNavigation = useCallback(
    (navigation: WorldMiniMapNavigation) => {
      if (navigation.kind === 'country') {
        navigateToCountry(navigation.countryCode)
        return
      }

      selectCountry(null)
      requestCameraTarget(navigation.position)
    },
    [navigateToCountry, requestCameraTarget, selectCountry],
  )
  const handleViewCenterChange = useCallback((position: GeoPosition) => {
    miniMapRef.current?.setViewCenter(position)
  }, [])

  const effectiveAutoRotate =
    autoRotate &&
    !reducedMotion &&
    selectedCountryCode === null &&
    hoveredCountryCode === null

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
            selectedCountryCode={selectedCountryCode}
            hoveredCountryCode={hoveredCountryCode}
            onSelectCountry={navigateToCountry}
            onHoverCountry={hoverCountry}
            onViewCenterChange={handleViewCenterChange}
            onViewCenterCommit={handleViewCenterChange}
          />
        </Suspense>
      ) : (
        <div className="fallback-stage">
          <WebGLFallback />
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="/" aria-label="My Geo 首页">
          <img src="/icons/my-geo.svg" alt="" />
          <span>{t('brand')}</span>
        </a>
        <div className="status-pill">
          <span aria-hidden="true" />
          {t('status')}
        </div>
      </header>

      <div className="search-slot">
        <CountrySearch
          key={selectedCountry?.code ?? 'no-selection'}
          selectedCountry={selectedCountry}
          onSelect={navigateToCountry}
          onClearSelection={() => selectCountry(null)}
        />
      </div>

      {webGLAvailable ? (
        <WorldMiniMap
          ref={miniMapRef}
          expanded={miniMapExpanded}
          selectedCountryCode={selectedCountryCode}
          onExpandedChange={setMiniMapExpanded}
          onNavigate={handleMiniMapNavigation}
        />
      ) : null}

      {webGLAvailable ? (
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
            label={t(quality === 'balanced' ? 'qualityBalanced' : 'qualityLow')}
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
      ) : null}

      {selectedCountry ? (
        <CountryDetailPanel
          key={selectedCountry.code}
          country={selectedCountry}
          onClose={() => selectCountry(null)}
          onSelectCountry={navigateToCountry}
        />
      ) : null}

      <footer className="footer-note">MY GEO · EARTH EXPLORATION LAB</footer>
    </main>
  )
}
