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
  onExpandedChange: (expanded: boolean) => void
  onNavigate: (navigation: WorldMiniMapNavigation) => void
}

export type WorldMiniMapHandle = {
  setViewCenter: (position: GeoPosition) => void
}

const INITIAL_VIEW_CENTER = getCountry('CN')!.center

export const WorldMiniMap = forwardRef<WorldMiniMapHandle, WorldMiniMapProps>(
  function WorldMiniMap(
    { expanded, selectedCountryCode, onExpandedChange, onNavigate },
    ref,
  ) {
    const viewCenterRef = useRef<GeoPosition>(INITIAL_VIEW_CENTER)
    const viewMarkerRef = useRef<SVGGElement>(null)
    const coordinateLabelRef = useRef<HTMLOutputElement>(null)
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
        const countryCode = knownCountryCode ?? findCountryAtPosition(position)
        if (countryCode) {
          onNavigate({ kind: 'country', countryCode })
          return
        }
        onNavigate({ kind: 'coordinate', position })
      },
      [onNavigate],
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
              {formatGeoPosition(INITIAL_VIEW_CENTER)}
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
            aria-label="平面世界地图。点击国家或海洋进行定位；键盘方向键移动光标，Enter 定位，Home 返回当前视角。"
            tabIndex={0}
            onClick={handleMapClick}
            onKeyDown={handleMapKeyDown}
          >
            <rect
              className="world-mini-map-ocean"
              width={MINI_MAP_WIDTH}
              height={MINI_MAP_HEIGHT}
            />
            <g aria-hidden="true" className="world-mini-map-grid">
              {[60, 120, 180, 240, 300].map((x) => (
                <line key={`x-${x}`} x1={x} x2={x} y1={0} y2={180} />
              ))}
              {[30, 60, 90, 120, 150].map((y) => (
                <line key={`y-${y}`} x1={0} x2={360} y1={y} y2={y} />
              ))}
            </g>
            <g className="world-mini-map-countries">
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
            <g
              ref={viewMarkerRef}
              className="world-mini-map-view-marker"
              data-testid="world-mini-map-view-marker"
              transform={(() => {
                const point = projectGeoPosition(INITIAL_VIEW_CENTER)!
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
          </svg>

          <p className="sr-only">
            方向键每次移动 5 度；按住 Shift 每次移动 15 度；Enter
            或空格定位；Home 返回当前 3D 视角。
          </p>
        </div>
      </aside>
    )
  },
)
