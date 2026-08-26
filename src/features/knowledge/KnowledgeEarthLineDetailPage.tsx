import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import {
  formatReferenceLineCoordinate,
  getGeographyTopic,
  getReferenceLine,
} from '../../data/geographyLearning'
import { KnowledgeCardShell } from '../../shared/components/knowledge-card/KnowledgeCardShell'
import { KnowledgeEarthMap } from './KnowledgeEarthMap'
import { KnowledgeEarthReferenceLinks } from './KnowledgeEarthReferenceLinks'
import { getKnowledgeEarthLineColor } from './knowledgeEarthLinePresentation'

export function KnowledgeEarthLineDetailPage() {
  const { lineId } = useParams()
  const navigate = useNavigate()
  const line = getReferenceLine(lineId)

  if (!line) return <Navigate to="/knowledge/earth" replace />

  const topic = getGeographyTopic(line.topicId)!
  const backTarget = `/knowledge/earth?topic=${topic.id}`
  const exploreTarget = `/explore?geography=${topic.id}&line=${line.id}`
  const lineColor = getKnowledgeEarthLineColor(line)

  return (
    <main className="knowledge-shell knowledge-region-shell has-country-selection knowledge-earth-detail-shell">
      <div className="knowledge-region-content knowledge-earth-detail-content">
        <section
          className="knowledge-earth-detail-study"
          aria-label={`${line.name.zh}经纬线地图`}
        >
          <Link className="knowledge-earth-detail-back" to={backTarget}>
            ← 返回{topic.shortName.zh}
          </Link>
          <KnowledgeEarthMap topicId={topic.id} />
          <KnowledgeEarthReferenceLinks
            topicId={topic.id}
            currentLineId={line.id}
            label={`${topic.name.zh}同组经纬线`}
          />
        </section>
      </div>

      <KnowledgeCardShell
        label={`${line.name.zh}经纬线详情`}
        closeLabel={`关闭${line.name.zh}经纬线详情`}
        identity={line.id}
        accent={lineColor}
        className="knowledge-earth-line-detail-card"
        onClose={() => void navigate(backTarget)}
        footer={
          <Link className="knowledge-card-action" to={exploreTarget}>
            <span>在3D地球上查看</span>
            <small>观察{line.name.zh}与同组经纬线</small>
          </Link>
        }
      >
        <div className="geography-learning-heading">
          <div className="geography-learning-orbit" aria-hidden="true">
            <span />
          </div>
          <div>
            <p>
              {topic.name.zh} ·{' '}
              {line.orientation === 'latitude' ? '纬线' : '经线'}
            </p>
            <h2>{line.name.zh}</h2>
            <span>{line.name.en}</span>
          </div>
        </div>

        <section className="geography-line-callout">
          <span>{formatReferenceLineCoordinate(line)}</span>
          <p>{line.explanation}</p>
        </section>

        <section className="country-detail-section geography-topic-content">
          <h3 className="country-detail-label">所属用途</h3>
          <p>{topic.summary}</p>
        </section>

        <section className="country-detail-section geography-topic-content">
          <h3 className="country-detail-label">核心规则</h3>
          <ol>
            {topic.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </section>

        <section className="country-detail-section geography-tip-grid">
          <h3 className="country-detail-label">容易混淆</h3>
          <ul>
            {topic.commonMistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </section>

        <section className="country-detail-section geography-tip-grid">
          <h3 className="country-detail-label">判读示例</h3>
          <ul>
            {topic.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </section>
      </KnowledgeCardShell>
    </main>
  )
}
