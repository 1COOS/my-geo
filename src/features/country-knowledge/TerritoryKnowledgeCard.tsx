import { useId, useState, type CSSProperties } from 'react'

import { countriesByCode } from '../../data/countries'
import { territoryTypeLabels } from '../../data/territories'
import type { Territory } from '../../data/territorySchema'
import { KnowledgeCardShell } from '../../shared/components/knowledge-card/KnowledgeCardShell'

type TerritoryKnowledgeCardProps = {
  territory: Territory
  onSelectCountry: (countryCode: string) => void
}

const areaFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
})
const populationFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const headingStyle = {
  display: 'grid',
  padding: '0.35rem 0 0.55rem',
  gridTemplateColumns: '3.8rem minmax(0, 1fr)',
  gap: '0.85rem',
  alignItems: 'center',
} satisfies CSSProperties
const symbolStyle = {
  display: 'grid',
  width: '3.8rem',
  height: '3.8rem',
  placeItems: 'center',
  color: '#83ecff',
  fontSize: '2rem',
  background: 'rgb(23 101 147 / 32%)',
  border: '1px solid #6cb4d4',
  borderRadius: '50%',
} satisfies CSSProperties
const titleStyle = { margin: 0 } satisfies CSSProperties
const metaStyle = {
  display: 'block',
  margin: '0.12rem 0 0',
  color: 'var(--atlas-text-secondary)',
} satisfies CSSProperties
const factsStyle = {
  display: 'grid',
  margin: '0.35rem 0 0.7rem',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1px',
  overflow: 'hidden',
  background: 'var(--atlas-border-soft)',
  border: '1px solid var(--atlas-border-soft)',
  borderRadius: 'var(--atlas-radius-compact)',
} satisfies CSSProperties
const factStyle = {
  minWidth: 0,
  padding: '0.5rem 0.65rem',
  background: 'var(--atlas-panel)',
} satisfies CSSProperties
const factLabelStyle = {
  color: 'var(--atlas-text-muted)',
  fontSize: 'var(--fs-s)',
} satisfies CSSProperties
const factValueStyle = {
  margin: '0.12rem 0 0',
  overflowWrap: 'anywhere',
  fontWeight: 650,
} satisfies CSSProperties
const countryLinkStyle = {
  width: '100%',
  minHeight: '2.5rem',
  padding: '0.45rem 0.65rem',
  color: 'var(--atlas-accent)',
  textAlign: 'left',
  background: 'var(--atlas-panel-muted)',
  border: '1px solid var(--atlas-border-soft)',
  borderRadius: 'var(--atlas-radius-control)',
} satisfies CSSProperties
const chapterHeadingStyle = { margin: 0 } satisfies CSSProperties
const chapterTriggerStyle = {
  display: 'grid',
  width: '100%',
  minHeight: '2.75rem',
  padding: '0.45rem var(--country-card-key-inset)',
  gridTemplateColumns: '1.05rem minmax(0, 1fr) 1.05rem',
  gap: 'var(--country-card-key-gap)',
  alignItems: 'center',
  color: 'var(--atlas-text)',
  textAlign: 'left',
  background: 'transparent',
  border: '1px solid var(--atlas-border)',
  borderRadius: 'var(--atlas-radius-compact)',
} satisfies CSSProperties
const chapterCopyStyle = {
  display: 'flex',
  minWidth: 0,
  gap: '0.35rem',
  alignItems: 'baseline',
} satisfies CSSProperties
const chapterTitleStyle = {
  minWidth: '4.25rem',
  fontSize: 'var(--fs-s)',
} satisfies CSSProperties
const chapterSummaryStyle = {
  minWidth: 0,
  overflow: 'hidden',
  color: 'var(--atlas-text-secondary)',
  fontWeight: 400,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} satisfies CSSProperties
const chapterContentStyle = {
  padding: '0.35rem var(--country-card-key-inset) 0.15rem',
  color: 'var(--atlas-text-secondary)',
} satisfies CSSProperties
const chapterListStyle = {
  paddingLeft: '1.15rem',
  margin: '0.2rem 0 0.45rem',
} satisfies CSSProperties

type TerritoryChapterId =
  'relationship' | 'geography' | 'people' | 'economy' | 'places'

