import { useMemo } from 'react'

import {
  loadLinearFeatureGeometries,
  loadWaterbodyGeometries,
} from '../../data/geometryResources'
import type { Waterbody } from '../../data/waterbodySchema'
import {
  getWaterLayerLinearFeatures,
  getWaterLayerWaterbodies,
  getWaterObjectsForGroup,
} from '../../data/waterLearning'
import type { WaterLearningLayerId } from '../../data/waterLearningSchema'
import type { WaterObjectGroup } from '../../data/waterLearningSchema'
import { useGeometryResource } from '../../shared/hooks/useGeometryResource'
import { WorldMapResourceStatus } from '../../shared/maps/WorldMapResourceStatus'
import { activateSvgControlOnKeyboard } from '../../shared/maps/svgMapInteraction'
import { useWorldBoundaryPaths } from '../../shared/maps/useWorldBoundaryPaths'
import {
  getMapFeaturePath,
  MINI_MAP_WIDTH,
  projectGeoPosition,
  worldMiniMapPath,
} from '../explore/worldMiniMapUtils'
import { KnowledgeCategoryCards } from './KnowledgeCategoryCards'

export type SelectedWaterObject =
  | { kind: 'waterbody'; id: string }
  | { kind: 'linearFeature'; id: string }
  | null

type KnowledgeWaterMapProps = {
  layerId: WaterLearningLayerId
  selected: SelectedWaterObject
  activeGroup?: WaterObjectGroup
  workbench?: boolean
  compact?: boolean
  onSelectWaterbody: (waterbodyId: string) => void
  onSelectLinearFeature: (featureId: string) => void
}

type KnowledgeWaterObjectRowsProps = {
  group: WaterObjectGroup
  selected: SelectedWaterObject
  compact?: boolean
}

const WATER_MAP_TOP = 5
const WATER_MAP_HEIGHT = 170
const WATER_MAP_BOTTOM = WATER_MAP_TOP + WATER_MAP_HEIGHT

function getWaterbodyColor(waterbody: Waterbody) {
  if (waterbody.kind === 'lake') return '#53e6bd'
  if (waterbody.kind === 'trench') return '#b293ff'
  if (waterbody.kind === 'strait') return '#75bfff'
  return '#31d8ec'
}

