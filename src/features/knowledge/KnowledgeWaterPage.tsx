import { useEffect, useRef } from 'react'
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
  getWaterObjectLayerId,
  resolveWaterLearningLayerId,
  waterLearningLayers,
} from '../../data/waterLearning'
import type { WaterLearningLayerId } from '../../data/waterLearningSchema'
import { getWaterbody } from '../../data/waterbodies'
import {
  KnowledgeWaterMap,
  KnowledgeWaterObjectRows,
} from './KnowledgeWaterMap'
import { KnowledgeWaterObjectCard } from './KnowledgeWaterObjectCard'
import { KnowledgeTopicNavigation } from './KnowledgeTopicNavigation'

export function KnowledgeWaterPage() {
  const shellRef = useRef<HTMLElement>(null)
  const { waterbodyId, linearFeatureId } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const layerParam = searchParams.get('layer')
  const legacyTopicParam = searchParams.get('topic')
  const requestedLayerId = resolveWaterLearningLayerId(
    layerParam,
    legacyTopicParam,
  )
  const objectLayerId = getWaterObjectLayerId(waterbodyId, linearFeatureId)
  const hasObjectRoute = Boolean(waterbodyId || linearFeatureId)
  useEffect(() => {
    if (!hasObjectRoute) return
    const shell = shellRef.current
    if (!shell) return
    if (typeof shell.scrollTo === 'function') shell.scrollTo({ top: 0 })
    else shell.scrollTop = 0
  }, [hasObjectRoute, linearFeatureId, waterbodyId])

  if (legacyTopicParam && !layerParam) {
    return (
      <Navigate to={`${location.pathname}?layer=${requestedLayerId}`} replace />
    )
  }

  if (layerParam && !getWaterLearningLayer(layerParam)) {
    return <Navigate to={`${location.pathname}?layer=ocean`} replace />
  }

  if (hasObjectRoute && !objectLayerId) {
    return (
      <Navigate to={`/knowledge/water?layer=${requestedLayerId}`} replace />
    )
  }

  if (objectLayerId && objectLayerId !== requestedLayerId) {
    return (
      <Navigate to={`${location.pathname}?layer=${objectLayerId}`} replace />
    )
  }

  const layerId = objectLayerId ?? requestedLayerId
  const layer = getWaterLearningLayer(layerId)!
  const waterbody = waterbodyId ? getWaterbody(waterbodyId) : undefined
  const linearFeature = linearFeatureId
    ? getLinearGeoFeature(linearFeatureId)
    : undefined
  const selected = waterbody
    ? ({ kind: 'waterbody', id: waterbody.id } as const)
    : linearFeature
      ? ({ kind: 'linearFeature', id: linearFeature.id } as const)
      : null
  const selectLayer = (nextLayerId: WaterLearningLayerId) => {
    void navigate(`/knowledge/water?layer=${nextLayerId}`)
  }
  const selectWaterbody = (id: string) => {
    void navigate(`/knowledge/water/waterbodies/${id}?layer=${layerId}`)
  }
  const selectLinearFeature = (id: string) => {
    void navigate(`/knowledge/water/linear-features/${id}?layer=${layerId}`)
  }
  const overviewTarget = `/knowledge/water?layer=${layerId}`

  if (selected) {
    return (
      <main
        ref={shellRef}
        className="knowledge-shell knowledge-region-shell has-country-selection knowledge-earth-detail-shell"
      >
        <div className="knowledge-region-content knowledge-earth-detail-content">
          <section
            className="knowledge-earth-detail-study"
            aria-label={`${layer.name}对象地图`}
          >
            <Link className="knowledge-earth-detail-back" to={overviewTarget}>
              ← 返回{layer.name}
            </Link>
            <KnowledgeWaterMap
              layerId={layerId}
              selected={selected}
              onSelectWaterbody={selectWaterbody}
              onSelectLinearFeature={selectLinearFeature}
            />
            <KnowledgeWaterObjectRows layerId={layerId} selected={selected} />
          </section>
        </div>

        {waterbody ? (
          <KnowledgeWaterObjectCard
            object={waterbody}
            objectType="waterbody"
            layer={layer}
            onClose={() => void navigate(overviewTarget)}
          />
        ) : (
          <KnowledgeWaterObjectCard
            object={linearFeature!}
            objectType="linearFeature"
            layer={layer}
            onClose={() => void navigate(overviewTarget)}
          />
        )}
      </main>
    )
  }

  return (
    <main ref={shellRef} className="knowledge-shell knowledge-earth-shell">
      <KnowledgeTopicNavigation activeTopic="water" />

      <section className="knowledge-earth" aria-label="水域对象学习">
        <div
          className="knowledge-continent-tabs knowledge-earth-topic-tabs"
          role="tablist"
          aria-label="水域图层"
        >
          {waterLearningLayers.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === layerId}
              onClick={() => selectLayer(item.id)}
            >
              <strong>{item.name}</strong>
            </button>
          ))}
        </div>

        <KnowledgeWaterMap
          layerId={layerId}
          selected={null}
          onSelectWaterbody={selectWaterbody}
          onSelectLinearFeature={selectLinearFeature}
        />
        <KnowledgeWaterObjectRows layerId={layerId} selected={null} />
      </section>
    </main>
  )
}
