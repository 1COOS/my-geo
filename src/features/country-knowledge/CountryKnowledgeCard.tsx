import { useState, type CSSProperties } from 'react'
import { Link, useInRouterContext } from 'react-router-dom'

import type { City } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
import { CountryFlag } from '../../shared/components/CountryFlag'
import {
  KnowledgeCardShell,
  type KnowledgeCardAction,
} from '../../shared/components/knowledge-card/KnowledgeCardShell'

import {
  CountryKnowledgeSections,
  CountrySignatureLabels,
  type CountryKnowledgeChapterId,
} from './CountryKnowledgeSections'
import { CountryFlagDialog } from './CountryFlagDialog'

export type CountryKnowledgeCardProps = {
  country: Country
  cities: City[]
  label: string
  identity: string
  onSelectCountry: (countryCode: string) => void
  footerAction?: KnowledgeCardAction
}

const areaFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
})
const populationFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
type CountryFactKind = 'area' | 'population' | 'capital' | 'currency'

const countryFactIconPaths: Record<CountryFactKind, string[]> = {
  area: [
    'M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20z',
    'M9 4v13.5',
    'M15 6.5V20',
  ],
  population: [
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M3.5 20v-2.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V20',
    'M16 8a2.4 2.4 0 1 0 0-4.8',
    'M17 12.5a4 4 0 0 1 3.5 4V20',
  ],
  capital: [
    'M4 9h16',
    'M6 9V6l6-3 6 3v3',
    'M6 19h12',
    'M8 9v10',
    'M12 9v10',
    'M16 9v10',
  ],
  currency: ['M12 3v18', 'M16.5 7H9.8a3 3 0 0 0 0 6h4.4a3 3 0 0 1 0 6H7.5'],
}

function CircleInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.8V16" />
      <circle cx="12" cy="7.7" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}

const summaryHeadingStyle = {
  gap: '0.85rem',
} satisfies CSSProperties
const summaryCopyStyle = { minWidth: 0, flex: 1 } satisfies CSSProperties
const summaryEnglishLineStyle = {
  display: 'flex',
  minWidth: 0,
  gap: '0.3rem',
  alignItems: 'baseline',
  marginTop: '0.05rem',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-m)',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
} satisfies CSSProperties
const summaryOfficialNameStyle = {
  marginTop: '0.18rem',
  overflowWrap: 'anywhere',
  color: 'var(--atlas-accent)',
  fontSize: 'var(--fs-m)',
  lineHeight: 1.35,
} satisfies CSSProperties
const summaryFactsStyle = { marginTop: '0.7rem' } satisfies CSSProperties
const summaryFlagStyle = { width: '3.8rem' } satisfies CSSProperties
const cornerActionStyle = {
  position: 'absolute',
  zIndex: 2,
  top: '0.75rem',
  right: '0.75rem',
  display: 'inline-flex',
  width: 'auto',
  minWidth: '2.8rem',
  height: '2rem',
  minHeight: '2rem',
  padding: '0.3rem 0.55rem',
  alignItems: 'center',
  justifyContent: 'center',
} satisfies CSSProperties
const factKeyStyle = {
  position: 'absolute',
  top: '0.5rem',
  left: 'var(--country-card-key-inset)',
  width: '0.9rem',
  height: '0.9rem',
  color: 'var(--atlas-accent)',
} satisfies CSSProperties
const factValueStyle = {
  margin: 0,
  fontSize: '0.8125rem',
  lineHeight: 1.35,
} satisfies CSSProperties

function countryFactStyle(kind: CountryFactKind): CSSProperties {
  return {
    position: 'relative',
    minHeight: kind === 'capital' || kind === 'currency' ? '3.5rem' : '2.7rem',
    padding:
      '0.4rem var(--country-card-key-inset) 0.35rem calc(var(--country-card-key-inset) + 0.9rem + var(--country-card-key-gap))',
  }
}

