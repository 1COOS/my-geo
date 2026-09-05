import { useId, type CSSProperties } from 'react'

import { countriesByCode } from '../../data/countries'
import type { InternationalAffiliation } from '../../data/internationalOrganizationSchema'
import { CountryFlag } from '../../shared/components/CountryFlag'
import { KnowledgeDetailDialog } from './KnowledgeDetailDialog'

type InternationalAffiliationDialogProps = {
  affiliation: InternationalAffiliation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const headerStyle = {
  display: 'grid',
  alignItems: 'center',
} satisfies CSSProperties

const monogramStyle = {
  display: 'inline-flex',
  width: '100%',
  aspectRatio: '1.45',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--atlas-text)',
  fontSize: 'clamp(1rem, 3vw, 1.45rem)',
  fontWeight: 800,
  letterSpacing: '0.035em',
  background: 'var(--atlas-accent-soft)',
  border: '1px solid var(--atlas-accent)',
  borderRadius: 'var(--atlas-radius-compact)',
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
  overflowWrap: 'anywhere',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-b)',
  lineHeight: 1.35,
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

const factsStyle = {
  display: 'grid',
  gap: '0.45rem',
  margin: '0.6rem 0 0',
} satisfies CSSProperties
const factRowStyle = {
  display: 'grid',
  gridTemplateColumns: '3rem minmax(0, 1fr)',
  gap: '0.55rem',
  alignItems: 'start',
} satisfies CSSProperties
const factLabelStyle = {
  color: 'var(--atlas-text-muted)',
  fontSize: 'var(--fs-s)',
  fontWeight: 700,
} satisfies CSSProperties
const factValueStyle = {
  margin: 0,
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-b)',
  lineHeight: 1.5,
} satisfies CSSProperties
const memberGridStyle = {
  display: 'grid',
  padding: 0,
  margin: '0.75rem 0 0',
  gridTemplateColumns: 'repeat(auto-fit, minmax(7.5rem, 1fr))',
  gap: '0.4rem',
  listStyle: 'none',
} satisfies CSSProperties
const memberItemStyle = {
  display: 'grid',
  minWidth: 0,
  minHeight: '2.5rem',
  padding: '0.35rem 0.45rem',
  gridTemplateColumns: '1.55rem minmax(0, 1fr)',
  gap: '0.45rem',
  alignItems: 'center',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-s)',
  background: 'var(--atlas-panel-muted)',
  border: '1px solid var(--atlas-border-soft)',
  borderRadius: 'var(--atlas-radius-control)',
} satisfies CSSProperties
const memberFlagStyle = { width: '1.55rem' } satisfies CSSProperties
const otherMembersStyle = { marginTop: '0.8rem' } satisfies CSSProperties
const otherMembersHeadingStyle = {
  margin: 0,
  color: 'var(--atlas-text-muted)',
  fontSize: 'var(--fs-s)',
} satisfies CSSProperties
const otherMembersListStyle = {
  display: 'flex',
  padding: 0,
  margin: '0.4rem 0 0',
  gap: '0.4rem',
  flexWrap: 'wrap',
  listStyle: 'none',
} satisfies CSSProperties
const otherMemberStyle = {
  padding: '0.35rem 0.5rem',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-s)',
  background: 'var(--atlas-panel-muted)',
  border: '1px solid var(--atlas-border-soft)',
  borderRadius: 'var(--atlas-radius-control)',
} satisfies CSSProperties

const kindLabels: Record<InternationalAffiliation['kind'], string> = {
  role: '国际角色',
  organization: '国际组织',
  mechanism: '合作机制',
}

export function InternationalAffiliationDialog({
  affiliation,
  open,
  onOpenChange,
}: InternationalAffiliationDialogProps) {
  const headingId = useId()

  if (!affiliation) return null

  const memberCountries = affiliation.memberCountryCodes.flatMap(
    (countryCode) => {
      const country = countriesByCode.get(countryCode)
      return country ? [country] : []
    },
  )

  return (
    <KnowledgeDetailDialog
      open={open}
      onOpenChange={onOpenChange}
      labelledBy={headingId}
      closeLabel={`关闭${affiliation.name.zh}详情`}
      className="international-affiliation-dialog"
    >
      <header
        className="international-affiliation-dialog-header"
        style={headerStyle}
      >
        <span
          className="international-affiliation-dialog-monogram"
          style={monogramStyle}
          aria-hidden="true"
        >
          {affiliation.monogram}
        </span>
        <div style={headerCopyStyle}>
          <span style={kickerStyle}>{kindLabels[affiliation.kind]}</span>
          <h2 id={headingId} style={headingStyle}>
            {affiliation.name.zh}
          </h2>
          <p style={englishNameStyle}>{affiliation.name.en}</p>
        </div>
      </header>

      <div className="knowledge-detail-dialog-sections">
        <section className="knowledge-detail-dialog-section">
          <h3 style={sectionHeadingStyle}>基本信息</h3>
          <dl
            className="international-affiliation-dialog-facts"
            style={factsStyle}
          >
            <div style={factRowStyle}>
              <dt style={factLabelStyle}>性质</dt>
              <dd style={factValueStyle}>{kindLabels[affiliation.kind]}</dd>
            </div>
            <div style={factRowStyle}>
              <dt style={factLabelStyle}>成立</dt>
              <dd style={factValueStyle}>{affiliation.details.established}</dd>
            </div>
            <div style={factRowStyle}>
              <dt style={factLabelStyle}>总部</dt>
              <dd style={factValueStyle}>{affiliation.details.headquarters}</dd>
            </div>
            <div style={factRowStyle}>
              <dt style={factLabelStyle}>成员</dt>
              <dd style={factValueStyle}>
                {affiliation.officialMemberCount}个正式成员
              </dd>
            </div>
          </dl>
        </section>

        <section className="knowledge-detail-dialog-section">
          <h3 style={sectionHeadingStyle}>组织介绍</h3>
          <p style={sectionCopyStyle}>{affiliation.details.overview}</p>
        </section>

        <section className="knowledge-detail-dialog-section">
          <h3 style={sectionHeadingStyle}>主要作用</h3>
          <p style={sectionCopyStyle}>{affiliation.details.purpose}</p>
        </section>

        <section className="knowledge-detail-dialog-section">
          <h3 style={sectionHeadingStyle}>成员国</h3>
          <p style={sectionCopyStyle}>{affiliation.details.membership}</p>
          <ul
            className="international-affiliation-member-grid"
            style={memberGridStyle}
          >
            {memberCountries.map((country) => (
              <li key={country.code} style={memberItemStyle}>
                <CountryFlag
                  src={country.flagAsset}
                  alt=""
                  style={memberFlagStyle}
                />
                <span>{country.name.zh}</span>
              </li>
            ))}
          </ul>
          {affiliation.otherMembers.length > 0 ? (
            <div
              className="international-affiliation-other-members"
              style={otherMembersStyle}
            >
              <h4 style={otherMembersHeadingStyle}>其他正式成员</h4>
              <ul style={otherMembersListStyle}>
                {affiliation.otherMembers.map((member) => (
                  <li key={member.id} style={otherMemberStyle}>
                    {member.name.zh}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </KnowledgeDetailDialog>
  )
}
