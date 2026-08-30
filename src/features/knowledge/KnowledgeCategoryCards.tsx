import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type KnowledgeCategoryCardItem = {
  id: string
  title: string
  subtitle?: string
  meta?: string
  to: string
  accent?: string
  leading?: ReactNode
  testId?: string
  current?: boolean
}

export function KnowledgeCategoryCards({
  compact = false,
  items,
  label,
}: {
  compact?: boolean
  items: readonly KnowledgeCategoryCardItem[]
  label: string
}) {
  return (
    <nav
      className="geography-reference-list knowledge-earth-reference-grid knowledge-category-grid"
      aria-label={label}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minWidth: 0,
        gap: compact ? '0.4rem' : '0.55rem',
        margin: 0,
        overflowX: 'auto',
      }}
    >
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          data-testid={item.testId}
          aria-current={item.current ? 'page' : undefined}
          style={
            {
              '--knowledge-earth-line-color':
                item.accent ?? 'var(--atlas-accent)',
              display: 'grid',
              flex: compact ? '0 0 13rem' : '1 0 11rem',
              minWidth: compact ? '13rem' : '11rem',
              minHeight: compact ? '3.5rem' : '4.4rem',
              padding: compact ? '0.45rem 0.6rem' : '0.65rem 0.75rem',
              gridTemplateColumns: item.leading
                ? 'auto minmax(0, 1fr)'
                : 'minmax(0, 1fr)',
              columnGap: '0.55rem',
              alignItems: 'center',
            } as CSSProperties
          }
        >
          {item.leading}
          <span style={{ display: 'block', minWidth: 0 }}>
            <span
              style={{
                display: 'flex',
                minWidth: 0,
                gap: '0.45rem',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <strong>{item.title}</strong>
              {item.meta ? <small>{item.meta}</small> : null}
            </span>
            {item.subtitle ? (
              <small
                style={{
                  display: 'block',
                  marginTop: '0.18rem',
                  overflow: 'hidden',
                  color: 'var(--atlas-text-secondary)',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.subtitle}
              </small>
            ) : null}
          </span>
        </Link>
      ))}
    </nav>
  )
}
