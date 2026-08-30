import { useEffect, useRef, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { getLinearGeoFeature } from '../../data/linearGeoFeatures'
import {
  getWaterLearningLayer,
  getWaterObjectGroup,
  getWaterObjectGroupForObject,
  getWaterObjectGroups,
  resolveWaterLearningLayerId,
  waterLearningLayers,
} from '../../data/waterLearning'
import type { WaterLearningLayerId } from '../../data/waterLearningSchema'
import { getWaterbody } from '../../data/waterbodies'
import { KnowledgeMapWorkbenchPage } from './KnowledgeMapWorkbench'
import { KnowledgePrimaryTabs } from './KnowledgePrimaryTabs'
import {
  KnowledgeWaterGroupRows,
  KnowledgeWaterMap,
  KnowledgeWaterObjectRows,
} from './KnowledgeWaterMap'
import { KnowledgeWaterGroupOverviewCard } from './KnowledgeWaterGroupOverviewCard'
import { KnowledgeWaterObjectCard } from './KnowledgeWaterObjectCard'

function getWaterLayerPath(layerId: WaterLearningLayerId) {
  return `/knowledge/water?layer=${layerId}`
}

function getWaterGroupPath(groupId: string, objectId?: string) {
  return `/knowledge/water/groups/${groupId}${objectId ? `?object=${objectId}` : ''}`
}

function useCompactLandscape() {
  const [compact, setCompact] = useState(
    () => window.matchMedia('(max-height: 520px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-height: 520px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return compact
}

export function KnowledgeWaterPage() {
  const { groupId, waterbodyId, linearFeatureId } = useParams()
  const [searchParams] = useSearchParams()
  const requestedObjectId = waterbodyId ?? linearFeatureId

  if (requestedObjectId) {
    const group = getWaterObjectGroupForObject(waterbodyId, linearFeatureId)
    if (!group) {
      return (
        <Navigate
          to={getWaterLayerPath(
            resolveWaterLearningLayerId(searchParams.get('layer')),
          )}
          replace
        />
      )
    }
    return (
      <Navigate to={getWaterGroupPath(group.id, requestedObjectId)} replace />
    )
  }

  return groupId ? (
    <KnowledgeWaterGroupPage groupId={groupId} />
  ) : (
    <KnowledgeWaterOverviewPage />
  )
}

function KnowledgeWaterOverviewPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const layerParam = searchParams.get('layer')
  const legacyTopicParam = searchParams.get('topic')
  const legacyGroupParam = searchParams.get('group')
  const layerId = resolveWaterLearningLayerId(layerParam, legacyTopicParam)
  const layer = getWaterLearningLayer(layerId)!
  const groups = getWaterObjectGroups(layerId)
  const legacyGroup = getWaterObjectGroup(legacyGroupParam)

  if (legacyGroup) {
    return <Navigate to={getWaterGroupPath(legacyGroup.id)} replace />
  }

  const canonicalSearch = new URLSearchParams({ layer: layerId }).toString()
  if (
    legacyTopicParam ||
    legacyGroupParam ||
    (layerParam !== null && !getWaterLearningLayer(layerParam)) ||
    searchParams.toString() !== canonicalSearch
  ) {
    return <Navigate to={`${location.pathname}?${canonicalSearch}`} replace />
  }

  const openWaterbody = (id: string) => {
    const group = getWaterObjectGroupForObject(id)
    if (group) void navigate(getWaterGroupPath(group.id, id))
  }
  const openLinearFeature = (id: string) => {
    const group = getWaterObjectGroupForObject(undefined, id)
    if (group) void navigate(getWaterGroupPath(group.id, id))
  }

  return (
    <KnowledgeMapWorkbenchPage
      label="水域对象学习"
      title="江河湖海"
      renderControls={(compact) => (
        <KnowledgePrimaryTabs
          activeId={layerId}
          compact={compact}
          getTo={(item) => getWaterLayerPath(item.id as WaterLearningLayerId)}
          items={waterLearningLayers.map((item) => ({
            id: item.id,
            label: item.name,
          }))}
          label="水域图层"
        />
      )}
      renderMap={(compact) => (
        <KnowledgeWaterMap
          layerId={layerId}
          selected={null}
          workbench
          compact={compact}
          onSelectWaterbody={openWaterbody}
          onSelectLinearFeature={openLinearFeature}
        />
      )}
      renderResults={(compact) => (
        <KnowledgeWaterGroupRows
          groups={groups}
          compact={compact}
          label={`${layer.name}分组`}
        />
      )}
    />
  )
}

function KnowledgeWaterGroupPage({ groupId }: { groupId: string }) {
  const shellRef = useRef<HTMLElement>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const compact = useCompactLandscape()
  const group = getWaterObjectGroup(groupId)
  const objectId = searchParams.get('object')

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    if (typeof shell.scrollTo === 'function') shell.scrollTo({ top: 0 })
    else shell.scrollTop = 0
  }, [group?.id, objectId])

  if (!group) return <Navigate to={getWaterLayerPath('ocean')} replace />

  const layer = getWaterLearningLayer(group.layerId)!
  const groups = getWaterObjectGroups(group.layerId)
  const objectGroup = getWaterObjectGroupForObject(objectId ?? undefined)
  const waterbody = objectId ? getWaterbody(objectId) : undefined
  const linearFeature = objectId ? getLinearGeoFeature(objectId) : undefined
  const selected = waterbody
    ? ({ kind: 'waterbody', id: waterbody.id } as const)
    : linearFeature
      ? ({ kind: 'linearFeature', id: linearFeature.id } as const)
      : null

  if (objectId && !objectGroup) {
    return <Navigate to={getWaterGroupPath(group.id)} replace />
  }
  if (objectId && objectGroup?.id !== group.id) {
    return (
      <Navigate to={getWaterGroupPath(objectGroup!.id, objectId)} replace />
    )
  }
  if (searchParams.toString() !== (objectId ? `object=${objectId}` : '')) {
    return (
      <Navigate
        to={getWaterGroupPath(group.id, objectId ?? undefined)}
        replace
      />
    )
  }

  const openWaterbody = (id: string) => {
    const nextGroup = getWaterObjectGroupForObject(id)
    if (nextGroup) void navigate(getWaterGroupPath(nextGroup.id, id))
  }
  const openLinearFeature = (id: string) => {
    const nextGroup = getWaterObjectGroupForObject(undefined, id)
    if (nextGroup) void navigate(getWaterGroupPath(nextGroup.id, id))
  }
  const overviewTarget = getWaterGroupPath(group.id)

  return (
    <main
      ref={shellRef}
      className="knowledge-shell knowledge-region-shell has-country-selection knowledge-earth-detail-shell knowledge-water-group-shell"
      data-compact-workbench={compact ? 'true' : 'false'}
      style={{
        overflowY: 'hidden',
        paddingBottom: compact ? '0.45rem' : '0.75rem',
      }}
    >
      <div
        className="knowledge-region-content knowledge-earth-detail-content"
        style={{ height: '100%', minHeight: 0 }}
      >
        <section
          className="knowledge-earth-detail-study"
          aria-label={`${group.name}对象地图`}
          style={{
            display: 'grid',
            height: '100%',
            minHeight: 0,
            gridTemplateRows: compact
              ? '2.75rem minmax(0, 1fr) 3.25rem 3.5rem'
              : '2.75rem minmax(0, 1fr) 4.4rem 4.4rem',
            gap: compact ? '0.4rem' : '0.5rem',
          }}
        >
          <header className="knowledge-region-page-header">
            <Link
              className="knowledge-earth-detail-back"
              to={getWaterLayerPath(group.layerId)}
            >
              ← 返回{layer.name}
            </Link>
            <h1>
              {group.name}
              <strong>{group.objectIds.length}</strong>个对象
            </h1>
          </header>

          <div
            style={{
              display: 'flex',
              minWidth: 0,
              minHeight: 0,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KnowledgeWaterMap
              layerId={group.layerId}
              selected={selected}
              activeGroup={group}
              workbench
              compact={compact}
              onSelectWaterbody={openWaterbody}
              onSelectLinearFeature={openLinearFeature}
            />
          </div>

          <KnowledgeWaterGroupRows
            groups={groups}
            activeGroupId={group.id}
            compact={compact}
            label={`${layer.name}分组`}
          />
          <KnowledgeWaterObjectRows
            group={group}
            selected={selected}
            compact={compact}
          />
        </section>
      </div>

      {waterbody ? (
        <KnowledgeWaterObjectCard
          object={waterbody}
          objectType="waterbody"
          layer={layer}
          onClose={() => void navigate(overviewTarget)}
        />
      ) : linearFeature ? (
        <KnowledgeWaterObjectCard
          object={linearFeature}
          objectType="linearFeature"
          layer={layer}
          onClose={() => void navigate(overviewTarget)}
        />
      ) : (
        <KnowledgeWaterGroupOverviewCard group={group} layer={layer} />
      )}
    </main>
  )
}