export function KnowledgeWaterMap({
  layerId,
  selected,
  activeGroup,
  onSelectWaterbody,
  onSelectLinearFeature,
}: KnowledgeWaterMapProps) {
  const {
    resource: countryBoundaries,
    countryPaths: boundaryPaths,
    landmassPaths,
  } = useWorldBoundaryPaths(getMapFeaturePath)
  const usesWaterbodies = layerId !== 'river'
  const usesLinearFeatures = layerId === 'river'
  const waterbodyGeometries = useGeometryResource(
    loadWaterbodyGeometries,
    usesWaterbodies,
  )
  const linearFeatureGeometries = useGeometryResource(
    loadLinearFeatureGeometries,
    usesLinearFeatures,
  )
  const waterbodies = getWaterLayerWaterbodies(layerId)
  const linearFeatures = getWaterLayerLinearFeatures(layerId)
  const activeGroupObjectIds = useMemo(
    () => new Set(activeGroup?.objectIds ?? []),
    [activeGroup],
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
  const loading =
    countryBoundaries.status === 'loading' ||
    (usesWaterbodies && waterbodyGeometries.status === 'loading') ||
    (usesLinearFeatures && linearFeatureGeometries.status === 'loading')
  const failed =
    countryBoundaries.status === 'error' ||
    (usesWaterbodies && waterbodyGeometries.status === 'error') ||
    (usesLinearFeatures && linearFeatureGeometries.status === 'error')
  const retry = () => {
    countryBoundaries.retry()
    if (usesWaterbodies) waterbodyGeometries.retry()
    if (usesLinearFeatures) linearFeatureGeometries.retry()
  }

  return (
    <section
      className="knowledge-earth-map-card knowledge-map-card"
      aria-label={`${layerId}水域图层世界地图`}
    >
      <svg
        className="knowledge-earth-map"
        data-testid="knowledge-water-map"
        viewBox={`0 ${WATER_MAP_TOP} ${MINI_MAP_WIDTH} ${WATER_MAP_HEIGHT}`}
        aria-label="世界水域对象分布图"
      >
        <rect
          y={WATER_MAP_TOP}
          width={MINI_MAP_WIDTH}
          height={WATER_MAP_HEIGHT}
          fill="#0b242b"
        />
        <g aria-hidden="true">
          {[60, 120, 180, 240, 300].map((x) => (
            <line
              key={`x-${x}`}
              x1={x}
              x2={x}
              y1={WATER_MAP_TOP}
              y2={WATER_MAP_BOTTOM}
              stroke="rgb(139 170 176 / 14%)"
              strokeWidth="0.45"
            />
          ))}
          {[30, 60, 90, 120, 150].map((y) => (
            <line
              key={`y-${y}`}
              x1={0}
              x2={MINI_MAP_WIDTH}
              y1={y}
              y2={y}
              stroke="rgb(139 170 176 / 14%)"
              strokeWidth="0.45"
            />
          ))}
        </g>
        <g aria-hidden="true">
          {landmassPaths.map(({ id, path }) => (
            <path
              key={id}
              d={path}
              fill="rgb(59 91 96 / 72%)"
              stroke="rgb(151 183 187 / 34%)"
              strokeWidth="0.32"
            />
          ))}
          {boundaryPaths.map(({ code, path }) => (
            <path
              key={code}
              d={path}
              fill="rgb(59 91 96 / 72%)"
              stroke="rgb(151 183 187 / 34%)"
              strokeWidth="0.32"
            />
          ))}
        </g>

        <g data-testid="knowledge-water-map-waterbodies">
          {waterbodies.map((waterbody) => {
            const geometry = waterbodyGeometryById.get(waterbody.id)
            const selectedObject =
              selected?.kind === 'waterbody' && selected.id === waterbody.id
            const inActiveGroup =
              !activeGroup || activeGroupObjectIds.has(waterbody.id)
            const color = getWaterbodyColor(waterbody)
            const center = projectGeoPosition(waterbody.center)
            const geometryPath =
              geometry?.kind === 'surface'
                ? (worldMiniMapPath(geometry.lowDetailGeometry) ?? '')
                : geometry?.kind === 'trench'
                  ? geometry.lowDetailPoints
                      .map((point, index) => {
                        const projected = projectGeoPosition({
                          latitude: point[0],
                          longitude: point[1],
                        })!
                        return `${index === 0 ? 'M' : 'L'}${projected.x} ${projected.y}`
                      })
                      .join(' ')
                  : ''
            const surfaceOpacity =
              waterbody.layer === 'lake'
                ? selectedObject
                  ? 0.55
                  : 0.34
                : selectedObject
                  ? 0.38
                  : 0.07
            return (
              <g
                key={waterbody.id}
                data-waterbody-id={waterbody.id}
                role="button"
                aria-label={`查看${waterbody.name.zh}详情`}
                aria-current={selectedObject ? 'true' : undefined}
                data-group-member={inActiveGroup ? 'true' : 'false'}
                tabIndex={0}
                onClick={() => onSelectWaterbody(waterbody.id)}
                onKeyDown={(event) =>
                  activateSvgControlOnKeyboard(event, () =>
                    onSelectWaterbody(waterbody.id),
                  )
                }
                style={{
                  color,
                  cursor: 'pointer',
                  opacity: selectedObject || inActiveGroup ? 1 : 0.24,
                }}
              >
                <title>
                  {waterbody.name.zh} · {waterbody.name.en}
                </title>
                {geometryPath ? (
                  <path
                    d={geometryPath}
                    fill={
                      geometry?.kind === 'surface' ? 'currentColor' : 'none'
                    }
                    fillOpacity={
                      geometry?.kind === 'surface' ? surfaceOpacity : undefined
                    }
                    stroke={selectedObject ? '#fff' : 'currentColor'}
                    strokeWidth={selectedObject ? 1.6 : 0.75}
                    strokeDasharray={
                      waterbody.kind === 'trench' ? '3 2' : undefined
                    }
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
                {center ? (
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={selectedObject ? 2.5 : 1.25}
                    fill={selectedObject ? '#fff' : 'currentColor'}
                    stroke="#06161c"
                    strokeWidth="0.7"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
                {selectedObject && center ? (
                  <text
                    x={center.x}
                    y={Math.max(WATER_MAP_TOP + 8, center.y - 4)}
                    textAnchor="middle"
                    fill="#fff"
                    stroke="#06161c"
                    strokeWidth="2.5"
                    fontSize="6.5"
                    fontWeight="700"
                    style={{ paintOrder: 'stroke', pointerEvents: 'none' }}
                  >
                    {waterbody.name.zh}
                  </text>
                ) : null}
              </g>
            )
          })}
        </g>

        <g data-testid="knowledge-water-map-linear-features">
          {linearFeatures.map((feature) => {
            const geometry = linearGeometryById.get(feature.id)
            const selectedObject =
              selected?.kind === 'linearFeature' && selected.id === feature.id
            const inActiveGroup =
              !activeGroup || activeGroupObjectIds.has(feature.id)
            const path = geometry
              ? (worldMiniMapPath(geometry.lowDetailGeometry) ?? '')
              : ''
            const labelPoint = projectGeoPosition(feature.labelPosition)
            return (
              <g
                key={feature.id}
                data-linear-feature-id={feature.id}
                data-linear-feature-kind={feature.kind}
                role="button"
                aria-label={`查看${feature.name.zh}详情`}
                aria-current={selectedObject ? 'true' : undefined}
                data-group-member={inActiveGroup ? 'true' : 'false'}
                tabIndex={0}
                onClick={() => onSelectLinearFeature(feature.id)}
                onKeyDown={(event) =>
                  activateSvgControlOnKeyboard(event, () =>
                    onSelectLinearFeature(feature.id),
                  )
                }
                style={{
                  cursor: 'pointer',
                  opacity: selectedObject || inActiveGroup ? 1 : 0.24,
                }}
              >
                <title>
                  {feature.name.zh} · {feature.name.en}
                </title>
                <path
                  d={path}
                  fill="none"
                  stroke={
                    selectedObject
                      ? '#fff'
                      : feature.kind === 'canal'
                        ? '#f7bf4f'
                        : '#36dced'
                  }
                  strokeWidth={
                    selectedObject ? 2.2 : feature.kind === 'canal' ? 1.1 : 1.25
                  }
                  strokeDasharray={feature.kind === 'canal' ? '3 2' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {selectedObject && labelPoint ? (
                  <text
                    x={labelPoint.x}
                    y={Math.max(WATER_MAP_TOP + 8, labelPoint.y - 4)}
                    textAnchor="middle"
                    fill="#fff"
                    stroke="#06161c"
                    strokeWidth="2.5"
                    fontSize="6.5"
                    fontWeight="700"
                    style={{ paintOrder: 'stroke', pointerEvents: 'none' }}
                  >
                    {feature.name.zh}
                  </text>
                ) : null}
              </g>
            )
          })}
        </g>
      </svg>

      <WorldMapResourceStatus
        loading={loading}
        failed={failed}
        loadingText="正在加载水域地图…"
        errorText="水域地图加载失败。"
        onRetry={retry}
      />
    </section>
  )
}

export function KnowledgeWaterGroupRows({
  groups,
  activeGroupId,
  compact = false,
  label,
}: {
  groups: readonly WaterObjectGroup[]
  activeGroupId?: string
  compact?: boolean
  label: string
}) {
  return (
    <KnowledgeCategoryCards
      compact={compact}
      label={label}
      items={groups.map((group) => ({
        id: group.id,
        title: group.name,
        subtitle: group.nameEn,
        meta: `${group.objectIds.length} 个`,
        to: `/knowledge/water/groups/${group.id}`,
        testId: `knowledge-water-group-${group.id}`,
        current: group.id === activeGroupId,
      }))}
    />
  )
}

export function KnowledgeWaterObjectRows({
  group,
  selected,
  compact = false,
}: KnowledgeWaterObjectRowsProps) {
  const objects = getWaterObjectsForGroup(group)

  return (
    <KnowledgeCategoryCards
      compact={compact}
      label={`${group.name}对象`}
      items={objects.map((object) => ({
        id: object.value.id,
        title: object.value.name.zh,
        subtitle: object.value.name.en,
        to: `/knowledge/water/groups/${group.id}?object=${object.value.id}`,
        current:
          selected?.kind === object.kind && selected.id === object.value.id,
      }))}
    />
  )
}
