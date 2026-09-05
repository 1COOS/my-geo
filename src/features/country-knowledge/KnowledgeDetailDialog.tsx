import {
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'

type KnowledgeDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  labelledBy: string
  closeLabel: string
  className?: string
  children: ReactNode
}

const dialogStyle = {
  maxWidth: 'none',
  padding: 0,
  overflow: 'hidden',
  color: 'var(--atlas-text)',
  background: 'var(--atlas-panel)',
  border: '1px solid var(--atlas-border)',
  borderRadius: 'var(--atlas-radius-panel)',
  boxShadow: 'var(--atlas-shadow)',
} satisfies CSSProperties

const closeStyle = {
  position: 'absolute',
  zIndex: 2,
  top: '0.65rem',
  right: '0.65rem',
  display: 'inline-flex',
  width: '2.75rem',
  height: '2.75rem',
  padding: 0,
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--atlas-text)',
  fontSize: '1.35rem',
  cursor: 'pointer',
  background: 'var(--atlas-panel-raised)',
  border: '1px solid var(--atlas-border)',
  borderRadius: 'var(--atlas-radius-control)',
} satisfies CSSProperties

const bodyStyle = {
  boxSizing: 'border-box',
  overflowY: 'auto',
} satisfies CSSProperties

export function KnowledgeDetailDialog({
  open,
  onOpenChange,
  labelledBy,
  closeLabel,
  className,
  children,
}: KnowledgeDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      returnFocusRef.current?.focus()
      return
    }

    const dialog = dialogRef.current
    if (!dialog) return
    const activeElement = document.activeElement
    if (
      activeElement instanceof HTMLElement &&
      !dialog.contains(activeElement)
    ) {
      returnFocusRef.current = activeElement
    }
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }

    return () => {
      // Removing the dialog node exits the top layer automatically. Calling
      // close() here would emit a close event during React Strict Mode's
      // mount-effect rehearsal and immediately undo a newly opened dialog.
      returnFocusRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  const requestClose = () => onOpenChange(false)
  const handleBackdropClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) requestClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={['knowledge-detail-dialog', className]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={labelledBy}
      aria-modal="true"
      style={dialogStyle}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClose={() => {
        if (open) onOpenChange(false)
        returnFocusRef.current?.focus()
      }}
      onClick={handleBackdropClick}
    >
      <button
        type="button"
        className={[
          'knowledge-detail-dialog-close',
          className ? `${className}-close` : null,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={closeLabel}
        style={closeStyle}
        onClick={requestClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      <div
        className={[
          'knowledge-detail-dialog-body',
          className ? `${className}-body` : null,
        ]
          .filter(Boolean)
          .join(' ')}
        style={bodyStyle}
      >
        {children}
      </div>
    </dialog>
  )
}