export function TerritoryKnowledgeCard({
  territory,
  onSelectCountry,
}: TerritoryKnowledgeCardProps) {
  const administeringCountry = countriesByCode.get(
    territory.administeringCountryCode,
  )
  const [openChapter, setOpenChapter] = useState<TerritoryChapterId | null>(
    null,
  )
  const contentPrefix = useId()
  const chapters = [
    {
      id: 'relationship' as const,
      title: '行政关系',
      summary: territory.relationSummary,
      items: [
        `${territoryTypeLabels[territory.type]}：${territory.relationSummary}`,
        `相关国家：${administeringCountry?.name.zh ?? territory.administeringCountryCode}`,
      ],
    },
    {
      id: 'geography' as const,
      title: '自然地理',
      summary: territory.geography.summary,
      items: territory.geography.items,
    },
    {
      id: 'people' as const,
      title: '居民文化',
      summary: territory.people.summary,
      items: territory.people.items,
    },
    {
      id: 'economy' as const,
      title: '经济产业',
      summary: territory.economy.summary,
      items: territory.economy.items,
    },
    {
      id: 'places' as const,
      title: '聚落景观',
      summary: `${territory.settlements[0]?.zh} · ${territory.landmarks[0]?.zh}`,
      items: [
        `主要聚落：${territory.settlements.map((item) => `${item.zh} ${item.en}`).join('、')}`,
        `代表景观：${territory.landmarks.map((item) => `${item.zh} ${item.en}`).join('、')}`,
      ],
    },
  ]

  return (
    <KnowledgeCardShell
      label={`${territory.name.zh}地区知识卡`}
      identity={`${territory.id}:territory`}
      className="country-knowledge-card territory-knowledge-card"
    >
      <header className="territory-card-heading" style={headingStyle}>
        <span
          className="territory-card-symbol"
          style={symbolStyle}
          aria-hidden="true"
        >
          ◇
        </span>
        <div>
          <h2 style={titleStyle}>{territory.name.zh}</h2>
          <p style={metaStyle}>
            {territory.name.en} · {territory.code}
          </p>
          <small style={metaStyle}>
            {territory.continent.zh} · {territory.subregion.zh} ·{' '}
            {territoryTypeLabels[territory.type]}
          </small>
        </div>
      </header>

      <dl className="territory-card-facts" style={factsStyle}>
        <TerritoryFact
          label="人口"
          value={`${populationFormatter.format(territory.population)}人`}
        />
        <TerritoryFact
          label="面积"
          value={`${areaFormatter.format(territory.areaSquareKilometers)} km²`}
        />
        <TerritoryFact
          label="行政中心"
          value={`${territory.administrativeCenter.zh} / ${territory.administrativeCenter.en}`}
        />
        <TerritoryFact
          label="货币"
          value={`${territory.currency.name.zh} ${territory.currency.code} ${territory.currency.symbol}`}
        />
      </dl>

      {administeringCountry ? (
        <button
          type="button"
          className="territory-country-link"
          style={countryLinkStyle}
          onClick={() => onSelectCountry(administeringCountry.code)}
        >
          返回相关国家：{administeringCountry.name.zh}
        </button>
      ) : null}

      <div className="knowledge-country-sections territory-card-sections">
        {chapters.map((chapter) => {
          const expanded = chapter.id === openChapter
          const contentId = `${contentPrefix}-${chapter.id}`
          return (
            <section
              key={chapter.id}
              className={`knowledge-country-chapter is-${chapter.id}`}
            >
              <h3 style={chapterHeadingStyle}>
                <button
                  type="button"
                  className="knowledge-country-chapter-trigger"
                  style={chapterTriggerStyle}
                  aria-expanded={expanded}
                  aria-controls={contentId}
                  onClick={() => setOpenChapter(expanded ? null : chapter.id)}
                >
                  <span
                    className="territory-chapter-icon"
                    style={{ color: '#83ecff' }}
                    aria-hidden="true"
                  >
                    ◇
                  </span>
                  <span
                    className="knowledge-country-chapter-copy"
                    style={chapterCopyStyle}
                  >
                    <strong style={chapterTitleStyle}>{chapter.title}</strong>
                    <small style={chapterSummaryStyle}>{chapter.summary}</small>
                  </span>
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
              </h3>
              {expanded ? (
                <div
                  id={contentId}
                  className="knowledge-country-chapter-content"
                  style={chapterContentStyle}
                >
                  <ul
                    className="territory-chapter-list"
                    style={chapterListStyle}
                  >
                    {chapter.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </KnowledgeCardShell>
  )
}

function TerritoryFact({ label, value }: { label: string; value: string }) {
  return (
    <div style={factStyle}>
      <dt style={factLabelStyle}>{label}</dt>
      <dd style={factValueStyle}>{value}</dd>
    </div>
  )
}
