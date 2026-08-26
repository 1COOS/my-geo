import { Navigate, useSearchParams } from 'react-router-dom'

import {
  getGeographyTopic,
  resolveGeographyLearningSelection,
} from '../../data/geographyLearning'
import type { GeographyTopicId } from '../../data/geographyLearningSchema'
import { GeographyTopicNav } from '../geography-learning/GeographyLearningContent'
import { KnowledgeEarthMap } from './KnowledgeEarthMap'
import { KnowledgeEarthReferenceLinks } from './KnowledgeEarthReferenceLinks'
import { KnowledgeTopicNavigation } from './KnowledgeTopicNavigation'

const DEFAULT_TOPIC_ID: GeographyTopicId = 'grid-reading'

function getEarthLearningSelection(searchParams: URLSearchParams) {
  const legacySelection = resolveGeographyLearningSelection(
    searchParams.get('topic'),
    searchParams.get('line'),
  )
  if (legacySelection?.referenceLineId) return legacySelection

  const topic = getGeographyTopic(searchParams.get('topic'))
  return {
    topicId: topic?.id ?? DEFAULT_TOPIC_ID,
    referenceLineId: null,
  }
}

export function KnowledgeEarthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selection = getEarthLearningSelection(searchParams)

  if (selection.referenceLineId) {
    return (
      <Navigate
        to={`/knowledge/earth/lines/${selection.referenceLineId}`}
        replace
      />
    )
  }

  const selectTopic = (topicId: GeographyTopicId) => {
    if (topicId === selection.topicId) return
    setSearchParams({ topic: topicId })
  }

  return (
    <main className="knowledge-shell knowledge-earth-shell">
      <KnowledgeTopicNavigation activeTopic="earth" />

      <section className="knowledge-earth" aria-label="地球经纬线学习">
        <GeographyTopicNav
          label="地球经纬线用途"
          topicId={selection.topicId}
          onSelectTopic={selectTopic}
        />

        <KnowledgeEarthMap
          topicId={selection.topicId}
          onSelectTopic={selectTopic}
        />

        <KnowledgeEarthReferenceLinks topicId={selection.topicId} />
      </section>
    </main>
  )
}
