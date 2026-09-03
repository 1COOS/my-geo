import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

import { sceneOverlayRoles } from '../../types/sceneOverlay'

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
  cornerAction?: ReactNode
  footer?: ReactNode
}

export type KnowledgeCardShellProps = KnowledgeCardShellBaseProps

export function KnowledgeCardShell(props: KnowledgeCardShellProps) {
  const { label, identity, children, accent, className, cornerAction, footer } =
    props
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    if (typeof content.scrollTo === 'function') content.scrollTo({ top: 0 })
    else content.scrollTop = 0
  }, [identity])

  return (
    <aside
      className={`knowledge-card-shell country-detail detail-panel-enter${className ? ` ${className}` : ''}`}
      data-scene-overlay={sceneOverlayRoles.detail}
      aria-label={label}
      style={
        accent
          ? ({ '--knowledge-card-accent': accent } as CSSProperties)
          : undefined
      }
    >
      {cornerAction}
      <div ref={contentRef} className="knowledge-card-content">
        {children}
      </div>
      {footer ? (
        <footer className="knowledge-card-footer">{footer}</footer>
      ) : null}
    </aside>
  )
}
