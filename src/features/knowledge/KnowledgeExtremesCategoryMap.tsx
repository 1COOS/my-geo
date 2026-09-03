import { useMemo, type KeyboardEvent } from 'react'

import {
  loadDesertGeometries,
  loadLinearFeatureGeometries,
  loadMountainGeometries,
  loadWaterbodyGeometries,
} from '../../data/geometryResources'
import type {
  WorldExtremeCategory,
  WorldExtremeMetric,
} from '../../data/worldExtremesSchema'
import { useGeometryResource } from '../../shared/hooks/useGeometryResource'
import { WorldMapResourceStatus } from '../../shared/maps/WorldMapResourceStatus'
import { activateSvgControlOnKeyboard } from '../../shared/maps/svgMapInteraction'
import { useWorldBoundaryPaths } from '../../shared/maps/useWorldBoundaryPaths'
import {
  getKnowledgeWorldMapPath,
  KNOWLEDGE_WORLD_MAP_HEIGHT,
  KNOWLEDGE_WORLD_MAP_WIDTH,
  projectKnowledgeWorldPosition,
} from './knowledgeWorldMap'
import { getWorldExtremeMetricColor } from './worldExtremePresentation'

type Champion = {
  metric: WorldExtremeMetric
  entry: WorldExtremeMetric['entries'][number]
}

