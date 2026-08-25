import { geographyTopics } from '../../data/geographyLearning'
import type { GeographyTopicId } from '../../data/geographyLearningSchema'

type GeographyTopicNavProps = {
  topicId: GeographyTopicId
  onSelectTopic: (topicId: GeographyTopicId) => void
  label?: string
}

export function GeographyTopicNav({
  topicId,
  onSelectTopic,
  label = '地球经纬线用途',
}: GeographyTopicNavProps) {
  return (
    <div
      className="knowledge-continent-tabs knowledge-earth-topic-tabs"
      role="tablist"
      aria-label={label}
    >
      {geographyTopics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          role="tab"
          aria-selected={topic.id === topicId}
          onClick={() => onSelectTopic(topic.id)}
        >
          <strong>{topic.shortName.zh}</strong>
        </button>
      ))}
    </div>
  )
}

export function GeographyReferenceDiagram({
  caption = '重要纬线与东西半球界线示意',
  compact = false,
  showCaption = true,
}: {
  caption?: string
  compact?: boolean
  showCaption?: boolean
} = {}) {
  const height = compact ? 120 : 180
  const latitudeY = compact
    ? {
        northPolar: 12,
        northTropic: 36,
        equator: 60,
        southTropic: 84,
        southPolar: 108,
      }
    : {
        northPolar: 23.5,
        northTropic: 66.5,
        equator: 90,
        southTropic: 113.5,
        southPolar: 156.5,
      }
  const gridY = compact ? [20, 40, 60, 80, 100] : [30, 60, 90, 120, 150]

  return (
    <figure className="geography-reference-diagram" aria-label={caption}>
      <svg
        viewBox={`0 0 360 ${height}`}
        role="img"
        aria-label="地球重要经纬线示意图"
      >
        <rect width="360" height={height} rx="12" />
        <g className="is-grid">
          {[60, 120, 180, 240, 300].map((x) => (
            <line key={`x-${x}`} x1={x} x2={x} y1="0" y2={height} />
          ))}
          {gridY.map((y) => (
            <line key={`y-${y}`} x1="0" x2="360" y1={y} y2={y} />
          ))}
        </g>
        <g className="is-equator">
          <line x1="0" x2="360" y1={latitudeY.equator} y2={latitudeY.equator} />
        </g>
        <g className="is-tropic">
          <line
            x1="0"
            x2="360"
            y1={latitudeY.northTropic}
            y2={latitudeY.northTropic}
          />
          <line
            x1="0"
            x2="360"
            y1={latitudeY.southTropic}
            y2={latitudeY.southTropic}
          />
        </g>
        <g className="is-polar">
          <line
            x1="0"
            x2="360"
            y1={latitudeY.northPolar}
            y2={latitudeY.northPolar}
          />
          <line
            x1="0"
            x2="360"
            y1={latitudeY.southPolar}
            y2={latitudeY.southPolar}
          />
        </g>
        <g className="is-hemisphere">
          <line x1="160" x2="160" y1="0" y2={height} />
          <line x1="340" x2="340" y1="0" y2={height} />
        </g>
        <g className="is-labels">
          <text x="8" y={latitudeY.equator - 5}>
            赤道
          </text>
          <text x="8" y={latitudeY.northTropic - 5}>
            北回归线
          </text>
          <text x="8" y={latitudeY.southTropic - 5}>
            南回归线
          </text>
          <text x="8" y={Math.max(latitudeY.northPolar - 5, 9)}>
            北极圈
          </text>
          <text x="8" y={Math.min(latitudeY.southPolar + 15, height - 5)}>
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
      {showCaption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
