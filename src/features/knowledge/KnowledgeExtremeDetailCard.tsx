import { Link } from 'react-router-dom'

import {
  getWorldExtremeExplorePath,
  getWorldExtremeSource,
} from '../../data/worldExtremes'
import type {
  WorldExtremeEntry,
  WorldExtremeMetric,
} from '../../data/worldExtremesSchema'
import { KnowledgeCardShell } from '../../shared/components/knowledge-card/KnowledgeCardShell'
import {
  formatWorldExtremeValue,
  getWorldExtremeRankColor,
} from './worldExtremePresentation'

type KnowledgeExtremeDetailCardProps = {
  metric: WorldExtremeMetric
  entry: WorldExtremeEntry
  onClose: () => void
}

export function KnowledgeExtremeDetailCard({
  metric,
  entry,
  onClose,
}: KnowledgeExtremeDetailCardProps) {
  const sources = entry.sourceIds.flatMap((sourceId) => {
    const source = getWorldExtremeSource(sourceId)
    return source ? [source] : []
  })
  const rankColor = getWorldExtremeRankColor(entry.rank)

  return (
    <KnowledgeCardShell
      label={`${entry.name.zh}世界之最详情`}
      closeLabel={`关闭${entry.name.zh}世界之最详情`}
      identity={`${metric.id}:${entry.id}`}
      accent={rankColor}
      className="world-extreme-detail-card"
      onClose={onClose}
      footer={
        <Link
          className="knowledge-card-action"
          to={getWorldExtremeExplorePath(entry)}
        >
          <span>在3D地球上查看</span>
          <small>定位{entry.name.zh}及其所在区域</small>
        </Link>
      }
    >
      <div className="waterbody-detail-heading world-extreme-detail-heading">
        <span
          className="world-extreme-rank-medal"
          aria-label={`第${entry.rank}名`}
          style={{
            display: 'grid',
            flex: '0 0 3rem',
            width: '3rem',
            height: '3rem',
            margin: 0,
            color: '#081216',
            background: rankColor,
            borderRadius: '50%',
            placeItems: 'center',
            fontSize: '1.35rem',
            fontWeight: 800,
          }}
        >
          {entry.rank}
        </span>
        <div>
          <p>{metric.name}</p>
          <h2>{entry.name.zh}</h2>
          <span>{entry.name.en}</span>
        </div>
      </div>

      <dl className="city-detail-facts" style={{ marginTop: '0.9rem' }}>
        <div>
          <dt>世界排名</dt>
          <dd>第 {entry.rank} 名</dd>
        </div>
        <div>
          <dt>{metric.note}</dt>
          <dd>{formatWorldExtremeValue(metric, entry)}</dd>
        </div>
        {entry.year ? (
          <div>
            <dt>数据年份</dt>
            <dd>{entry.year} 年</dd>
          </div>
        ) : null}
      </dl>

      <section className="country-detail-section geography-topic-content">
        <h3 className="country-detail-label">为什么是之最</h3>
        <p>{entry.summary}</p>
      </section>

      <section className="country-detail-section geography-topic-content">
        <h3 className="country-detail-label">如何测量</h3>
        <p>{metric.measurement}</p>
      </section>

      <section className="country-detail-section world-extreme-method-note">
        <h3 className="country-detail-label">统计口径</h3>
        <p>{metric.scopeNote}</p>
        {metric.dispute ? (
          <p
            className="is-disputed"
            style={{
              padding: '0.6rem 0.7rem',
              color: 'var(--atlas-warning)',
              background: 'rgb(216 184 111 / 8%)',
              borderLeft: '2px solid var(--atlas-warning)',
            }}
          >
            {metric.dispute}
          </p>
        ) : null}
      </section>

      <section className="country-detail-section">
        <h3 className="country-detail-label">学习要点</h3>
        <ol className="fun-fact-list">
          {entry.facts.map((fact, index) => (
            <li key={fact}>
              <span>{index + 1}</span>
              <p>{fact}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="country-detail-section world-extreme-sources">
        <details
          style={{
            border: '1px solid var(--atlas-border-soft)',
            borderRadius: 'var(--atlas-radius-compact)',
          }}
        >
          <summary
            style={{
              padding: '0.65rem 0.7rem',
              color: 'var(--atlas-text-secondary)',
              cursor: 'pointer',
            }}
          >
            资料来源（{sources.length}）
          </summary>
          <ul style={{ padding: '0 0.7rem 0.7rem', margin: 0 }}>
            {sources.map((source) => (
              <li key={source.id} style={{ marginTop: '0.5rem' }}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: rankColor, textDecoration: 'underline' }}
                >
                  {source.name}
                </a>
                <small style={{ display: 'block', marginTop: '0.12rem' }}>
                  {source.publisher}
                  {source.version
                    ? ` · ${source.version}`
                    : source.accessedAt
                      ? ` · 查阅于 ${source.accessedAt}`
                      : ''}
                </small>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </KnowledgeCardShell>
  )
}
