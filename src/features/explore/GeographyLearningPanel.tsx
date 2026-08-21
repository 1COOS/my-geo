import {
  formatReferenceLineCoordinate,
  geographyLearningOverview,
  geographyTopics,
  getGeographyTopic,
  getGeographyTopicReferenceLines,
  getReferenceLine,
  type GeographyExploreSelection,
} from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import { classifyGeoPosition } from '../../shared/lib/geoClassification'
import type { GeoPosition } from '../../shared/types/geo'
import {
  GeographyReferenceDiagram,
  GeographyTopicNav,
} from '../geography-learning/GeographyLearningContent'
import { DetailPanelShell } from './DetailPanelShell'

type GeographyLearningPanelProps = {
  selection: GeographyExploreSelection
  viewCenter: GeoPosition
  onSelectLine: (referenceLineId: ReferenceLineId) => void
  onShowOverview: (focusTopicId?: GeographyTopicId | null) => void
  onClose: () => void
}

function GeographyOverviewCard({
  focusTopicId,
  viewCenter,
  onSelectLine,
  onSelectTopic,
}: {
  focusTopicId: GeographyTopicId | null
  viewCenter: GeoPosition
  onSelectLine: (referenceLineId: ReferenceLineId) => void
  onSelectTopic: (topicId: GeographyTopicId) => void
}) {
  const classification = classifyGeoPosition(viewCenter)
  const topicId = focusTopicId ?? geographyTopics[0].id
  const topic = getGeographyTopic(topicId)!
  const topicLines = getGeographyTopicReferenceLines(topicId)

  return (
    <>
      <section className="geography-current-reading" aria-label="当前中心判读">
        <div>
          <span>{geographyLearningOverview.currentViewLabel}</span>
          <strong>{classification.formattedCoordinate}</strong>
        </div>
        <ul>
          <li>{classification.latitudeHemisphere}</li>
          <li>{classification.longitudeHemisphere}</li>
          <li>{classification.latitudeZone}</li>
          <li>{classification.earthZone}</li>
        </ul>
      </section>

      <GeographyReferenceDiagram
        caption={geographyLearningOverview.diagramCaption}
        compact
        showCaption={false}
      />

      <GeographyTopicNav
        label="地球经纬线用途"
        topicId={topicId}
        onSelectTopic={onSelectTopic}
      />

      <section
        className="country-detail-section"
        aria-label={`${topic.name.zh}重点线`}
      >
        <p className="country-detail-label">{topicLines.length}条重点线</p>
        <div className="geography-reference-list">
          {topicLines.map((line) => (
            <button
              key={line.id}
              type="button"
              onClick={() => onSelectLine(line.id)}
            >
              <strong>{line.name.zh}</strong>
              <small>{formatReferenceLineCoordinate(line)}</small>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function GeographyLineCard({
  referenceLineId,
  onSelectLine,
  onShowOverview,
}: {
  referenceLineId: ReferenceLineId
  onSelectLine: (referenceLineId: ReferenceLineId) => void
  onShowOverview: (focusTopicId: GeographyTopicId) => void
}) {
  const line = getReferenceLine(referenceLineId)!
  const topic = getGeographyTopic(line.topicId)!
  const relatedLines = getGeographyTopicReferenceLines(topic.id).filter(
    (item) => item.id !== line.id,
  )

  return (
    <>
      <button
        className="climate-overview-link"
        type="button"
        onClick={() => onShowOverview(topic.id)}
      >
        返回地球经纬线
      </button>

      <dl className="climate-fact-grid">
        <div>
          <dt>类型</dt>
          <dd>{line.orientation === 'latitude' ? '纬线' : '经线'}</dd>
        </div>
        <div>
          <dt>坐标</dt>
          <dd>{formatReferenceLineCoordinate(line)}</dd>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <dt>用途</dt>
          <dd>{topic.name.zh}</dd>
        </div>
      </dl>

      <section className="country-detail-section geography-topic-content">
        <p className="country-detail-label">这条线的作用</p>
        <p>{line.explanation}</p>
      </section>

      <section className="country-detail-section geography-topic-content">
        <p className="country-detail-label">判读规则</p>
        <ol>
          {topic.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      {relatedLines.length > 0 ? (
        <section className="country-detail-section">
          <p className="country-detail-label">相关经纬线</p>
          <div className="geography-reference-list">
            {relatedLines.map((relatedLine) => (
              <button
                key={relatedLine.id}
                type="button"
                onClick={() => onSelectLine(relatedLine.id)}
              >
                <strong>{relatedLine.name.zh}</strong>
                <small>{formatReferenceLineCoordinate(relatedLine)}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}

export function GeographyLearningPanel({
  selection,
  viewCenter,
  onSelectLine,
  onShowOverview,
  onClose,
}: GeographyLearningPanelProps) {
  const line =
    selection.kind === 'line'
      ? getReferenceLine(selection.referenceLineId)
      : null
  const lineTopic = line ? getGeographyTopic(line.topicId) : null

  return (
    <DetailPanelShell
      label="地球经纬线知识卡"
      closeLabel="关闭地球经纬线知识卡"
      identity={
        selection.kind === 'line'
          ? `geography-line-${selection.referenceLineId}`
          : `geography-overview-${selection.focusTopicId ?? 'all'}`
      }
      accent="#d291ff"
      onClose={onClose}
    >
      <div className="geography-learning-heading">
        <div className="geography-learning-orbit" aria-hidden="true">
          <span />
        </div>
        <div>
          <p>
            {lineTopic
              ? `${geographyLearningOverview.name.zh} · ${lineTopic.name.zh}`
              : geographyLearningOverview.eyebrow}
          </p>
          <h2>{line?.name.zh ?? geographyLearningOverview.name.zh}</h2>
          <span>{line?.name.en ?? geographyLearningOverview.name.en}</span>
        </div>
      </div>

      {selection.kind === 'line' ? (
        <GeographyLineCard
          referenceLineId={selection.referenceLineId}
          onSelectLine={onSelectLine}
          onShowOverview={onShowOverview}
        />
      ) : (
        <GeographyOverviewCard
          focusTopicId={selection.focusTopicId}
          viewCenter={viewCenter}
          onSelectLine={onSelectLine}
          onSelectTopic={onShowOverview}
        />
      )}
    </DetailPanelShell>
  )
}
