import { useLayoutEffect, useRef } from 'react'
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
  const tabListRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const tabList = tabListRef.current
    const activeTab = tabList?.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]',
    )
    if (!tabList || !activeTab) return

    const visibleStart = tabList.scrollLeft
    const visibleEnd = visibleStart + tabList.clientWidth
    const activeStart = activeTab.offsetLeft
    const activeEnd = activeStart + activeTab.offsetWidth
    let nextScrollLeft = visibleStart

    if (activeStart < visibleStart) nextScrollLeft = activeStart
    else if (activeEnd > visibleEnd) {
      nextScrollLeft = activeEnd - tabList.clientWidth
    }

    if (nextScrollLeft === visibleStart) return
    if (typeof tabList.scrollTo === 'function') {
      tabList.scrollTo({ left: nextScrollLeft, behavior: 'auto' })
    } else {
      tabList.scrollLeft = nextScrollLeft
    }
  }, [activeId, items.length])

  return (
    <div
      ref={tabListRef}
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
