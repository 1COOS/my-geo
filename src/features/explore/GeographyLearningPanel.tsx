import {
  geographyReferenceLines,
  geographyTopics,
  getGeographyTopic,
  getReferenceLine,
} from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../../data/geographyLearningSchema'
import { classifyGeoPosition } from '../../shared/lib/geoClassification'
import type { GeoPosition } from '../../shared/types/geo'
import { DetailPanelShell } from './DetailPanelShell'

type GeographyLearningPanelProps = {
  topicId: GeographyTopicId
  referenceLineId: ReferenceLineId | null
  viewCenter: GeoPosition
  onSelectTopic: (
    topicId: GeographyTopicId,
    referenceLineId?: ReferenceLineId | null,
  ) => void
  onClose: () => void
}

const topicShortLabels: Record<GeographyTopicId, string> = {
  'grid-reading': '经纬判读',
  hemispheres: '半球',
  'latitude-zones': '纬度分区',
  'earth-zones': '地球五带',
}

export function GeographyLearningPanel({
  topicId,
  referenceLineId,
  viewCenter,
  onSelectTopic,
  onClose,
}: GeographyLearningPanelProps) {
  const topic = getGeographyTopic(topicId)!
  const referenceLine = getReferenceLine(referenceLineId)
  const classification = classifyGeoPosition(viewCenter)
  const topicLines = geographyReferenceLines.filter(
    (line) => line.topicId === topicId,
  )

  return (
    <DetailPanelShell
      label="经纬网知识卡"
      closeLabel="关闭经纬网知识卡"
      identity={`${topicId}:${referenceLineId ?? 'overview'}`}
      onClose={onClose}
    >
      <div className="geography-learning-heading">
        <div className="geography-learning-orbit" aria-hidden="true">
          <span />
        </div>
        <div>
          <p>经纬网 · 初中地理</p>
          <h2>{topic.name.zh}</h2>
          <span>{topic.name.en}</span>
        </div>
      </div>

      <nav className="geography-topic-nav" aria-label="经纬网知识章节">
        {geographyTopics.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === topicId ? 'is-active' : undefined}
            aria-current={item.id === topicId ? 'page' : undefined}
            onClick={() => onSelectTopic(item.id, null)}
          >
            {topicShortLabels[item.id]}
          </button>
        ))}
      </nav>

      <section className="geography-current-reading" aria-label="当前中心判读">
        <div>
          <span>当前视角中心</span>
          <strong>{classification.formattedCoordinate}</strong>
        </div>
        <ul>
          <li>{classification.latitudeHemisphere}</li>
          <li>{classification.longitudeHemisphere}</li>
          <li>{classification.latitudeZone}</li>
          <li>{classification.earthZone}</li>
        </ul>
      </section>

      <GeographyReferenceDiagram />

      {referenceLine ? (
        <section className="geography-line-callout" aria-label="当前参考线">
          <span>{referenceLine.shortLabel}</span>
          <h3>{referenceLine.name.zh}</h3>
          <small>{referenceLine.name.en}</small>
          <p>{referenceLine.explanation}</p>
        </section>
      ) : null}

      <section className="country-detail-section geography-topic-content">
        <p className="country-detail-label">核心规则</p>
        <p>{topic.summary}</p>
        <ol>
          {topic.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      {topicLines.length > 0 ? (
        <section className="country-detail-section">
          <p className="country-detail-label">本章参考线</p>
          <div className="geography-reference-list">
            {topicLines.map((line) => (
              <button
                key={line.id}
                type="button"
                className={
                  line.id === referenceLineId ? 'is-active' : undefined
                }
                onClick={() => onSelectTopic(topicId, line.id)}
              >
                <strong>{line.shortLabel}</strong>
                <small>{line.name.en}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="country-detail-section geography-tip-grid">
        <div>
          <p className="country-detail-label">容易混淆</p>
          <ul>
            {topic.commonMistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="country-detail-label">判读示例</p>
          <ul>
            {topic.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      </section>
    </DetailPanelShell>
  )
}

function GeographyReferenceDiagram() {
  return (
    <figure className="geography-reference-diagram">
      <svg viewBox="0 0 360 180" role="img" aria-label="经纬网与重要纬线示意图">
        <rect width="360" height="180" rx="12" />
        <g className="is-grid">
          {[60, 120, 180, 240, 300].map((x) => (
            <line key={`x-${x}`} x1={x} x2={x} y1="0" y2="180" />
          ))}
          {[30, 60, 90, 120, 150].map((y) => (
            <line key={`y-${y}`} x1="0" x2="360" y1={y} y2={y} />
          ))}
        </g>
        <g className="is-equator">
          <line x1="0" x2="360" y1="90" y2="90" />
        </g>
        <g className="is-tropic">
          <line x1="0" x2="360" y1="66.5" y2="66.5" />
          <line x1="0" x2="360" y1="113.5" y2="113.5" />
        </g>
        <g className="is-polar">
          <line x1="0" x2="360" y1="23.5" y2="23.5" />
          <line x1="0" x2="360" y1="156.5" y2="156.5" />
        </g>
        <g className="is-hemisphere">
          <line x1="160" x2="160" y1="0" y2="180" />
          <line x1="340" x2="340" y1="0" y2="180" />
        </g>
        <g className="is-labels">
          <text x="8" y="85">
            赤道
          </text>
          <text x="8" y="61">
            北回归线
          </text>
          <text x="8" y="109">
            南回归线
          </text>
          <text x="8" y="18">
            北极圈
          </text>
          <text x="8" y="172">
            南极圈
          </text>
          <text x="164" y="16">
            20°W
          </text>
          <text x="306" y="16">
            160°E
          </text>
        </g>
      </svg>
      <figcaption>重要纬线与东西半球界线示意</figcaption>
    </figure>
  )
}
