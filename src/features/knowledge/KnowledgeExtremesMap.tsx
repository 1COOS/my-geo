import { useMemo } from 'react'

import {
  loadDesertGeometries,
  loadLinearFeatureGeometries,
  loadMountainGeometries,
  loadWaterbodyGeometries,
} from '../../data/geometryResources'
import type { WorldExtremeEntry } from '../../data/worldExtremesSchema'
import { useGeometryResource } from '../../shared/hooks/useGeometryResource'
import { WorldMapResourceStatus } from '../../shared/maps/WorldMapResourceStatus'
import { activateSvgControlOnKeyboard } from '../../shared/maps/svgMapInteraction'
import { useWorldBoundaryPaths } from '../../shared/maps/useWorldBoundaryPaths'
import {
  getMapFeaturePath,
  getMicrostateCountries,
  MINI_MAP_HEIGHT,
  MINI_MAP_WIDTH,
  projectGeoPosition,
  worldMiniMapPath,
} from '../explore/worldMiniMapUtils'
import { getWorldExtremeRankColor } from './worldExtremePresentation'

type KnowledgeExtremesMapProps = {
  metricId: string
  metricName: string
  entries: readonly WorldExtremeEntry[]
  selectedEntryId?: string
  workbench?: boolean
  compact?: boolean
  onSelectEntry: (entry: WorldExtremeEntry) => void
}

