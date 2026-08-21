import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

export type KnowledgeCardAction = {
  to: string
  label: string
  description: string
}

export type KnowledgeCardShellProps = {
  label: string
  closeLabel: string
  identity: string
  onClose: () => void
  children: ReactNode
  accent?: string
  className?: string
  footer?: ReactNode
}

export function KnowledgeCardShell({
  label,
  closeLabel,
  identity,
  onClose,
  children,
  accent,
  className,
  footer,
}: KnowledgeCardShellProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  }, [])

  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    if (typeof content.scrollTo === 'function') content.scrollTo({ top: 0 })
    else content.scrollTop = 0
  }, [identity])

  const closeCard = () => {
    const opener = openerRef.current
    onClose()
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    })
  }

  return (
    <aside
      className={`knowledge-card-shell country-detail detail-panel-enter${className ? ` ${className}` : ''}`}
      aria-label={label}
      style={
        accent
          ? ({ '--knowledge-card-accent': accent } as CSSProperties)
          : undefined
      }
    >
      <button
        type="button"
        className="country-detail-close"
        aria-label={closeLabel}
        onClick={closeCard}
      >
        ×
      </button>
      <div ref={contentRef} className="knowledge-card-content">
        {children}
      </div>
      {footer ? (
        <footer className="knowledge-card-footer">{footer}</footer>
      ) : null}
    </aside>
  )
}
