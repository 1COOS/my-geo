import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { getCountry } from '../../data/countries'
import {
  getGeographyTopic,
  getReferenceLine,
  resolveGeographyLearningSelection,
} from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLine,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import type { GeoPosition } from '../../shared/types/geo'
import {
  GeographyLessonSections,
  GeographyTopicNav,
} from '../geography-learning/GeographyLearningContent'
import { KnowledgeEarthMap } from './KnowledgeEarthMap'
import { KnowledgeTopicNavigation } from './KnowledgeTopicNavigation'

const DEFAULT_TOPIC_ID: GeographyTopicId = 'grid-reading'
const INITIAL_POSITION = getCountry('CN')!.center

function getEarthLearningSelection(searchParams: URLSearchParams) {
  return (
    resolveGeographyLearningSelection(
      searchParams.get('topic'),
      searchParams.get('line'),
    ) ?? { topicId: DEFAULT_TOPIC_ID, referenceLineId: null }
  )
}

export function KnowledgeEarthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selection = getEarthLearningSelection(searchParams)
  const topic = getGeographyTopic(selection.topicId)!
  const referenceLine = getReferenceLine(selection.referenceLineId)
  const [mapState, setMapState] = useState<{
    position: GeoPosition
    referenceLineId: ReferenceLineId | null
  }>(() => ({
    position: referenceLine?.focusPosition ?? INITIAL_POSITION,
    referenceLineId: selection.referenceLineId,
  }))
  const position =
    mapState.referenceLineId === selection.referenceLineId
      ? mapState.position
      : (referenceLine?.focusPosition ?? mapState.position)

  const selectTopic = (topicId: GeographyTopicId) => {
    setSearchParams({ topic: topicId })
  }

  const selectReferenceLine = (line: ReferenceLine) => {
    setMapState({ position: line.focusPosition, referenceLineId: line.id })
    setSearchParams({ topic: line.topicId, line: line.id })
  }

  const selectReferenceLineId = (referenceLineId: ReferenceLineId) => {
    const line = getReferenceLine(referenceLineId)
    if (line) selectReferenceLine(line)
  }

  const exploreSearchParams = new URLSearchParams({
    geography: selection.topicId,
  })
  if (selection.referenceLineId) {
    exploreSearchParams.set('line', selection.referenceLineId)
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

        <div className="knowledge-earth-workspace">
          <KnowledgeEarthMap
            topicId={selection.topicId}
            referenceLineId={selection.referenceLineId}
            position={position}
            onPositionChange={(nextPosition) =>
              setMapState({
                position: nextPosition,
                referenceLineId: selection.referenceLineId,
              })
            }
            onSelectReferenceLine={selectReferenceLine}
          />

          <article
            className="knowledge-earth-lesson knowledge-map-card"
            aria-labelledby="earth-lesson-title"
          >
            <header className="knowledge-earth-lesson-heading">
              <h2 id="earth-lesson-title">{topic.name.zh}</h2>
              <p>{topic.name.en}</p>
            </header>

            <GeographyLessonSections
              topicId={selection.topicId}
              referenceLineId={selection.referenceLineId}
              onSelectReferenceLine={selectReferenceLineId}
            />

            <Link
              className="knowledge-view-on-globe knowledge-earth-view-on-globe"
              to={`/explore?${exploreSearchParams.toString()}`}
              style={{ marginTop: '0.9rem' }}
            >
              在3D地球中观察
            </Link>
          </article>
        </div>
      </section>
    </main>
  )
}