export function KnowledgeExtremesMap({
  metricId,
  metricName,
  entries,
  selectedEntryId,
  workbench = false,
  compact = false,
  onSelectEntry,
}: KnowledgeExtremesMapProps) {
  const {
    resource: countryBoundaries,
    countryPaths: boundaryPaths,
    landmassPaths,
  } = useWorldBoundaryPaths(getMapFeaturePath)
  const needsWaterbody = entries.some(
    (entry) => entry.entity?.kind === 'waterbody',
  )
  const needsLinearFeature = entries.some(
    (entry) => entry.entity?.kind === 'linearFeature',
  )
  const needsMountain =
    metricId !== 'highest-peak' &&
    entries.some((entry) => entry.entity?.kind === 'mountainRange')
  const needsDesert = entries.some((entry) => entry.entity?.kind === 'desert')
  const waterbodyGeometries = useGeometryResource(
    loadWaterbodyGeometries,
    needsWaterbody,
  )
  const linearFeatureGeometries = useGeometryResource(
    loadLinearFeatureGeometries,
    needsLinearFeature,
  )
  const mountainGeometries = useGeometryResource(
    loadMountainGeometries,
    needsMountain,
  )
  const desertGeometries = useGeometryResource(
    loadDesertGeometries,
    needsDesert,
  )
  const countryEntryByCode = useMemo(
    () =>
      new Map(
        entries.flatMap((entry) =>
          entry.entity?.kind === 'country'
            ? [[entry.entity.id, entry] as const]
            : [],
        ),
      ),
    [entries],
  )
  const microstateCodes = useMemo(
    () =>
      new Set(
        countryBoundaries.data
          ? getMicrostateCountries(countryBoundaries.data).map(
              (country) => country.code,
            )
          : [],
      ),
    [countryBoundaries.data],
  )
  const markerEntries = useMemo(
    () =>
      selectedEntryId
        ? [
            ...entries.filter((entry) => entry.id !== selectedEntryId),
            ...entries.filter((entry) => entry.id === selectedEntryId),
          ]
        : entries,
    [entries, selectedEntryId],
  )
  const waterbodyGeometryById = useMemo(
    () =>
      new Map(
        (waterbodyGeometries.data ?? []).map((geometry) => [
          geometry.id,
          geometry,
        ]),
      ),
    [waterbodyGeometries.data],
  )
  const linearGeometryById = useMemo(
    () =>
      new Map(
        (linearFeatureGeometries.data ?? []).map((geometry) => [
          geometry.id,
          geometry,
        ]),
      ),
    [linearFeatureGeometries.data],
  )
  const mountainGeometryById = useMemo(
    () =>
      new Map(
        (mountainGeometries.data ?? []).map((geometry) => [
          geometry.id,
          geometry,
        ]),
      ),
    [mountainGeometries.data],
  )
  const desertGeometryById = useMemo(
    () =>
      new Map(
        (desertGeometries.data ?? []).map((geometry) => [
          geometry.id,
          geometry,
        ]),
      ),
    [desertGeometries.data],
  )
  const loading =
    countryBoundaries.status === 'loading' ||
    (needsWaterbody && waterbodyGeometries.status === 'loading') ||
    (needsLinearFeature && linearFeatureGeometries.status === 'loading') ||
    (needsMountain && mountainGeometries.status === 'loading') ||
    (needsDesert && desertGeometries.status === 'loading')
  const failed =
    countryBoundaries.status === 'error' ||
    (needsWaterbody && waterbodyGeometries.status === 'error') ||
    (needsLinearFeature && linearFeatureGeometries.status === 'error') ||
    (needsMountain && mountainGeometries.status === 'error') ||
    (needsDesert && desertGeometries.status === 'error')
  const retry = () => {
    countryBoundaries.retry()
    if (needsWaterbody) waterbodyGeometries.retry()
    if (needsLinearFeature) linearFeatureGeometries.retry()
    if (needsMountain) mountainGeometries.retry()
    if (needsDesert) desertGeometries.retry()
  }

  return (
    <section
      className="knowledge-earth-map-card knowledge-map-card world-extremes-map-card"
      aria-label={`${metricName}世界地图`}
      style={{
        width: workbench
          ? compact
            ? 'min(100%, 24rem)'
            : 'min(100%, 70rem)'
          : 'calc(100% - 1.5rem)',
        marginInline: 'auto',
      }}
    >
      <svg
        className="knowledge-earth-map world-extremes-map"
        data-testid="world-extremes-map"
        data-metric-id={metricId}
        viewBox={`0 0 ${MINI_MAP_WIDTH} ${MINI_MAP_HEIGHT}`}
        role="group"
        aria-label={`${metricName}前三名位置图`}
      >
        <rect width={MINI_MAP_WIDTH} height={MINI_MAP_HEIGHT} fill="#0b242b" />
        <g aria-hidden="true" className="world-extremes-map-grid">
          {[60, 120, 180, 240, 300].map((x) => (
            <line
              key={`x-${x}`}
              x1={x}
              x2={x}
              y1={0}
              y2={180}
              stroke="rgb(139 170 176 / 13%)"
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
              stroke="rgb(139 170 176 / 13%)"
              strokeWidth="0.45"
            />
          ))}
        </g>
        <g aria-hidden="true" className="world-extremes-map-land">
          {landmassPaths.map(({ id, path }) => (
            <path
              key={id}
              d={path}
              fill="rgb(59 91 96 / 72%)"
              stroke="rgb(151 183 187 / 34%)"
              strokeWidth="0.32"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {boundaryPaths.map(({ code, path }) => {
            const entry = countryEntryByCode.get(code)
            const selected = entry?.id === selectedEntryId
            const color = entry
              ? getWorldExtremeRankColor(entry.rank)
              : 'rgb(59 91 96 / 72%)'
            return (
              <path
                key={code}
                d={path}
                data-country-code={code}
                data-rank={entry?.rank}
                data-selected={selected ? 'true' : undefined}
                className={entry ? 'is-ranked' : undefined}
                fill={color}
                fillOpacity={entry ? (selected ? 0.82 : 0.62) : 1}
                stroke={
                  selected ? '#fff' : entry ? color : 'rgb(151 183 187 / 34%)'
                }
                strokeWidth={selected ? 1.45 : entry ? 1.1 : 0.32}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </g>

        <g aria-hidden="true" className="world-extremes-map-features">
          {entries.map((entry) => {
            const entity = entry.entity
            if (!entity || entity.kind === 'country') return null
            if (metricId === 'highest-peak') return null
            let path = ''
            let surface = false
            if (entity.kind === 'waterbody') {
              const geometry = waterbodyGeometryById.get(entity.id)
              if (geometry?.kind === 'surface') {
                path = worldMiniMapPath(geometry.lowDetailGeometry) ?? ''
                surface = true
              } else if (geometry?.kind === 'trench') {
                path = geometry.lowDetailPoints
                  .map((point, index) => {
                    const projected = projectGeoPosition({
                      latitude: point[0],
                      longitude: point[1],
                    })!
                    return `${index === 0 ? 'M' : 'L'}${projected.x} ${projected.y}`
                  })
                  .join(' ')
              }
            } else if (entity.kind === 'linearFeature') {
              const geometry = linearGeometryById.get(entity.id)
              path = geometry
                ? (worldMiniMapPath(geometry.lowDetailGeometry) ?? '')
                : ''
            } else if (entity.kind === 'mountainRange') {
              const geometry = mountainGeometryById.get(entity.id)
              path = geometry
                ? (worldMiniMapPath(geometry.lowDetailGeometry) ?? '')
                : ''
            } else if (entity.kind === 'desert') {
              const geometry = desertGeometryById.get(entity.id)
              path = geometry
                ? (worldMiniMapPath(geometry.lowDetailGeometry) ?? '')
                : ''
              surface = true
            }
            if (!path) return null
            const selected = entry.id === selectedEntryId
            const color = getWorldExtremeRankColor(entry.rank)
            return (
              <path
                key={`${entry.id}-geometry`}
                d={path}
                data-entry-id={entry.id}
                data-rank={entry.rank}
                data-selected={selected ? 'true' : undefined}
                fill={surface ? color : 'none'}
                fillOpacity={surface ? (selected ? 0.52 : 0.32) : undefined}
                stroke={selected ? '#fff' : color}
                strokeWidth={selected ? 2 : surface ? 0.8 : 1.5}
                vectorEffect="non-scaling-stroke"
                className={surface ? 'is-surface' : 'is-linear'}
              />
            )
          })}
        </g>

        <g className="world-extremes-map-markers">
          {markerEntries.map((entry) => {
            const point = projectGeoPosition(entry.position)
            if (!point) return null
            const selected = entry.id === selectedEntryId
            const microstate =
              entry.entity?.kind === 'country' &&
              microstateCodes.has(entry.entity.id)
            const color = getWorldExtremeRankColor(entry.rank)
            return (
              <g
                key={entry.id}
                role="button"
                tabIndex={0}
                aria-label={`查看第${entry.rank}名${entry.name.zh}详情`}
                aria-current={selected ? 'true' : undefined}
                data-entry-id={entry.id}
                data-rank={entry.rank}
                data-microstate={microstate ? 'true' : undefined}
                transform={`translate(${point.x} ${point.y})`}
                style={{ color, cursor: 'pointer' }}
                onClick={() => onSelectEntry(entry)}
                onKeyDown={(event) =>
                  activateSvgControlOnKeyboard(event, () =>
                    onSelectEntry(entry),
                  )
                }
              >
                <title>
                  第{entry.rank}名 · {entry.name.zh} · {entry.name.en}
                </title>
                <circle
                  className="world-extremes-marker-hit"
                  r="7"
                  fill="transparent"
                  stroke={selected ? '#fff' : 'transparent'}
                  strokeWidth="1.5"
                />
                <circle
                  className="world-extremes-marker-dot"
                  r="4"
                  fill={color}
                  stroke={selected ? '#fff' : '#06161c'}
                  strokeWidth={selected ? 1.4 : 0.9}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  y="1.8"
                  textAnchor="middle"
                  fill="#071319"
                  fontSize="5"
                  fontWeight="800"
                  style={{ pointerEvents: 'none' }}
                >
                  {entry.rank}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      <WorldMapResourceStatus
        loading={loading}
        failed={failed}
        loadingText="正在加载当前纪录地图…"
        errorText="当前纪录地图加载失败，榜单仍可继续阅读。"
        onRetry={retry}
      />
    </section>
  )
}
