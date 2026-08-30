import {
  formatReferenceLineCoordinate,
  getGeographyTopicReferenceLines,
} from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import { KnowledgeCategoryCards } from './KnowledgeCategoryCards'
import { getKnowledgeEarthLineColor } from './knowledgeEarthLinePresentation'

type KnowledgeEarthReferenceLinksProps = {
  topicId: GeographyTopicId
  currentLineId?: ReferenceLineId
  label?: string
  compact?: boolean
}

export function KnowledgeEarthReferenceLinks({
  topicId,
  currentLineId,
  label = '重点经纬线',
  compact = false,
}: KnowledgeEarthReferenceLinksProps) {
  const topicLines = getGeographyTopicReferenceLines(topicId)

  return (
    <KnowledgeCategoryCards
      compact={compact}
      label={label}
      items={topicLines.map((line) => ({
        id: line.id,
        title: line.name.zh,
        subtitle: line.name.en,
        meta: formatReferenceLineCoordinate(line),
        to: `/knowledge/earth/lines/${line.id}`,
        accent: getKnowledgeEarthLineColor(line),
        current: line.id === currentLineId,
      }))}
    />
  )
}
