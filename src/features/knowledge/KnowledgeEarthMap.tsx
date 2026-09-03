import type { CSSProperties } from 'react'

import { geographyReferenceLines } from '../../data/geographyLearning'
import type { GeographyTopicId } from '../../data/geographyLearningSchema'
import { WorldMapResourceStatus } from '../../shared/maps/WorldMapResourceStatus'
import { activateSvgControlOnKeyboard } from '../../shared/maps/svgMapInteraction'
import { useWorldBoundaryPaths } from '../../shared/maps/useWorldBoundaryPaths'
import {
  getMapFeaturePath,
  MINI_MAP_WIDTH,
  projectGeoPosition,
} from '../explore/worldMiniMapUtils'
import {
  getKnowledgeEarthCoverageRegions,
  getKnowledgeEarthTopicLineColors,
} from './knowledgeEarthLinePresentation'

type KnowledgeEarthMapProps = {
  topicId: GeographyTopicId
  onSelectTopic?: (topicId: GeographyTopicId) => void
  workbench?: boolean
  compact?: boolean
}

const EARTH_MAP_VIEWBOX_TOP = 5
const EARTH_MAP_VIEWBOX_HEIGHT = 170
const EARTH_MAP_VIEWBOX_BOTTOM =
  EARTH_MAP_VIEWBOX_TOP + EARTH_MAP_VIEWBOX_HEIGHT
const EARTH_MAP_LABEL_INSET = 8

function getReferenceLineLabelPosition(anchorPosition: {
  latitude: number
  longitude: number
}) {
  const point = projectGeoPosition(anchorPosition)!
  const x = Math.min(
    MINI_MAP_WIDTH - EARTH_MAP_LABEL_INSET,
    Math.max(EARTH_MAP_LABEL_INSET, point.x),
  )
  const y = Math.min(
    EARTH_MAP_VIEWBOX_BOTTOM - EARTH_MAP_LABEL_INSET,
    Math.max(EARTH_MAP_VIEWBOX_TOP + EARTH_MAP_LABEL_INSET, point.y - 3),
  )
  const textAnchor: 'start' | 'middle' | 'end' =
    point.x >= MINI_MAP_WIDTH - 28 ? 'end' : point.x <= 28 ? 'start' : 'middle'

  return { x, y, textAnchor }
}

function getCoverageAreaRect(area: {
  west: number
  east: number
  south: number
  north: number
}) {
  const topLeft = projectGeoPosition({
    latitude: area.north,
    longitude: area.west,
  })!
  const bottomRight = projectGeoPosition({
    latitude: area.south,
    longitude: area.east,
  })!
  const x = Math.min(topLeft.x, bottomRight.x)
  const right = Math.max(topLeft.x, bottomRight.x)
  const y = Math.max(EARTH_MAP_VIEWBOX_TOP, Math.min(topLeft.y, bottomRight.y))
  const bottom = Math.min(
    EARTH_MAP_VIEWBOX_BOTTOM,
    Math.max(topLeft.y, bottomRight.y),
  )

  return { x, y, width: right - x, height: bottom - y }
}

