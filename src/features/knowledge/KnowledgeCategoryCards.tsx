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
      data-compact-cards={compact ? 'true' : 'false'}
    >
      {items.map((item) => (
        <Link
          key={item.id}
          className="knowledge-category-card"
          to={item.to}
          data-testid={item.testId}
          data-has-leading={item.leading ? 'true' : 'false'}
          aria-label={[item.title, item.meta, item.subtitle]
            .filter(Boolean)
            .join(' ')}
          aria-current={item.current ? 'page' : undefined}
          style={
            {
              '--knowledge-earth-line-color':
                item.accent ?? 'var(--atlas-accent)',
            } as CSSProperties
          }
        >
          {item.leading}
          <span className="knowledge-category-card-copy">
            <span className="knowledge-category-card-heading">
              <strong>{item.title}</strong>
              {item.meta ? <small>{item.meta}</small> : null}
            </span>
            {item.subtitle ? (
              <small className="knowledge-category-card-subtitle">
                {item.subtitle}
              </small>
            ) : null}
          </span>
        </Link>
      ))}
    </nav>
  )
}
