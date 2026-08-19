import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import { countryBoundaries, getCountry } from '../../data/countries'
import { geographyReferenceLines } from '../../data/geographyLearning'
import type { ClimateTypeId } from '../../data/climateLearningSchema'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import { classifyGeoPosition } from '../../shared/lib/geoClassification'
import type {
  GeoPosition,
  WorldMiniMapNavigation,
} from '../../shared/types/geo'
import {
  findCountryAtPosition,
  formatGeoPosition,
  getBoundaryPath,
  invertMiniMapPoint,
  MICROSTATE_HIT_RADIUS,
  MINI_MAP_HEIGHT,
  MINI_MAP_KEYBOARD_FAST_STEP,
  MINI_MAP_KEYBOARD_STEP,
  MINI_MAP_WIDTH,
  microstateCountries,
  moveMiniMapCursor,
  projectGeoPosition,
} from './worldMiniMapUtils'

type WorldMiniMapProps = {
  expanded: boolean
  selectedCountryCode: string | null
  showGeographyLearningLayer: boolean
  showClimateLayer: boolean
  selectedClimateTypeId: ClimateTypeId | null
  climateRasterUrl: string
  climateBoundaryRasterUrl: string | null
  selectedClimatePosition: GeoPosition | null
  onSelectGeographyTopic: (
    topicId: GeographyTopicId,
    referenceLineId?: ReferenceLineId | null,
  ) => void
  onExpandedChange: (expanded: boolean) => void
  onNavigate: (navigation: WorldMiniMapNavigation) => void
  onSelectClimatePosition: (position: GeoPosition) => void
}

export type WorldMiniMapHandle = {
  setViewCenter: (position: GeoPosition) => void
}

const INITIAL_VIEW_CENTER = getCountry('CN')!.center