export function KnowledgeExtremesCategoryMap({
  category,
  compact,
  metrics,
  onSelectChampion,
}: {
  category: WorldExtremeCategory
  compact: boolean
  metrics: readonly WorldExtremeMetric[]
  onSelectChampion: (metricId: string, entryId: string) => void
}) {
  const champions = useMemo<Champion[]>(
    () =>
      metrics.map((metric) => ({
        metric,
        entry: metric.entries[0],
      })),
    [metrics],
  )
  const needsWaterbody = champions.some(
    ({ entry }) => entry.entity?.kind === 'waterbody',
  )
  const needsLinearFeature = champions.some(
    ({ entry }) => entry.entity?.kind === 'linearFeature',
  )
  const needsMountain = champions.some(
    ({ entry }) => entry.entity?.kind === 'mountainRange',
  )
  const needsDesert = champions.some(
    ({ entry }) => entry.entity?.kind === 'desert',
  )
  const {
    resource: countryBoundaries,
    countryPaths: boundaryPaths,
    landmassPaths,
  } = useWorldBoundaryPaths(getKnowledgeWorldMapPath)
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
  const boundaryPathByCode = useMemo(
    () => new Map(boundaryPaths.map(({ code, path }) => [code, path])),
    [boundaryPaths],
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
  const microstateOffsetByMetricId = useMemo(() => {
    if (countryBoundaries.status !== 'ready') return new Map<string, number>()
    const groups = new Map<string, Champion[]>()
    for (const champion of champions) {
      const entity = champion.entry.entity
      if (entity?.kind !== 'country' || boundaryPathByCode.has(entity.id)) {
        continue
      }
      const key = `${champion.entry.position.latitude}:${champion.entry.position.longitude}`
      groups.set(key, [...(groups.get(key) ?? []), champion])
    }
    const offsets = new Map<string, number>()
    for (const group of groups.values()) {
      group.forEach((champion, index) => {
        offsets.set(champion.metric.id, (index - (group.length - 1) / 2) * 10)
      })
    }
    return offsets
  }, [boundaryPathByCode, champions, countryBoundaries.status])
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
      className="knowledge-earth-map-card knowledge-map-card"
      aria-label={`${category.name}冠军地图`}
      style={{
        width: compact ? 'min(100%, 24rem)' : 'min(100%, 70rem)',
        marginInline: 'auto',
      }}
    >
      <svg
        className="knowledge-region-map world-extremes-category-map"
        data-testid="world-extremes-category-map"
        viewBox={`0 0 ${KNOWLEDGE_WORLD_MAP_WIDTH} ${KNOWLEDGE_WORLD_MAP_HEIGHT}`}
        role="group"
        aria-label={`${category.name}各指标冠军区域图`}
      >
        <rect
          width={KNOWLEDGE_WORLD_MAP_WIDTH}
          height={KNOWLEDGE_WORLD_MAP_HEIGHT}
        />
        <g aria-hidden="true" className="knowledge-region-map-grid">
          {[120, 240, 360, 480, 600].map((x) => (
            <line
              key={`x-${x}`}
              x1={x}
              x2={x}
              y1={0}
              y2={KNOWLEDGE_WORLD_MAP_HEIGHT}
            />
          ))}
          {[85, 170, 255].map((y) => (
            <line
              key={`y-${y}`}
              x1={0}
              x2={KNOWLEDGE_WORLD_MAP_WIDTH}
              y1={y}
              y2={y}
            />
          ))}
        </g>
        <g aria-hidden="true" className="knowledge-region-map-landmasses">
          {landmassPaths.map(({ id, path }) => (
            <path key={id} data-landmass-id={id} d={path} />
          ))}
        </g>
        <g aria-hidden="true" className="knowledge-region-map-countries">
          {boundaryPaths.map(({ code, path }) => (
            <path key={code} data-country-code={code} d={path} />
          ))}
        </g>
        <g className="world-extremes-category-overlays">
          {champions.map((champion) => {
            const entity = champion.entry.entity
            if (!entity) return null
            const color = getWorldExtremeMetricColor(champion.metric.id)
            const activate = () =>
              onSelectChampion(champion.metric.id, champion.entry.id)
            const commonProps = {
              role: 'button' as const,
              tabIndex: 0,
              'aria-label': `查看${champion.metric.name}冠军${champion.entry.name.zh}`,
              'data-metric-id': champion.metric.id,
              'data-entry-id': champion.entry.id,
              'data-entity-kind': entity.kind,
              onClick: activate,
              onKeyDown: (event: KeyboardEvent<SVGGElement>) =>
                activateSvgControlOnKeyboard(event, activate),
            }

            if (
              entity.kind === 'country' &&
              countryBoundaries.status === 'ready' &&
              !boundaryPathByCode.has(entity.id)
            ) {
              const point = projectKnowledgeWorldPosition(
                champion.entry.position,
              )
              if (!point) return null
              const offsetX =
                microstateOffsetByMetricId.get(champion.metric.id) ?? 0
              return (
                <g
                  key={champion.metric.id}
                  {...commonProps}
                  data-geometry-kind="microstate"
                  transform={`translate(${point[0] + offsetX} ${point[1]})`}
                  style={{ cursor: 'pointer' }}
                >
                  <title>
                    {champion.metric.name} · {champion.entry.name.zh}
                  </title>
                  <circle
                    className="world-extremes-category-hit"
                    r="9"
                    fill="transparent"
                  />
                  <circle
                    className="world-extremes-category-visible"
                    r="5"
                    fill={color}
                    stroke={color}
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )
            }

            let path = ''
            let surface = false
            if (entity.kind === 'country') {
              path = boundaryPathByCode.get(entity.id) ?? ''
              surface = true
            } else if (entity.kind === 'waterbody') {
              const geometry = waterbodyGeometryById.get(entity.id)
              if (geometry?.kind === 'surface') {
                path = getKnowledgeWorldMapPath(geometry.lowDetailGeometry)
                surface = true
              } else if (geometry?.kind === 'trench') {
                path = getKnowledgeWorldMapPath({
                  type: 'LineString',
                  coordinates: geometry.lowDetailPoints.map(
                    ([latitude, longitude]) => [longitude, latitude],
                  ),
                })
              }
            } else if (entity.kind === 'linearFeature') {
              const geometry = linearGeometryById.get(entity.id)
              path = geometry
                ? getKnowledgeWorldMapPath(geometry.lowDetailGeometry)
                : ''
            } else if (entity.kind === 'mountainRange') {
              const geometry = mountainGeometryById.get(entity.id)
              path = geometry
                ? getKnowledgeWorldMapPath(geometry.lowDetailGeometry)
                : ''
            } else if (entity.kind === 'desert') {
              const geometry = desertGeometryById.get(entity.id)
              path = geometry
                ? getKnowledgeWorldMapPath(geometry.lowDetailGeometry)
                : ''
              surface = true
            }
            if (!path) return null

            return (
              <g
                key={champion.metric.id}
                {...commonProps}
                data-geometry-kind={surface ? 'surface' : 'linear'}
                style={{ cursor: 'pointer' }}
              >
                <title>
                  {champion.metric.name} · {champion.entry.name.zh}
                </title>
                <path
                  className="world-extremes-category-hit"
                  d={path}
                  fill={surface ? 'transparent' : 'none'}
                  stroke="transparent"
                  strokeWidth={surface ? 1 : 12}
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  className="world-extremes-category-visible"
                  d={path}
                  fill={surface ? color : 'none'}
                  fillOpacity={surface ? 0.48 : undefined}
                  stroke={color}
                  strokeOpacity="0.92"
                  strokeWidth={surface ? 1.3 : 3.2}
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            )
          })}
        </g>
      </svg>
      <WorldMapResourceStatus
        loading={loading}
        failed={failed}
        loadingText="正在加载当前类别地图…"
        errorText="当前类别地图加载失败，指标卡仍可继续使用。"
        onRetry={retry}
      />
    </section>
  )
}