function CountryFactKey({
  kind,
  label,
}: {
  kind: CountryFactKind
  label: string
}) {
  return (
    <dt title={label} style={factKeyStyle}>
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        {countryFactIconPaths[kind].map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </dt>
  )
}

export function CountryKnowledgeCard({
  country,
  cities,
  label,
  identity,
  onSelectCountry,
  footerAction,
}: CountryKnowledgeCardProps) {
  const inRouterContext = useInRouterContext()
  const cornerAction = footerAction ? (
    inRouterContext ? (
      <Link
        className="knowledge-card-action knowledge-card-action-compact"
        to={footerAction.to}
        aria-label={`${footerAction.label}，${footerAction.description}`}
        title={footerAction.description}
        style={cornerActionStyle}
      >
        <ActionContent action={footerAction} />
      </Link>
    ) : (
      <a
        className="knowledge-card-action knowledge-card-action-compact"
        href={footerAction.to}
        aria-label={`${footerAction.label}，${footerAction.description}`}
        title={footerAction.description}
        style={cornerActionStyle}
      >
        <ActionContent action={footerAction} />
      </a>
    )
  ) : undefined

  return (
    <KnowledgeCardShell
      label={label}
      identity={identity}
      className="country-knowledge-card"
      cornerAction={cornerAction}
    >
      <CountryDetailView
        key={country.code}
        country={country}
        cities={cities}
        onSelectCountry={onSelectCountry}
      />
    </KnowledgeCardShell>
  )
}

function ActionContent({ action }: { action: KnowledgeCardAction }) {
  return <span>{action.label.includes('3D') ? '3D' : '图鉴'}</span>
}

function CountryDetailView({
  country,
  cities,
  onSelectCountry,
}: Pick<CountryKnowledgeCardProps, 'country' | 'cities' | 'onSelectCountry'>) {
  const [openChapter, setOpenChapter] =
    useState<CountryKnowledgeChapterId | null>(null)
  const [flagDialogOpen, setFlagDialogOpen] = useState(false)

  return (
    <>
      <div
        className="knowledge-country-detail-heading knowledge-country-summary-heading"
        style={summaryHeadingStyle}
      >
        {country.flagDetails ? (
          <button
            type="button"
            className="country-flag-meaning-trigger"
            aria-label={`查看${country.name.zh}国旗含义`}
            aria-haspopup="dialog"
            aria-expanded={flagDialogOpen}
            onClick={() => setFlagDialogOpen(true)}
          >
            <CountryFlag
              className="knowledge-country-detail-flag"
              src={country.flagAsset}
              alt={`${country.name.zh}国旗`}
              style={summaryFlagStyle}
            />
            <span className="country-flag-meaning-cue" aria-hidden="true">
              <CircleInfoIcon />
            </span>
          </button>
        ) : (
          <CountryFlag
            className="knowledge-country-detail-flag"
            src={country.flagAsset}
            alt={`${country.name.zh}国旗`}
            style={summaryFlagStyle}
          />
        )}
        <div
          className="knowledge-country-summary-copy"
          style={summaryCopyStyle}
        >
          <div className="knowledge-country-summary-title">
            <h2 style={{ minWidth: 0, paddingRight: '2.35rem', margin: 0 }}>
              {country.name.zh}
            </h2>
          </div>
          <p style={summaryEnglishLineStyle}>
            <span>{country.name.en}</span>
            <span aria-hidden="true">·</span>
            <span>
              {country.code} · {country.alpha3Code}
            </span>
          </p>
          <small
            style={summaryOfficialNameStyle}
            title={country.officialName.en}
          >
            {country.subregion.zh} · {country.officialName.zh}
          </small>
        </div>
      </div>

      <CountryFlagDialog
        country={country}
        open={flagDialogOpen}
        onOpenChange={setFlagDialogOpen}
      />

      <dl
        className="knowledge-country-facts knowledge-country-summary-facts"
        style={summaryFactsStyle}
      >
        <div
          className="knowledge-country-fact is-population"
          style={countryFactStyle('population')}
        >
          <CountryFactKey kind="population" label="人口" />
          <dd style={factValueStyle}>
            <strong>{populationFormatter.format(country.population)}人</strong>
          </dd>
        </div>
        <div
          className="knowledge-country-fact is-area"
          style={countryFactStyle('area')}
        >
          <CountryFactKey kind="area" label="面积" />
          <dd style={factValueStyle}>
            <strong>
              {areaFormatter.format(country.areaSquareKilometers)} km²
            </strong>
          </dd>
        </div>
        <div
          className="knowledge-country-fact is-capital"
          style={countryFactStyle('capital')}
        >
          <CountryFactKey kind="capital" label="首都" />
          <dd style={factValueStyle}>
            {country.capitals.length > 0 ? (
              <span className="knowledge-fact-value-list">
                {country.capitals.map((capital) => (
                  <span key={`${capital.name.en}-${capital.latitude}`}>
                    <strong>{capital.name.zh}</strong>
                    <small>{capital.name.en}</small>
                  </span>
                ))}
              </span>
            ) : (
              <span className="country-detail-muted">暂无首都资料</span>
            )}
          </dd>
        </div>
        <div
          className="knowledge-country-fact is-currency"
          style={countryFactStyle('currency')}
        >
          <CountryFactKey kind="currency" label="法币" />
          <dd style={factValueStyle}>
            <ul className="knowledge-fact-list">
              {country.currencies.map((currency) => (
                <li key={currency.code}>
                  <strong>
                    {currency.name.zh} {currency.code} {currency.symbol}
                  </strong>
                  <small>{currency.name.en}</small>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <CountrySignatureLabels signature={country.profile.signature} />

      <CountryKnowledgeSections
        country={country}
        cities={cities}
        onSelectCountry={onSelectCountry}
        openChapter={openChapter}
        onOpenChapterChange={setOpenChapter}
      />
    </>
  )
}
