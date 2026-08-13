import { motion, useReducedMotion } from 'motion/react'
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
  const reducedMotion = useReducedMotion() ?? false
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (typeof panel.scrollTo === 'function') panel.scrollTo({ top: 0 })
    else panel.scrollTop = 0
  }, [identity])

  return (
    <motion.aside
      ref={panelRef}
      className="country-detail"
      aria-label={label}
      initial={
        reducedMotion ? false : { opacity: 0, x: 32, y: 18, scale: 0.98 }
      }
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
    </motion.aside>
  )
}
