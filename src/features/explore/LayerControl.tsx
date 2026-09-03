import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { sceneOverlayRoles } from '../../shared/types/sceneOverlay'

export type LayerControlItem = {
  id: string
  label: string
  className: string
  pressed: boolean
  ariaLabel?: string
  description?: string
  title?: string
  onToggle: () => void
}

export type LayerControlGroup = {
  id: string
  label: string
  items: readonly LayerControlItem[]
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.8 8 4.4-8 4.4-8-4.4z" />
      <path d="m4 12.1 8 4.4 8-4.4" />
      <path d="m4 16 8 4.4 8-4.4" />
    </svg>
  )
}

export function LayerControl({
  groups,
}: {
  groups: readonly LayerControlGroup[]
}) {
  const panelId = useId()
  const containerRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const activeCount = groups.reduce(
    (count, group) => count + group.items.filter((item) => item.pressed).length,
    0,
  )
  const closePanel = useCallback(() => {
    setOpen(false)
    queueMicrotask(() => triggerRef.current?.focus({ preventScroll: true }))
  }, [])

  useEffect(() => {
    if (!open) return

    const handleClick = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return
      closePanel()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closePanel()
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closePanel, open])

  return (
    <section
      ref={containerRef}
      className="layer-control"
      data-scene-overlay={sceneOverlayRoles.layers}
      aria-label="地球图层控制"
    >
      <button
        ref={triggerRef}
        type="button"
        className="layer-control-trigger"
        aria-label={`图层，已开启 ${activeCount} 项`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
      >
        <span className="layer-control-icon" aria-hidden="true">
          <LayersIcon />
        </span>
        <span>图层</span>
        <strong aria-hidden="true">{activeCount}</strong>
      </button>
      {open ? (
        <div
          id={panelId}
          className="layer-control-panel"
          role="region"
          aria-label="图层选择"
        >
          <div className="layer-control-groups">
            {groups.map((group) => (
              <section
                key={group.id}
                className="layer-control-group"
                aria-labelledby={`${panelId}-${group.id}`}
              >
                <h2 id={`${panelId}-${group.id}`}>{group.label}</h2>
                <div className="layer-control-options">
                  {group.items.map((item) => {
                    const descriptionId = item.description
                      ? `${panelId}-${item.id}-description`
                      : undefined
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`layer-toggle ${item.className}`}
                        aria-pressed={item.pressed}
                        aria-label={item.ariaLabel}
                        aria-describedby={descriptionId}
                        title={item.title}
                        onClick={item.onToggle}
                      >
                        <span className="layer-toggle-dot" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
      {groups.flatMap((group) =>
        group.items.flatMap((item) =>
          item.description ? (
            <span
              key={item.id}
              id={`${panelId}-${item.id}-description`}
              className="sr-only"
            >
              {item.description}
            </span>
          ) : (
            []
          ),
        ),
      )}
    </section>
  )
}
