import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { getCountry } from '../../data/countries'
import {
  formatReferenceLineCoordinate,
  getGeographyTopicReferenceLines,
  getReferenceLine,
  resolveGeographyLearningSelection,
} from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLine,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import type { GeoPosition } from '../../shared/types/geo'
import { GeographyTopicNav } from '../geography-learning/GeographyLearningContent'
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
  const referenceLine = getReferenceLine(selection.referenceLineId)
  const topicLines = getGeographyTopicReferenceLines(selection.topicId)
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

        <section
          className="knowledge-earth-reference-lines"
          aria-label="重点经纬线"
        >
          <div className="geography-reference-list knowledge-earth-reference-grid">
            {topicLines.map((line) => (
              <button
                key={line.id}
                type="button"
                className={
                  line.id === selection.referenceLineId
                    ? 'is-active'
                    : undefined
                }
                aria-pressed={line.id === selection.referenceLineId}
                onClick={() => selectReferenceLine(line)}
              >
                <strong>{line.name.zh}</strong>
                <small>{formatReferenceLineCoordinate(line)}</small>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
