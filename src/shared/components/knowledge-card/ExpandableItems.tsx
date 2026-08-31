import { useId, useState, type CSSProperties, type ReactNode } from 'react'

export type ExpandableItemsProps<T> = {
  items: T[]
  previewCount: number
  expandLabel: string
  renderItems: (items: T[]) => ReactNode
  compactCount?: boolean
}

const compactToggleStyle = {
  width: 'auto',
  minHeight: '1.5rem',
  padding: '0.08rem 0.3rem',
  marginTop: '0.22rem',
  justifyContent: 'flex-start',
  borderRadius: '0.2rem',
} satisfies CSSProperties

export function ExpandableItems<T>({
  items,
  previewCount,
  expandLabel,
  renderItems,
  compactCount = false,
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
          style={compactCount ? compactToggleStyle : undefined}
          onClick={() => setExpanded((current) => !current)}
        >
          <span>
            {expanded
              ? '收起'
              : compactCount
                ? `+${items.length - previewCount}`
                : `查看全部（${items.length}）`}
          </span>
          {compactCount ? null : <span aria-hidden="true">⌄</span>}
        </button>
      ) : null}
    </div>
  )
}
