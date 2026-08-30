import { useEffect, useRef, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import {
  DEFAULT_WORLD_EXTREME_CATEGORY_ID,
  getWorldExtremeCategory,
  getWorldExtremeEntry,
  getWorldExtremeMetric,
  getWorldExtremeMetricsForCategory,
  worldExtremeCategories,
} from '../../data/worldExtremes'
import type {
  WorldExtremeCategory,
  WorldExtremeEntry,
  WorldExtremeMetric,
} from '../../data/worldExtremesSchema'
import { KnowledgeCategoryCards } from './KnowledgeCategoryCards'
import { KnowledgeExtremeDetailCard } from './KnowledgeExtremeDetailCard'
import { KnowledgeExtremeMetricOverviewCard } from './KnowledgeExtremeMetricOverviewCard'
import { KnowledgeExtremesCategoryMap } from './KnowledgeExtremesCategoryMap'
import { KnowledgeExtremesMap } from './KnowledgeExtremesMap'
import { KnowledgeMapWorkbenchPage } from './KnowledgeMapWorkbench'
import { KnowledgePrimaryTabs } from './KnowledgePrimaryTabs'
import {
  formatWorldExtremeValue,
  getWorldExtremeMetricColor,
  getWorldExtremeRankColor,
} from './worldExtremePresentation'

function getExtremeOverviewPath(categoryId: string) {
  return `/knowledge/extremes?category=${categoryId}`
}

function getExtremeMetricPath(metricId: string, entryId?: string) {
  return `/knowledge/extremes/metrics/${metricId}${entryId ? `?entry=${entryId}` : ''}`
}

function useCompactLandscape() {
  const [compact, setCompact] = useState(
    () => window.matchMedia('(max-height: 520px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-height: 520px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return compact
}

export function KnowledgeExtremesPage() {
  const { metricId, legacyMetricId, legacyEntryId } = useParams()

  if (legacyMetricId) {
    const legacyMetric = getWorldExtremeMetric(legacyMetricId)
    const legacyEntry = getWorldExtremeEntry(legacyMetricId, legacyEntryId)
    return (
      <Navigate
        to={
          legacyMetric
            ? getExtremeMetricPath(legacyMetric.id, legacyEntry?.id)
            : getExtremeOverviewPath(DEFAULT_WORLD_EXTREME_CATEGORY_ID)
        }
        replace
      />
    )
  }

  return metricId ? (
    <KnowledgeExtremeMetricPage metricId={metricId} />
  ) : (
    <KnowledgeExtremesOverviewPage />
  )
}

function KnowledgeExtremesOverviewPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const legacyMetric = getWorldExtremeMetric(searchParams.get('metric'))

  if (legacyMetric) {
    return <Navigate to={getExtremeMetricPath(legacyMetric.id)} replace />
  }

  const category =
    getWorldExtremeCategory(searchParams.get('category')) ??
    getWorldExtremeCategory(DEFAULT_WORLD_EXTREME_CATEGORY_ID)!
  const canonicalSearch = new URLSearchParams({
    category: category.id,
  }).toString()
  if (searchParams.toString() !== canonicalSearch) {
    return <Navigate to={`${location.pathname}?${canonicalSearch}`} replace />
  }

  const metrics = getWorldExtremeMetricsForCategory(category.id)

  return (
    <KnowledgeMapWorkbenchPage
      label="世界之最知识"
      title="世界之最"
      renderControls={(compact) => (
        <KnowledgePrimaryTabs
          activeId={category.id}
          compact={compact}
          getTo={(item) => getExtremeOverviewPath(item.id)}
          items={worldExtremeCategories.map((item) => ({
            id: item.id,
            label: item.name,
          }))}
          label="世界之最类别"
        />
      )}
      renderMap={(compact) => (
        <KnowledgeExtremesCategoryMap
          category={category}
          compact={compact}
          metrics={metrics}
          onSelectChampion={(nextMetricId, entryId) =>
            void navigate(getExtremeMetricPath(nextMetricId, entryId))
          }
        />
      )}
      renderResults={(compact) => (
        <ExtremeMetricCards
          category={category}
          compact={compact}
          metrics={metrics}
        />
      )}
    />
  )
}

function KnowledgeExtremeMetricPage({ metricId }: { metricId: string }) {
  const shellRef = useRef<HTMLElement>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const compact = useCompactLandscape()
  const metric = getWorldExtremeMetric(metricId)
  const entryParam = searchParams.get('entry')

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    if (typeof shell.scrollTo === 'function') shell.scrollTo({ top: 0 })
    else shell.scrollTop = 0
  }, [metric?.id, entryParam])

  if (!metric) {
    return (
      <Navigate
        to={getExtremeOverviewPath(DEFAULT_WORLD_EXTREME_CATEGORY_ID)}
        replace
      />
    )
  }

  const category = getWorldExtremeCategory(metric.categoryId)!
  const metrics = getWorldExtremeMetricsForCategory(category.id)
  const entry = getWorldExtremeEntry(metric.id, entryParam)
  if (entryParam && !entry) {
    return <Navigate to={getExtremeMetricPath(metric.id)} replace />
  }
  if (searchParams.toString() !== (entry ? `entry=${entry.id}` : '')) {
    return <Navigate to={getExtremeMetricPath(metric.id, entry?.id)} replace />
  }

  return (
    <main
      ref={shellRef}
      className="knowledge-shell knowledge-region-shell has-country-selection knowledge-earth-detail-shell world-extremes-detail-shell"
      data-compact-workbench={compact ? 'true' : 'false'}
      style={{
        overflowY: 'hidden',
        paddingBottom: compact ? '0.45rem' : '0.75rem',
      }}
    >
      <div
        className="knowledge-region-content knowledge-earth-detail-content"
        style={{ height: '100%', minHeight: 0 }}
      >
        <section
          className="knowledge-earth-detail-study"
          aria-label={`${metric.name}地图与排名`}
          style={{
            display: 'grid',
            height: '100%',
            minHeight: 0,
            gridTemplateRows: compact
              ? '2.75rem minmax(0, 1fr) 3.25rem 3.5rem'
              : '2.75rem minmax(0, 1fr) 4.4rem 4.4rem',
            gap: compact ? '0.4rem' : '0.5rem',
          }}
        >
          <header className="knowledge-region-page-header">
            <Link
              className="knowledge-earth-detail-back"
              to={getExtremeOverviewPath(category.id)}
            >
              ← 返回{category.name}
            </Link>
            <h1>{metric.name}</h1>
          </header>
          <div
            style={{
              display: 'flex',
              minWidth: 0,
              minHeight: 0,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KnowledgeExtremesMap
              metricId={metric.id}
              metricName={metric.name}
              entries={metric.entries}
              selectedEntryId={entry?.id}
              workbench
              compact={compact}
              onSelectEntry={(nextEntry) =>
                void navigate(getExtremeMetricPath(metric.id, nextEntry.id))
              }
            />
          </div>
          <ExtremeMetricCards
            category={category}
            compact={compact}
            currentMetricId={metric.id}
            metrics={metrics}
          />
          <ExtremeEntryCards
            compact={compact}
            currentEntryId={entry?.id}
            metric={metric}
          />
        </section>
      </div>

      {entry ? (
        <KnowledgeExtremeDetailCard
          metric={metric}
          entry={entry}
          onClose={() => void navigate(getExtremeMetricPath(metric.id))}
        />
      ) : (
        <KnowledgeExtremeMetricOverviewCard
          accent={getWorldExtremeMetricColor(metric.id)}
          metric={metric}
        />
      )}
    </main>
  )
}

function ExtremeMetricCards({
  category,
  compact,
  currentMetricId,
  metrics,
}: {
  category: WorldExtremeCategory
  compact: boolean
  currentMetricId?: string
  metrics: readonly WorldExtremeMetric[]
}) {
  return (
    <KnowledgeCategoryCards
      compact={compact}
      label={`${category.name}指标`}
      items={metrics.map((metric) => ({
        id: metric.id,
        title: metric.name,
        subtitle: metric.entries[0].name.zh,
        meta: formatWorldExtremeValue(metric, metric.entries[0]),
        to: getExtremeMetricPath(metric.id),
        accent: getWorldExtremeMetricColor(metric.id),
        current: metric.id === currentMetricId,
        testId: `world-extreme-metric-${metric.id}`,
      }))}
    />
  )
}

function ExtremeEntryCards({
  compact,
  currentEntryId,
  metric,
}: {
  compact: boolean
  currentEntryId?: string
  metric: WorldExtremeMetric
}) {
  return (
    <KnowledgeCategoryCards
      compact={compact}
      label={`${metric.name}前三名`}
      items={metric.entries.map((entry) => ({
        id: entry.id,
        title: entry.name.zh,
        subtitle: entry.name.en,
        meta: formatWorldExtremeValue(metric, entry),
        to: getExtremeMetricPath(metric.id, entry.id),
        accent: getWorldExtremeRankColor(entry.rank),
        current: entry.id === currentEntryId,
        testId: `world-extreme-entry-${entry.id}`,
        leading: <RankBadge entry={entry} compact={compact} />,
      }))}
    />
  )
}

function RankBadge({
  compact,
  entry,
}: {
  compact: boolean
  entry: WorldExtremeEntry
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        width: compact ? '1.25rem' : '1.45rem',
        height: compact ? '1.25rem' : '1.45rem',
        color: '#071319',
        background: getWorldExtremeRankColor(entry.rank),
        borderRadius: '50%',
        placeItems: 'center',
        fontSize: '0.75rem',
        fontWeight: 800,
      }}
    >
      {entry.rank}
    </span>
  )
}
