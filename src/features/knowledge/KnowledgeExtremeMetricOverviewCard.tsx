import type { WorldExtremeMetric } from '../../data/worldExtremesSchema'
import { KnowledgeCardShell } from '../../shared/components/knowledge-card/KnowledgeCardShell'
import { formatWorldExtremeValue } from './worldExtremePresentation'

export function KnowledgeExtremeMetricOverviewCard({
  accent,
  metric,
}: {
  accent: string
  metric: WorldExtremeMetric
}) {
  return (
    <KnowledgeCardShell
      label={`${metric.name}指标知识`}
      identity={`extreme-metric:${metric.id}`}
      accent={accent}
      className="knowledge-region-overview-card"
    >
      <header className="knowledge-region-overview-heading">
        <p>世界之最 · 指标知识</p>
        <h2>{metric.name}</h2>
        <span>{metric.note}</span>
      </header>

      <p className="knowledge-region-overview-lead">{metric.measurement}</p>

      <section className="country-detail-section knowledge-region-overview-summary">
        <h3 className="country-detail-label">世界前三</h3>
        <p>
          <strong>3</strong>
          <span>个对象</span>
        </p>
        <ul aria-label={`${metric.name}前三名单`}>
          {metric.entries.map((entry) => (
            <li key={entry.id}>
              {entry.rank}. {entry.name.zh} ·{' '}
              {formatWorldExtremeValue(metric, entry)}
            </li>
          ))}
        </ul>
      </section>

      <section className="country-detail-section">
        <h3 className="country-detail-label">统计口径</h3>
        <p>{metric.scopeNote}</p>
      </section>
      {metric.dispute ? (
        <section className="country-detail-section">
          <h3 className="country-detail-label">口径争议</h3>
          <p>{metric.dispute}</p>
        </section>
      ) : null}
    </KnowledgeCardShell>
  )
}