export function KnowledgeEarthMap({
  topicId,
  onSelectTopic,
}: KnowledgeEarthMapProps) {
  const {
    resource: countryBoundaries,
    countryPaths: boundaryPaths,
    landmassPaths,
  } = useWorldBoundaryPaths(getMapFeaturePath)
  const topicLineColors = getKnowledgeEarthTopicLineColors(topicId)
  const coverageRegions = getKnowledgeEarthCoverageRegions(topicId)
  return (
    <section
      className="knowledge-earth-map-card knowledge-map-card"
      aria-label="地球重要经纬线用途图"
    >
      <svg
        className="knowledge-earth-map"
        data-testid="knowledge-earth-map"
        viewBox={`0 ${EARTH_MAP_VIEWBOX_TOP} ${MINI_MAP_WIDTH} ${EARTH_MAP_VIEWBOX_HEIGHT}`}
        aria-label="世界重要经纬线分组图"
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
        <g
          className="knowledge-earth-map-coverage"
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        >
          {coverageRegions.map((region) => (
            <g
              key={region.id}
              data-coverage-region-id={region.id}
              data-coverage-label={region.label}
              style={{ color: region.color }}
            >
              {region.areas.map((area, index) => {
                const rect = getCoverageAreaRect(area)
                const labelPoint = area.labelPosition
                  ? projectGeoPosition(area.labelPosition)
                  : null

                return (
                  <g key={`${region.id}-${index}`}>
                    <rect
                      className="knowledge-earth-coverage-area"
                      data-coverage-area-index={index}
                      {...rect}
                      fill="currentColor"
                      fillOpacity="0.12"
                    />
                    {labelPoint ? (
                      <text
                        className="knowledge-earth-coverage-label"
                        x={labelPoint.x}
                        y={labelPoint.y}
                        textAnchor="middle"
                        fill="currentColor"
                        stroke="var(--atlas-canvas-deep)"
                        strokeWidth="3"
                        fontSize="8"
                        fontWeight="700"
                        style={{ paintOrder: 'stroke' }}
                      >
                        {region.label}
                      </text>
                    ) : null}
                  </g>
                )
              })}
            </g>
          ))}
        </g>
        <g className="knowledge-earth-map-reference-lines">
          {geographyReferenceLines.map((line) => {
            const point = projectGeoPosition(
              line.orientation === 'latitude'
                ? { latitude: line.coordinate, longitude: 0 }
                : { latitude: 0, longitude: line.coordinate },
            )!
            const lineColor = topicLineColors.get(line.id)
            const inTopic = Boolean(lineColor)
            const labelPosition = getReferenceLineLabelPosition(
              line.anchorPosition,
            )
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
                className={inTopic ? 'is-topic-line' : 'is-background-line'}
                data-reference-line-id={line.id}
                data-reference-line-topic-id={line.topicId}
                data-reference-line-category={line.category}
                style={
                  {
                    '--knowledge-earth-line-color': lineColor,
                    color: lineColor ?? 'rgb(139 171 183 / 24%)',
                  } as CSSProperties
                }
                role={onSelectTopic ? 'button' : undefined}
                aria-label={
                  onSelectTopic
                    ? `切换到${line.topicId === topicId ? '当前' : ''}${line.name.zh}所属用途`
                    : undefined
                }
                tabIndex={onSelectTopic ? 0 : undefined}
                onClick={
                  onSelectTopic ? () => onSelectTopic(line.topicId) : undefined
                }
                onKeyDown={
                  onSelectTopic
                    ? (event) => {
                        activateSvgControlOnKeyboard(event, () =>
                          onSelectTopic(line.topicId),
                        )
                      }
                    : undefined
                }
              >
                <line
                  className="knowledge-earth-reference-visible"
                  {...lineProps}
                  stroke="currentColor"
                  strokeWidth={inTopic ? 1.8 : 0.8}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  className="knowledge-earth-reference-hit"
                  {...lineProps}
                  stroke="transparent"
                  strokeWidth="10"
                />
                {inTopic ? (
                  <text
                    className="knowledge-earth-reference-label"
                    x={labelPosition.x}
                    y={labelPosition.y}
                    textAnchor={labelPosition.textAnchor}
                    fill="currentColor"
                    stroke="var(--atlas-canvas-deep)"
                    strokeWidth="3"
                    fontSize="7"
                    fontWeight="700"
                    style={{ paintOrder: 'stroke', pointerEvents: 'none' }}
                  >
                    {line.name.zh}
                  </text>
                ) : null}
                <title>{line.shortLabel}</title>
              </g>
            )
          })}
        </g>
      </svg>

      <WorldMapResourceStatus
        loading={countryBoundaries.status === 'loading'}
        failed={countryBoundaries.status === 'error'}
        loadingText="正在绘制世界轮廓…"
        errorText="世界轮廓加载失败"
        onRetry={countryBoundaries.retry}
      />
    </section>
  )
}
