import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import {
  formatReferenceLineCoordinate,
  getGeographyTopicReferenceLines,
} from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import { getKnowledgeEarthLineColor } from './knowledgeEarthLinePresentation'

type KnowledgeEarthReferenceLinksProps = {
  topicId: GeographyTopicId
  currentLineId?: ReferenceLineId
  label?: string
}

export function KnowledgeEarthReferenceLinks({
  topicId,
  currentLineId,
  label = '重点经纬线',
}: KnowledgeEarthReferenceLinksProps) {
  const topicLines = getGeographyTopicReferenceLines(topicId)

  return (
    <nav className="knowledge-earth-reference-lines" aria-label={label}>
      <div className="geography-reference-list knowledge-earth-reference-grid">
        {topicLines.map((line) => (
          <Link
            key={line.id}
            to={`/knowledge/earth/lines/${line.id}`}
            aria-current={line.id === currentLineId ? 'page' : undefined}
            style={
              {
                '--knowledge-earth-line-color':
                  getKnowledgeEarthLineColor(line),
              } as CSSProperties
            }
          >
            <strong>{line.name.zh}</strong>
            <small>{formatReferenceLineCoordinate(line)}</small>
          </Link>
        ))}
      </div>
    </nav>
  )
}
