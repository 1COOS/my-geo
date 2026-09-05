import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'

import type { Country } from '../../data/countrySchema'
import { CountryFlag } from '../../shared/components/CountryFlag'

export type CountryFlagDialogProps = {
  country: Country
  open: boolean
  onOpenChange: (open: boolean) => void
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
const headerStyle = {
  display: 'grid',
  alignItems: 'center',
} satisfies CSSProperties
const flagStyle = {
  width: '100%',
  borderRadius: '0.2rem',
} satisfies CSSProperties
const headerCopyStyle = { minWidth: 0 } satisfies CSSProperties
const kickerStyle = {
  margin: 0,
  color: 'var(--atlas-accent)',
  fontSize: 'var(--fs-s)',
  fontWeight: 700,
} satisfies CSSProperties
const headingStyle = {
  margin: '0.18rem 0 0',
  color: 'var(--atlas-text)',
  fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
  lineHeight: 1.15,
} satisfies CSSProperties
const englishNameStyle = {
  margin: '0.22rem 0 0',
  overflow: 'hidden',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-b)',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} satisfies CSSProperties
const sectionHeadingStyle = {
  margin: 0,
  color: 'var(--atlas-accent)',
  fontSize: 'var(--fs-b)',
  fontWeight: 700,
} satisfies CSSProperties
const sectionCopyStyle = {
  margin: '0.3rem 0 0',
  overflowWrap: 'anywhere',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-b)',
  lineHeight: 1.65,
} satisfies CSSProperties

export function CountryFlagDialog({
  country,
  open,
  onOpenChange,
}: CountryFlagDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const headingId = useId()
  const details = country.flagDetails

  useEffect(() => {
    if (!open) {
      returnFocusRef.current?.focus()
      return
    }

    const dialog = dialogRef.current
    if (!dialog) return
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && activeElement !== dialog) {
      returnFocusRef.current = activeElement
    }
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }

    return () => {
      if (!dialog.open) return
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  if (!details || !open) return null

  const sections = [
    { id: 'description', label: '外观', content: details.description },
    { id: 'meaning', label: '含义', content: details.meaning },
    { id: 'history', label: '历史', content: details.history },
  ].filter(
    (section): section is { id: string; label: string; content: string } =>
      Boolean(section.content),
  )

  const requestClose = () => onOpenChange(false)
  const handleBackdropClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) requestClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="country-flag-dialog"
      aria-labelledby={headingId}
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
        className="country-flag-dialog-close"
        aria-label={`关闭${country.name.zh}国旗含义`}
        style={closeStyle}
        onClick={requestClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      <div className="country-flag-dialog-body" style={bodyStyle}>
        <header className="country-flag-dialog-header" style={headerStyle}>
          <CountryFlag
            className="country-flag-dialog-flag"
            src={country.flagAsset}
            alt={`${country.name.zh}国旗`}
            style={flagStyle}
          />
          <div style={headerCopyStyle}>
            <span style={kickerStyle}>国旗故事</span>
            <h2 id={headingId} style={headingStyle}>
              {country.name.zh}国旗
            </h2>
            <p style={englishNameStyle}>
              {country.name.en} · {country.code}
            </p>
          </div>
        </header>
        <div className="country-flag-dialog-sections">
          {sections.map((section) => (
            <section key={section.id} className="country-flag-dialog-section">
              <h3 style={sectionHeadingStyle}>{section.label}</h3>
              <p style={sectionCopyStyle}>{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  )
}
