import { Link, useInRouterContext } from 'react-router-dom'

import { countriesByCode } from '../../data/countries'
import type { City, CitySelectionReason } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
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
  const footer =
    !selectedCity && footerAction ? (
      inRouterContext ? (
        <Link className="knowledge-card-action" to={footerAction.to}>
          <ActionContent action={footerAction} />
        </Link>
      ) : (
        <a className="knowledge-card-action" href={footerAction.to}>
          <ActionContent action={footerAction} />
        </a>
      )
    ) : undefined

  return (
    <KnowledgeCardShell
      label={label}
      identity={identity}
      className="country-knowledge-card"
      footer={footer}
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
  return (
    <>
      <span>{action.label}</span>
      <small>{action.description}</small>
    </>
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
      <div className="knowledge-country-detail-heading">
        <CountryFlag
          className="knowledge-country-detail-flag"
          src={country.flagAsset}
          alt={`${country.name.zh}国旗`}
        />
        <div>
          <span>
            {country.continent.zh} · {country.officialName.zh}
          </span>
          <h2>{country.name.zh}</h2>
          <p>
            {country.name.en} · {country.code} / {country.alpha3Code}
          </p>
          <small>{country.officialName.en}</small>
        </div>
      </div>

      <dl className="knowledge-country-facts">
        <div className="knowledge-country-fact is-capital">
          <dt>首都</dt>
          <dd>
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
        <div className="knowledge-country-fact is-population">
          <dt>人口</dt>
          <dd>
            <strong>
              约 {populationFormatter.format(country.population)} 人
            </strong>
            <small>{country.populationYear} 年</small>
          </dd>
        </div>
        <div className="knowledge-country-fact is-currency">
          <dt>货币</dt>
          <dd>
            <ExpandableItems
              key={`${country.code}:currencies`}
              items={country.currencies}
              previewCount={2}
              expandLabel="货币"
              renderItems={(currencies) => (
                <ul className="knowledge-fact-list">
                  {currencies.map((currency) => (
                    <li key={currency.code}>
                      <strong>
                        {currency.name.zh}（{currency.code}）
                      </strong>
                      <small>
                        {currency.name.en} · {currency.symbol}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            />
          </dd>
        </div>
        <div className="knowledge-country-fact is-area">
          <dt>面积</dt>
          <dd>
            <strong>
              {areaFormatter.format(country.areaSquareKilometers)} km²
            </strong>
          </dd>
        </div>
        <div className="knowledge-country-fact is-languages">
          <dt>语言</dt>
          <dd>
            <ul className="knowledge-language-list">
              {country.languages.map((language) => (
                <li key={language.code}>
                  <strong>{language.name.zh}</strong>
                  <small>{language.name.en}</small>
                </li>
              ))}
            </ul>
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
