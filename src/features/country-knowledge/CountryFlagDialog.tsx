import { useId, type CSSProperties } from 'react'

import type { Country } from '../../data/countrySchema'
import { CountryFlag } from '../../shared/components/CountryFlag'
import { KnowledgeDetailDialog } from './KnowledgeDetailDialog'

export type CountryFlagDialogProps = {
  country: Country
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
  const headingId = useId()
  const details = country.flagDetails

  if (!details) return null

  const sections = [
    { id: 'description', label: '外观', content: details.description },
    { id: 'meaning', label: '含义', content: details.meaning },
    { id: 'history', label: '历史', content: details.history },
  ].filter(
    (section): section is { id: string; label: string; content: string } =>
      Boolean(section.content),
  )

  return (
    <KnowledgeDetailDialog
      open={open}
      onOpenChange={onOpenChange}
      labelledBy={headingId}
      closeLabel={`关闭${country.name.zh}国旗含义`}
      className="country-flag-dialog"
    >
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
      <div className="knowledge-detail-dialog-sections country-flag-dialog-sections">
        {sections.map((section) => (
          <section
            key={section.id}
            className="knowledge-detail-dialog-section country-flag-dialog-section"
          >
            <h3 style={sectionHeadingStyle}>{section.label}</h3>
            <p style={sectionCopyStyle}>{section.content}</p>
          </section>
        ))}
      </div>
    </KnowledgeDetailDialog>
  )
}
