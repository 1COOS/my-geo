import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

export type KnowledgeCardAction = {
  to: string
  label: string
  description: string
}

type KnowledgeCardShellBaseProps = {
  label: string
  identity: string
  children: ReactNode
  accent?: string
  className?: string
  footer?: ReactNode
}

type KnowledgeCardDismissalProps =
  | {
      closeLabel: string
      onClose: () => void
    }
  | {
      closeLabel?: never
      onClose?: never
    }

export type KnowledgeCardShellProps = KnowledgeCardShellBaseProps &
  KnowledgeCardDismissalProps

export function KnowledgeCardShell(props: KnowledgeCardShellProps) {
  const { label, identity, children, accent, className, footer } = props
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
    if (!props.onClose) return
    const opener = openerRef.current
    props.onClose()
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
      {props.onClose ? (
        <button
          type="button"
          className="country-detail-close"
          aria-label={props.closeLabel}
          onClick={closeCard}
        >
          ×
        </button>
      ) : null}
      <div ref={contentRef} className="knowledge-card-content">
        {children}
      </div>
      {footer ? (
        <footer className="knowledge-card-footer">{footer}</footer>
      ) : null}
    </aside>
  )
}
