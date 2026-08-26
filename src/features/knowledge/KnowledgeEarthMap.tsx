import { useMemo, type KeyboardEvent, type MouseEvent } from 'react'

import { getCountry } from '../../data/countries'
import { geographyReferenceLines } from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLine,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import { loadCountryBoundaries } from '../../data/geometryResources'
import { useGeometryResource } from '../../shared/hooks/useGeometryResource'
import { classifyGeoPosition } from '../../shared/lib/geoClassification'
import type { GeoPosition } from '../../shared/types/geo'
import {
  getMapFeaturePath,
  invertMiniMapPoint,
  MINI_MAP_KEYBOARD_FAST_STEP,
  MINI_MAP_KEYBOARD_STEP,
  MINI_MAP_WIDTH,
  moveMiniMapCursor,
  projectGeoPosition,
} from '../explore/worldMiniMapUtils'

type KnowledgeEarthMapProps = {
  topicId: GeographyTopicId
  referenceLineId: ReferenceLineId | null
  position: GeoPosition
  onPositionChange: (position: GeoPosition) => void
  onSelectReferenceLine: (line: ReferenceLine) => void
}

const INITIAL_POSITION = getCountry('CN')!.center
const EARTH_MAP_VIEWBOX_TOP = 5
const EARTH_MAP_VIEWBOX_HEIGHT = 170
const EARTH_MAP_VIEWBOX_BOTTOM =
  EARTH_MAP_VIEWBOX_TOP + EARTH_MAP_VIEWBOX_HEIGHT