export const WorldMiniMap = forwardRef<WorldMiniMapHandle, WorldMiniMapProps>(
  function WorldMiniMap(
    {
      expanded,
      selectedCountryCode,
      showGeographyLearningLayer,
      showClimateLayer,
      selectedClimateTypeId,
      climateRasterUrl,
      climateBoundaryRasterUrl,
      selectedClimatePosition,
      onSelectGeographyTopic,
      onExpandedChange,
      onNavigate,
      onSelectClimatePosition,
    },
    ref,
  ) {
    const viewCenterRef = useRef<GeoPosition>(INITIAL_VIEW_CENTER)
    const viewMarkerRef = useRef<SVGGElement>(null)
    const coordinateLabelRef = useRef<HTMLOutputElement>(null)
    const interpretationRef = useRef<HTMLOutputElement>(null)
    const [keyboardCursor, setKeyboardCursor] =
      useState<GeoPosition>(INITIAL_VIEW_CENTER)
    const boundaryPaths = useMemo(
      () =>
        countryBoundaries.features.map((boundary) => ({
          code: boundary.properties.code,
          path: getBoundaryPath(boundary),
        })),
      [],
    )
    const microstateMarkers = useMemo(
      () =>
        microstateCountries.flatMap((country) => {
          const point = projectGeoPosition(country.center)
          return point ? [{ country, point }] : []
        }),
      [],
    )
    const keyboardCursorPoint = projectGeoPosition(keyboardCursor)
    const selectedClimatePoint = selectedClimatePosition
      ? projectGeoPosition(selectedClimatePosition)
      : null

    const updateViewCenter = useCallback((position: GeoPosition) => {
      viewCenterRef.current = position
      const point = projectGeoPosition(position)
      if (point && viewMarkerRef.current) {
        viewMarkerRef.current.setAttribute(
          'transform',
          `translate(${point.x} ${point.y})`,
        )
      }
      if (coordinateLabelRef.current) {
        coordinateLabelRef.current.value = formatGeoPosition(position)
      }
      if (interpretationRef.current) {
        const classification = classifyGeoPosition(position)
        interpretationRef.current.value = [
          classification.latitudeHemisphere,
          classification.longitudeHemisphere,
          classification.latitudeZone,
          classification.earthZone,
        ].join(' · ')
      }
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        setViewCenter: updateViewCenter,
      }),
      [updateViewCenter],
    )

    const navigateAtPosition = useCallback(
      (position: GeoPosition, knownCountryCode?: string | null) => {
        if (showClimateLayer) {
          onSelectClimatePosition(position)
          return
        }
        const countryCode = knownCountryCode ?? findCountryAtPosition(position)
        if (countryCode) {
          onNavigate({ kind: 'country', countryCode })
          return
        }
        onNavigate({ kind: 'coordinate', position })
      },
      [onNavigate, onSelectClimatePosition, showClimateLayer],
    )

    const handleMapClick = (event: MouseEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const position = invertMiniMapPoint(
        ((event.clientX - rect.left) / rect.width) * MINI_MAP_WIDTH,
        ((event.clientY - rect.top) / rect.height) * MINI_MAP_HEIGHT,
      )
      if (!position) return
      const target = event.target as SVGElement
      const countryCode = target.closest<SVGElement>('[data-country-code]')
        ?.dataset.countryCode
      navigateAtPosition(position, countryCode)
    }

    const handleMapKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
      const step = event.shiftKey
        ? MINI_MAP_KEYBOARD_FAST_STEP
        : MINI_MAP_KEYBOARD_STEP
      let nextPosition: GeoPosition | null = null
      if (event.key === 'ArrowUp') {
        nextPosition = moveMiniMapCursor(keyboardCursor, step, 0)
      } else if (event.key === 'ArrowDown') {
        nextPosition = moveMiniMapCursor(keyboardCursor, -step, 0)
      } else if (event.key === 'ArrowLeft') {
        nextPosition = moveMiniMapCursor(keyboardCursor, 0, -step)
      } else if (event.key === 'ArrowRight') {
        nextPosition = moveMiniMapCursor(keyboardCursor, 0, step)
      } else if (event.key === 'Home') {
        nextPosition = viewCenterRef.current
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        navigateAtPosition(keyboardCursor)
        return
      } else if (event.key === 'Escape' && expanded) {
        event.preventDefault()
        onExpandedChange(false)
        return
      }

      if (nextPosition) {
        event.preventDefault()
        setKeyboardCursor(nextPosition)
      }
    }

    const currentClassification = classifyGeoPosition(viewCenterRef.current)

    return (
      <aside
        className={expanded ? 'world-mini-map is-expanded' : 'world-mini-map'}
        aria-label="2D 世界定位图"
      >
        <button
          className="world-mini-map-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="world-mini-map-card"
          onClick={() => onExpandedChange(!expanded)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3.5 6.5 5-2 7 2 5-2v13l-5 2-7-2-5 2z" />
            <path d="M8.5 4.5v13M15.5 6.5v13" />
          </svg>
          <span>定位图</span>
        </button>

        <div id="world-mini-map-card" className="world-mini-map-card">
          <header className="world-mini-map-header">
            <div>
              <span>WORLD POSITION</span>
            </div>
            <output ref={coordinateLabelRef} aria-live="off">
              {formatGeoPosition(viewCenterRef.current)}
            </output>
            <button
              className="world-mini-map-close"
              type="button"
              aria-label="收起世界定位图"
              onClick={() => onExpandedChange(false)}
            >
              ×
            </button>
          </header>

          <svg
            className="world-mini-map-canvas"
            data-testid="world-mini-map"
            viewBox={`0 0 ${MINI_MAP_WIDTH} ${MINI_MAP_HEIGHT}`}
            role="application"
            aria-label={
              showClimateLayer
                ? '平面世界气候图。点击任意位置判读气候；键盘方向键移动光标，Enter 判读，Home 返回当前视角。'
                : '平面世界地图。点击国家或海洋进行定位；键盘方向键移动光标，Enter 定位，Home 返回当前视角。'
            }
            tabIndex={0}
            onClick={handleMapClick}
            onKeyDown={handleMapKeyDown}
          >
            <rect
              className="world-mini-map-ocean"
              width={MINI_MAP_WIDTH}
              height={MINI_MAP_HEIGHT}
            />
            {showClimateLayer ? (
              <>
                <image
                  className="world-mini-map-climate"
                  data-testid="world-mini-map-climate"
                  data-climate-highlight-id={selectedClimateTypeId ?? undefined}
                  href={climateRasterUrl}
                  width={MINI_MAP_WIDTH}
                  height={MINI_MAP_HEIGHT}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                />
                {climateBoundaryRasterUrl ? (
                  <image
                    className="world-mini-map-climate-boundary"
                    data-testid="world-mini-map-climate-boundary"
                    data-climate-highlight-id={
                      selectedClimateTypeId ?? undefined
                    }
                    href={climateBoundaryRasterUrl}
                    width={MINI_MAP_WIDTH}
                    height={MINI_MAP_HEIGHT}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  />
                ) : null}
              </>
            ) : null}
            <g aria-hidden="true" className="world-mini-map-grid">
              {[60, 120, 180, 240, 300].map((x) => (
                <line key={`x-${x}`} x1={x} x2={x} y1={0} y2={180} />
              ))}
              {[30, 60, 90, 120, 150].map((y) => (
                <line key={`y-${y}`} x1={0} x2={360} y1={y} y2={y} />
              ))}
            </g>
            {showGeographyLearningLayer ? (
              <g className="world-mini-map-geography-layer">
                {geographyReferenceLines.map((line) => {
                  const position = projectGeoPosition(
                    line.orientation === 'latitude'
                      ? { latitude: line.coordinate, longitude: 0 }
                      : { latitude: 0, longitude: line.coordinate },
                  )
                  if (!position) return null
                  return line.orientation === 'latitude' ? (
                    <line
                      key={line.id}
                      data-reference-line-id={line.id}
                      data-reference-line-category={line.category}
                      x1={0}
                      x2={MINI_MAP_WIDTH}
                      y1={position.y}
                      y2={position.y}
                    />
                  ) : (
                    <line
                      key={line.id}
                      data-reference-line-id={line.id}
                      data-reference-line-category={line.category}
                      x1={position.x}
                      x2={position.x}
                      y1={0}
                      y2={MINI_MAP_HEIGHT}
                    />
                  )
                })}
                <g className="world-mini-map-degree-labels" aria-hidden="true">
                  {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(
                    (longitude) => {
                      const point = projectGeoPosition({
                        latitude: 0,
                        longitude,
                      })!
                      return (
                        <text key={longitude} x={point.x} y={176}>
                          {longitude === 0
                            ? '0°'
                            : `${Math.abs(longitude)}°${longitude > 0 ? 'E' : 'W'}`}
                        </text>
                      )
                    },
                  )}
                  {[-60, -30, 30, 60].map((latitude) => {
                    const point = projectGeoPosition({
                      latitude,
                      longitude: 0,
                    })!
                    return (
                      <text key={latitude} x={4} y={point.y - 2}>
                        {Math.abs(latitude)}°{latitude > 0 ? 'N' : 'S'}
                      </text>
                    )
                  })}
                </g>
              </g>
            ) : null}
            <g
              className={
                showClimateLayer
                  ? 'world-mini-map-countries is-climate-visible'
                  : 'world-mini-map-countries'
              }
            >
              {boundaryPaths.map(({ code, path }) => {
                const country = getCountry(code)
                return (
                  <path
                    key={code}
                    data-country-code={code}
                    className={
                      code === selectedCountryCode ? 'is-selected' : undefined
                    }
                    d={path}
                  >
                    <title>{country?.name.zh ?? code}</title>
                  </path>
                )
              })}
            </g>
            <g className="world-mini-map-microstates">
              {microstateMarkers.map(({ country, point }) => (
                <circle
                  key={country.code}
                  data-country-code={country.code}
                  className={
                    country.code === selectedCountryCode
                      ? 'is-selected'
                      : undefined
                  }
                  cx={point.x}
                  cy={point.y}
                  r={MICROSTATE_HIT_RADIUS}
                >
                  <title>{country.name.zh}</title>
                </circle>
              ))}
            </g>
            {showGeographyLearningLayer ? (
              <g className="world-mini-map-reference-labels">
                {geographyReferenceLines
                  .filter(
                    (line) =>
                      line.category !== 'latitude-zone-boundary' &&
                      line.id !== 'antimeridian',
                  )
                  .map((line) => {
                    const point = projectGeoPosition(line.anchorPosition)
                    if (!point) return null
                    return (
                      <text
                        key={line.id}
                        data-reference-line-label={line.id}
                        x={point.x}
                        y={point.y}
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectGeographyTopic(line.topicId, line.id)
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          event.stopPropagation()
                          onSelectGeographyTopic(line.topicId, line.id)
                        }}
                      >
                        {line.shortLabel}
                      </text>
                    )
                  })}
              </g>
            ) : null}
            <g
              ref={viewMarkerRef}
              className="world-mini-map-view-marker"
              data-testid="world-mini-map-view-marker"
              transform={(() => {
                const point = projectGeoPosition(viewCenterRef.current)!
                return `translate(${point.x} ${point.y})`
              })()}
              aria-hidden="true"
            >
              <circle r="4.2" />
              <path d="M-8 0H-3M3 0H8M0-8V-3M0 3V8" />
            </g>
            {keyboardCursorPoint ? (
              <circle
                className="world-mini-map-keyboard-cursor"
                cx={keyboardCursorPoint.x}
                cy={keyboardCursorPoint.y}
                r="5.5"
                aria-hidden="true"
              />
            ) : null}
            {selectedClimatePoint ? (
              <g
                className="world-mini-map-climate-marker"
                data-testid="world-mini-map-climate-marker"
                transform={`translate(${selectedClimatePoint.x} ${selectedClimatePoint.y})`}
                aria-hidden="true"
              >
                <circle r="4.5" />
                <path d="M0-10 3-4 0-1-3-4Z" />
              </g>
            ) : null}
          </svg>

          {showGeographyLearningLayer ? (
            <output
              ref={interpretationRef}
              className="world-mini-map-interpretation"
              aria-label="2D定位图当前中心判读"
              aria-live="off"
            >
              {[
                currentClassification.latitudeHemisphere,
                currentClassification.longitudeHemisphere,
                currentClassification.latitudeZone,
                currentClassification.earthZone,
              ].join(' · ')}
            </output>
          ) : null}

          <p className="sr-only">
            方向键每次移动 5 度；按住 Shift 每次移动 15 度；Enter
            或空格定位；Home 返回当前 3D 视角。
          </p>
        </div>
      </aside>
    )
  },
)
