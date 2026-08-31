import type { CSSProperties } from 'react'
import { Link, useInRouterContext } from 'react-router-dom'

import { countriesByCode } from '../../data/countries'
import type { City, CitySelectionReason } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
import { BookIcon, GlobeIcon } from '../../shared/components/AppNavigationIcons'
import { CountryFlag } from '../../shared/components/CountryFlag'
import { ExpandableItems } from '../../shared/components/knowledge-card/ExpandableItems'
import {
  KnowledgeCardShell,
  type KnowledgeCardAction,
} from '../../shared/components/knowledge-card/KnowledgeCardShell'

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

type CountryFactKind =
  'area' | 'population' | 'capital' | 'currency' | 'language'

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
  language: ['M4 5h16v11H9l-5 4z', 'M8 9h8', 'M8 12h5'],
}

const summaryHeadingStyle = {
  gap: '0.5rem',
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
const summaryFactsStyle = { marginTop: '0.15rem' } satisfies CSSProperties
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
    ...(kind === 'language'
      ? { gridColumn: '1 / -1', minHeight: 0, borderBottom: 0 }
      : undefined),
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
          <small style={summaryOfficialNameStyle}>
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
              <ExpandableItems
                key={`${country.code}:capitals`}
                items={country.capitals}
                previewCount={1}
                expandLabel="首都"
                compactCount
                renderItems={(capitals) => (
                  <span className="knowledge-fact-value-list">
                    {capitals.map((capital) => (
                      <span key={`${capital.name.en}-${capital.latitude}`}>
                        <strong>{capital.name.zh}</strong>
                        <small>{capital.name.en}</small>
                      </span>
                    ))}
                  </span>
                )}
              />
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
            <ExpandableItems
              key={`${country.code}:currencies`}
              items={country.currencies}
              previewCount={1}
              expandLabel="货币"
              compactCount
              renderItems={(currencies) => (
                <ul className="knowledge-fact-list">
                  {currencies.map((currency) => (
                    <li key={currency.code}>
                      <strong>{currency.name.zh}</strong>
                      <small>
                        {currency.name.en} · {currency.code} · {currency.symbol}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            />
          </dd>
        </div>
        <div
          className="knowledge-country-fact is-languages"
          style={countryFactStyle('language')}
        >
          <CountryFactKey kind="language" label="语言" />
          <dd style={factValueStyle}>
            <ExpandableItems
              key={`${country.code}:languages`}
              items={country.languages}
              previewCount={2}
              expandLabel="语言"
              compactCount
              renderItems={(languages) => (
                <ul className="knowledge-language-list">
                  {languages.map((language) => (
                    <li key={language.code}>
                      <strong>{language.name.zh}</strong>
                      <small>{language.name.en}</small>
                    </li>
                  ))}
                </ul>
              )}
            />
          </dd>
        </div>
      </dl>

      <section className="knowledge-country-section knowledge-country-cities">
        <h3>首都与主要城市</h3>
        <ExpandableItems
          key={`${country.code}:cities`}
          items={cities}
          previewCount={3}
          expandLabel="主要城市"
          renderItems={(visibleCities) => (
            <ul className="city-list">
              {visibleCities.map((city) => (
                <li key={city.id}>
                  {onSelectCity ? (
                    <button
                      type="button"
                      onClick={() => onSelectCity(city.id)}
                      aria-label={`探索城市${city.name.zh}`}
                    >
                      <CityRow city={city} />
                    </button>
                  ) : (
                    <div className="city-list-static">
                      <CityRow city={city} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        />
      </section>

      <section className="knowledge-country-highlights">
        <h3>地理亮点</h3>
        <ul>
          {country.highlights.map((highlight) => (
            <li key={highlight.text}>{highlight.text}</li>
          ))}
        </ul>
      </section>

      <section className="knowledge-country-neighbours">
        <h3>相邻国家与地区</h3>
        {country.borderCountryCodes.length > 0 ? (
          <div className="country-border-group">
            <span>主权国家</span>
            <ExpandableItems
              key={`${country.code}:borders`}
              items={country.borderCountryCodes}
              previewCount={6}
              expandLabel="相邻国家"
              renderItems={(countryCodes) => (
                <div className="country-border-list">
                  {countryCodes.map((countryCode) => {
                    const borderCountry = countriesByCode.get(countryCode)
                    return borderCountry ? (
                      <button
                        type="button"
                        key={countryCode}
                        onClick={() => onSelectCountry(countryCode)}
                        aria-label={`探索邻国${borderCountry.name.zh}`}
                      >
                        <CountryFlag src={borderCountry.flagAsset} alt="" />
                        <span>{borderCountry.name.zh}</span>
                      </button>
                    ) : null
                  })}
                </div>
              )}
            />
          </div>
        ) : null}
        {country.adjacentRegions.length > 0 ? (
          <div className="country-border-group">
            <span>相邻地区</span>
            <div className="country-region-list">
              {country.adjacentRegions.map((region) => (
                <span key={region.code} title={region.name.en}>
                  {region.name.zh}
                  <small>地区</small>
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {country.borderCountryCodes.length === 0 &&
        country.adjacentRegions.length === 0 ? (
          <p className="country-detail-muted">没有陆地相邻国家或地区</p>
        ) : null}
      </section>

      <section className="knowledge-country-names">
        <h3>名称信息</h3>
        <p
          style={{
            margin: 0,
            overflowWrap: 'anywhere',
            color: 'var(--atlas-text-secondary)',
            lineHeight: 'var(--lh-b)',
          }}
        >
          {country.officialName.en}
        </p>
      </section>
    </>
  )
}

function CityRow({ city }: { city: City }) {
  return (
    <>
      <span className={city.isCapital ? 'city-dot is-capital' : 'city-dot'} />
      <span>
        <strong>{city.name.zh}</strong>
        <small>{city.name.en}</small>
      </span>
      <em>{city.isCapital ? '首都' : '城市'}</em>
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
