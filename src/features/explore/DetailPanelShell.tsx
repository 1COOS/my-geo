import { useEffect, useRef, type ReactNode } from 'react'

type DetailPanelShellProps = {
  label: string
  closeLabel: string
  identity: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function DetailPanelShell({
  label,
  closeLabel,
  identity,
  onClose,
  children,
  footer,
}: DetailPanelShellProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (typeof panel.scrollTo === 'function') panel.scrollTo({ top: 0 })
    else panel.scrollTop = 0
  }, [identity])

  return (
    <aside
      ref={panelRef}
      className="country-detail detail-panel-enter"
      aria-label={label}
    >
      <div className="country-detail-handle" aria-hidden="true" />
      <button
        type="button"
        className="country-detail-close"
        aria-label={closeLabel}
        onClick={onClose}
      >
        ×
      </button>
      {children}
      {footer}
    </aside>
  )
}
