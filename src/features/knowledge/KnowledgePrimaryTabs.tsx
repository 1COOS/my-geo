import { Link } from 'react-router-dom'

export type KnowledgePrimaryTabItem = {
  id: string
  label: string
  secondary?: string
}

export function KnowledgePrimaryTabs({
  activeId,
  compact = false,
  getTo,
  items,
  label,
  onSelect,
}: {
  activeId: string
  compact?: boolean
  getTo?: (item: KnowledgePrimaryTabItem) => string
  items: readonly KnowledgePrimaryTabItem[]
  label: string
  onSelect?: (id: string) => void
}) {
  return (
    <div
      className="knowledge-continent-tabs knowledge-primary-tabs"
      data-compact-tabs={compact ? 'true' : 'false'}
      role="tablist"
      aria-label={label}
    >
      {items.map((item) => {
        const active = item.id === activeId
        const content = (
          <>
            <strong>{item.label}</strong>
            {item.secondary ? <span>{item.secondary}</span> : null}
          </>
        )
        return getTo ? (
          <Link
            key={item.id}
            role="tab"
            aria-selected={active}
            to={getTo(item)}
          >
            {content}
          </Link>
        ) : (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect?.(item.id)}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
