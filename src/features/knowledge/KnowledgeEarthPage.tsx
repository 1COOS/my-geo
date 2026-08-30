import { Navigate, useSearchParams } from 'react-router-dom'

import {
  geographyTopics,
  getGeographyTopic,
  resolveGeographyLearningSelection,
} from '../../data/geographyLearning'
import type { GeographyTopicId } from '../../data/geographyLearningSchema'
import { KnowledgeEarthMap } from './KnowledgeEarthMap'
import { KnowledgeEarthReferenceLinks } from './KnowledgeEarthReferenceLinks'
import { KnowledgeMapWorkbenchPage } from './KnowledgeMapWorkbench'
import { KnowledgePrimaryTabs } from './KnowledgePrimaryTabs'

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
    <KnowledgeMapWorkbenchPage
      activeTopic="earth"
      label="地球经纬线学习"
      renderControls={(compact) => (
        <KnowledgePrimaryTabs
          activeId={selection.topicId}
          compact={compact}
          items={geographyTopics.map((topic) => ({
            id: topic.id,
            label: topic.shortName.zh,
          }))}
          label="地球经纬线用途"
          onSelect={(id) => selectTopic(id as GeographyTopicId)}
        />
      )}
      renderMap={(compact) => (
        <KnowledgeEarthMap
          topicId={selection.topicId}
          onSelectTopic={selectTopic}
          workbench
          compact={compact}
        />
      )}
      renderResults={(compact) => (
        <KnowledgeEarthReferenceLinks
          topicId={selection.topicId}
          compact={compact}
        />
      )}
    />
  )
}