export function KnowledgeEarthMap({
  topicId,
  referenceLineId,
  position,
  onPositionChange,
  onSelectReferenceLine,
}: KnowledgeEarthMapProps) {
  const countryBoundaries = useGeometryResource(loadCountryBoundaries)
  const boundaryPaths = useMemo(
    () =>
      (countryBoundaries.data?.features ?? []).map((boundary) => ({
        code: boundary.properties.code,
        path: getMapFeaturePath(boundary),
      })),
    [countryBoundaries.data],
  )
  const landmassPaths = useMemo(
    () =>
      (countryBoundaries.data?.landmasses ?? []).map((landmass) => ({
        id: landmass.properties.id,
        path: getMapFeaturePath(landmass),
      })),
    [countryBoundaries.data],
  )
  const marker = projectGeoPosition(position)!
  const classification = classifyGeoPosition(position)

  const handleMapClick = (event: MouseEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) {
      const element = event.target as SVGElement
      if (element.closest('[data-reference-line-id]')) return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const nextPosition = invertMiniMapPoint(
      ((event.clientX - rect.left) / rect.width) * MINI_MAP_WIDTH,
      EARTH_MAP_VIEWBOX_TOP +
        ((event.clientY - rect.top) / rect.height) * EARTH_MAP_VIEWBOX_HEIGHT,
    )
    if (nextPosition) onPositionChange(nextPosition)
  }

  const handleMapKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return
    const step = event.shiftKey
      ? MINI_MAP_KEYBOARD_FAST_STEP
      : MINI_MAP_KEYBOARD_STEP
    let nextPosition: GeoPosition | null = null

    if (event.key === 'ArrowUp') {
      nextPosition = moveMiniMapCursor(position, step, 0)
    } else if (event.key === 'ArrowDown') {
      nextPosition = moveMiniMapCursor(position, -step, 0)
    } else if (event.key === 'ArrowLeft') {
      nextPosition = moveMiniMapCursor(position, 0, -step)
    } else if (event.key === 'ArrowRight') {
      nextPosition = moveMiniMapCursor(position, 0, step)
    } else if (event.key === 'Home') {
      nextPosition = INITIAL_POSITION
    }

    if (nextPosition) {
      event.preventDefault()
      onPositionChange(nextPosition)
    }
  }

  return (
    <section
      className="knowledge-earth-map-card knowledge-map-card"
      aria-label="地球定位互动图"
    >
      <header className="knowledge-earth-map-heading">
        <div>
          <span>当前定位</span>
          <strong>{classification.formattedCoordinate}</strong>
        </div>
        <div
          className="knowledge-earth-classifications"
          aria-label="当前位置判读"
        >
          <span>{classification.latitudeHemisphere}</span>
          <span>{classification.longitudeHemisphere}</span>
          <span>{classification.latitudeZone}</span>
          <span>{classification.earthZone}</span>
        </div>
      </header>

      <svg
        className="knowledge-earth-map"
        data-testid="knowledge-earth-map"
        viewBox={`0 ${EARTH_MAP_VIEWBOX_TOP} ${MINI_MAP_WIDTH} ${EARTH_MAP_VIEWBOX_HEIGHT}`}
        role="application"
        aria-label="世界经纬定位图。点击地图移动定位点；使用方向键移动5度，按住Shift移动15度，Home返回中国。"
        tabIndex={0}
        onClick={handleMapClick}
        onKeyDown={handleMapKeyDown}
      >
        <rect
          className="knowledge-earth-map-ocean"
          y={EARTH_MAP_VIEWBOX_TOP}
          width={MINI_MAP_WIDTH}
          height={EARTH_MAP_VIEWBOX_HEIGHT}
          fill="#0b242b"
        />
        <g className="knowledge-earth-map-grid" aria-hidden="true">
          {[60, 120, 180, 240, 300].map((x) => (
            <line
              key={`x-${x}`}
              x1={x}
              x2={x}
              y1={EARTH_MAP_VIEWBOX_TOP}
              y2={EARTH_MAP_VIEWBOX_BOTTOM}
              stroke="rgb(139 170 176 / 14%)"
              strokeWidth="0.45"
            />
          ))}
          {[30, 60, 90, 120, 150].map((y) => (
            <line
              key={`y-${y}`}
              x1={0}
              x2={360}
              y1={y}
              y2={y}
              stroke="rgb(139 170 176 / 14%)"
              strokeWidth="0.45"
            />
          ))}
        </g>
        <g className="knowledge-earth-map-landmasses" aria-hidden="true">
          {landmassPaths.map(({ id, path }) => (
            <path
              key={id}
              data-landmass-id={id}
              d={path}
              fill="rgb(59 91 96 / 72%)"
              stroke="rgb(151 183 187 / 34%)"
              strokeWidth="0.32"
            />
          ))}
        </g>
        <g className="knowledge-earth-map-countries" aria-hidden="true">
          {boundaryPaths.map(({ code, path }) => (
            <path
              key={code}
              data-country-code={code}
              d={path}
              fill="rgb(59 91 96 / 72%)"
              stroke="rgb(151 183 187 / 34%)"
              strokeWidth="0.32"
            />
          ))}
        </g>
        <g className="knowledge-earth-map-reference-lines">
          {geographyReferenceLines.map((line) => {
            const point = projectGeoPosition(
              line.orientation === 'latitude'
                ? { latitude: line.coordinate, longitude: 0 }
                : { latitude: 0, longitude: line.coordinate },
            )!
            const inTopic = line.topicId === topicId
            const selected = line.id === referenceLineId
            const lineProps =
              line.orientation === 'latitude'
                ? { x1: 0, x2: MINI_MAP_WIDTH, y1: point.y, y2: point.y }
                : {
                    x1: point.x,
                    x2: point.x,
                    y1: EARTH_MAP_VIEWBOX_TOP,
                    y2: EARTH_MAP_VIEWBOX_BOTTOM,
                  }

            return (
              <g
                key={line.id}
                className={
                  selected
                    ? 'is-selected'
                    : inTopic
                      ? 'is-topic-line'
                      : undefined
                }
                data-reference-line-id={line.id}
                data-reference-line-category={line.category}
                style={{
                  color: selected
                    ? 'var(--atlas-focus)'
                    : inTopic
                      ? 'rgb(121 200 212 / 68%)'
                      : 'rgb(139 171 183 / 26%)',
                }}
                role="button"
                aria-label={`选择${line.name.zh}，${line.shortLabel}`}
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectReferenceLine(line)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectReferenceLine(line)
                }}
              >
                <line
                  className="knowledge-earth-reference-visible"
                  {...lineProps}
                  stroke="currentColor"
                  strokeWidth={selected ? 1.7 : 0.8}
                />
                <line
                  className="knowledge-earth-reference-hit"
                  {...lineProps}
                  stroke="transparent"
                  strokeWidth="10"
                />
                <title>{line.shortLabel}</title>
              </g>
            )
          })}
        </g>
        <g
          className="knowledge-earth-map-marker"
          transform={`translate(${marker.x} ${marker.y})`}
          color="var(--atlas-focus)"
          aria-hidden="true"
        >
          <circle
            r="4.5"
            fill="var(--atlas-canvas-deep)"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <line x1="-8" x2="8" stroke="currentColor" />
          <line y1="-8" y2="8" stroke="currentColor" />
        </g>
      </svg>

      {countryBoundaries.status === 'loading' ? (
        <output className="geometry-resource-status" role="status">
          正在绘制世界轮廓…
        </output>
      ) : countryBoundaries.status === 'error' ? (
        <div className="geometry-resource-status" role="alert">
          <span>世界轮廓加载失败</span>
          <button type="button" onClick={countryBoundaries.retry}>
            重新加载
          </button>
        </div>
      ) : null}
    </section>
  )
}
