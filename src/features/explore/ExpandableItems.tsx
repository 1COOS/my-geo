import { useId, useState, type ReactNode } from 'react'

type ExpandableItemsProps<T> = {
  items: T[]
  previewCount: number
  expandLabel: string
  renderItems: (items: T[]) => ReactNode
}

export function ExpandableItems<T>({
  items,
  previewCount,
  expandLabel,
  renderItems,
}: ExpandableItemsProps<T>) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const canExpand = items.length > previewCount
  const visibleItems = expanded ? items : items.slice(0, previewCount)

  return (
    <div className="detail-expandable">
      <div id={contentId}>{renderItems(visibleItems)}</div>
      {canExpand ? (
        <button
          type="button"
          className="detail-expand-toggle"
          aria-controls={contentId}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `收起${expandLabel}`
              : `查看全部${expandLabel}（${items.length}）`
          }
          onClick={() => setExpanded((current) => !current)}
        >
          <span>{expanded ? '收起' : `查看全部（${items.length}）`}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      ) : null}
    </div>
  )
}
