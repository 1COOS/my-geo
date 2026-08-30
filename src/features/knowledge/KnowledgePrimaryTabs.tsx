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
      role="tablist"
      aria-label={label}
      style={{
        width: '100%',
        height: '100%',
        padding: 0,
        margin: 0,
        gap: compact ? '0.75rem' : '1.4rem',
      }}
    >
      {items.map((item) => {
        const active = item.id === activeId
        const content = (
          <>
            <strong>{item.label}</strong>
            {item.secondary ? <span>{item.secondary}</span> : null}
          </>
        )
        const style = {
          flex: '0 0 auto',
          minWidth: 'max-content',
          minHeight: '100%',
          padding: compact ? '0.35rem 0.45rem' : '0.55rem 0.6rem 0.7rem',
          justifyContent: 'flex-start',
        } as const

        return getTo ? (
          <Link
            key={item.id}
            role="tab"
            aria-selected={active}
            to={getTo(item)}
            style={style}
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
            style={style}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
