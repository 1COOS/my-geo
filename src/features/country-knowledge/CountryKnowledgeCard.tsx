import type { CSSProperties } from 'react'
import { Link, useInRouterContext } from 'react-router-dom'

import type { City, CitySelectionReason } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
import { BookIcon, GlobeIcon } from '../../shared/components/AppNavigationIcons'
import { CountryFlag } from '../../shared/components/CountryFlag'
import {
  KnowledgeCardShell,
  type KnowledgeCardAction,
} from '../../shared/components/knowledge-card/KnowledgeCardShell'

import {
  CountryKnowledgeSections,
  CountrySignatureLabels,
} from './CountryKnowledgeSections'

export type CountryKnowledgeCardProps = {
  country: Country
  cities: City[]
  selectedCity?: City
  label: string
  identity: string
  onSelectCountry: (countryCode: string) => void
  onSelectCity?: (cityId: string) => void
  onBackToCountry?: () => void
  footerAction?: KnowledgeCardAction
}

const areaFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
})
const populationFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const cityReasonLabels: Record<CitySelectionReason, string> = {
  capital: '国家首都',
  population_center: '人口中心',
  economic_center: '经济中心',
  global_fame: '世界知名',
  cultural_tourism: '文化旅游中心',
  regional_center: '区域中心',
}

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
  width: '2rem',
  height: '2rem',
  minHeight: '2rem',
  padding: '0.35rem',
  alignItems: 'center',
  justifyContent: 'center',
} satisfies CSSProperties
const cornerActionIconStyle = {
  display: 'flex',
  width: '100%',
  height: '100%',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.7,
} satisfies CSSProperties
const factKeyStyle = {
  position: 'absolute',
  top: '0.5rem',
  left: '0.45rem',
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
    padding: '0.4rem 0.45rem 0.35rem 1.75rem',
    borderRight:
      kind === 'area' || kind === 'capital'
        ? '1px solid var(--atlas-border-soft)'
        : 0,
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
  selectedCity,
  label,
  identity,
  onSelectCountry,
  onSelectCity,
  onBackToCountry,
  footerAction,
}: CountryKnowledgeCardProps) {
  const inRouterContext = useInRouterContext()
  const cornerAction =
    !selectedCity && footerAction ? (
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
      {selectedCity ? (
        <CityDetailView
          country={country}
          city={selectedCity}
          onBack={onBackToCountry}
        />
      ) : (
        <CountryDetailView
          country={country}
          cities={cities}
          onSelectCountry={onSelectCountry}
          onSelectCity={onSelectCity}
        />
      )}
    </KnowledgeCardShell>
  )
}

function ActionContent({ action }: { action: KnowledgeCardAction }) {
  const Icon = action.label.includes('3D') ? GlobeIcon : BookIcon
  return (
    <span style={cornerActionIconStyle}>
      <Icon />
    </span>
  )
}

function CountryDetailView({
  country,
  cities,
  onSelectCountry,
  onSelectCity,
}: Pick<
  CountryKnowledgeCardProps,
  'country' | 'cities' | 'onSelectCountry' | 'onSelectCity'
>) {
  return (
    <>
      <div
        className="knowledge-country-detail-heading knowledge-country-summary-heading"
        style={summaryHeadingStyle}
      >
        <CountryFlag
          className="knowledge-country-detail-flag"
          src={country.flagAsset}
          alt={`${country.name.zh}国旗`}
          style={summaryFlagStyle}
        />
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

      <dl
        className="knowledge-country-facts knowledge-country-summary-facts"
        style={summaryFactsStyle}
      >
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
          className="knowledge-country-fact is-population"
          style={countryFactStyle('population')}
        >
          <CountryFactKey kind="population" label="人口" />
          <dd style={factValueStyle}>
            <strong>
              约 {populationFormatter.format(country.population)} 人
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
          <CountryFactKey kind="currency" label="货币" />
          <dd style={factValueStyle}>
            <ul className="knowledge-fact-list">
              {country.currencies.map((currency) => (
                <li key={currency.code}>
                  <strong>{currency.name.zh}</strong>
                  <small>
                    {currency.name.en} · {currency.code} · {currency.symbol}
                  </small>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <CountrySignatureLabels signature={country.profile.signature} />

      <CountryKnowledgeSections
        key={country.code}
        country={country}
        cities={cities}
        onSelectCountry={onSelectCountry}
        onSelectCity={onSelectCity}
      />
    </>
  )
}

function CityDetailView({
  country,
  city,
  onBack,
}: {
  country: Country
  city: City
  onBack?: () => void
}) {
  return (
    <>
      {onBack ? (
        <button type="button" className="city-detail-back" onClick={onBack}>
          ← 返回{country.name.zh}
        </button>
      ) : null}

      <div className="knowledge-country-detail-heading">
        <CountryFlag
          className="knowledge-country-detail-flag"
          src={country.flagAsset}
          alt={`${country.name.zh}国旗`}
        />
        <div>
          <span>{city.isCapital ? '国家首都' : '主要城市'}</span>
          <h2>{city.name.zh}</h2>
          <p>
            {city.name.en} · {country.name.zh}
          </p>
        </div>
      </div>

      <section className="knowledge-country-section">
        <h3>城市概览</h3>
        <dl className="knowledge-country-facts knowledge-city-facts">
          <div>
            <dt>人口</dt>
            <dd>
              {city.population === null
                ? '暂无可靠数据'
                : `约 ${populationFormatter.format(city.population)} 人`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="knowledge-country-section">
        <h3>入选理由</h3>
        <ul className="city-reason-list">
          {city.reasons.map((reason) => (
            <li key={reason}>{cityReasonLabels[reason]}</li>
          ))}
        </ul>
      </section>
    </>
  )
}
