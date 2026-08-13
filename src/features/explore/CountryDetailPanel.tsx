import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'

import { countriesByCode, getCountrySource } from '../../data/countries'
import type { City, CitySelectionReason } from '../../data/citySchema'
import type { Country, CountrySource } from '../../data/countrySchema'

type CountryDetailPanelProps = {
  country: Country
  cities: City[]
  selectedCity: City | undefined
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
  onSelectCity: (cityId: string) => void
  onBackToCountry: () => void
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

export function CountryDetailPanel({
  country,
  cities,
  selectedCity,
  onClose,
  onSelectCountry,
  onSelectCity,
  onBackToCountry,
}: CountryDetailPanelProps) {
  const reducedMotion = useReducedMotion() ?? false
  const panelRef = useRef<HTMLElement>(null)
  const countryReferencedSources = useMemo(() => {
    const sourceIds = new Set([
      'world-countries',
      ...country.highlights.flatMap((highlight) => highlight.sourceIds),
    ])
    return [...sourceIds].flatMap((sourceId) => {
      const source = getCountrySource(sourceId)
      return source ? [source] : []
    })
  }, [country.highlights])
  const cityReferencedSources = useMemo(
    () =>
      selectedCity?.sourceIds.flatMap((sourceId) => {
        const source = getCountrySource(sourceId)
        return source ? [source] : []
      }) ?? [],
    [selectedCity],
  )

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (typeof panel.scrollTo === 'function') panel.scrollTo({ top: 0 })
    else panel.scrollTop = 0
  }, [country.code, selectedCity?.id])

  return (
    <motion.aside
      ref={panelRef}
      className="country-detail"
      aria-label={
        selectedCity
          ? `${selectedCity.name.zh}城市知识卡`
          : `${country.name.zh}国家知识卡`
      }
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
        aria-label={selectedCity ? '关闭城市知识卡' : '关闭国家知识卡'}
        onClick={onClose}
      >
        ×
      </button>

      {selectedCity ? (
        <CityDetailView
          country={country}
          city={selectedCity}
          sources={cityReferencedSources}
          onBack={onBackToCountry}
        />
      ) : (
        <CountryDetailView
          country={country}
          cities={cities}
          referencedSources={countryReferencedSources}
          onSelectCountry={onSelectCountry}
          onSelectCity={onSelectCity}
        />
      )}

      <p className="prototype-note">原型地图 · 公开发布前需重新评估地图合规</p>
    </motion.aside>
  )
}

type CountryDetailViewProps = {
  country: Country
  cities: City[]
  referencedSources: CountrySource[]
  onSelectCountry: (countryCode: string) => void
  onSelectCity: (cityId: string) => void
}

function CountryDetailView({
  country,
  cities,
  referencedSources,
  onSelectCountry,
  onSelectCity,
}: CountryDetailViewProps) {
  return (
    <>
      <div className="country-detail-heading">
        <img
          className="country-detail-flag"
          src={country.flagAsset}
          alt={`${country.name.zh}国旗`}
        />
        <div>
          <p>{country.continent.zh}</p>
          <h2>{country.name.zh}</h2>
          <span>
            {country.name.en} · {country.code} / {country.alpha3Code}
          </span>
        </div>
      </div>

      <div className="country-official-name">
        <p className="country-detail-label">正式国名</p>
        <strong>{country.officialName.zh}</strong>
        <small>{country.officialName.en}</small>
      </div>

      <section
        className="country-detail-section"
        aria-labelledby="capital-title"
      >
        <p id="capital-title" className="country-detail-label">
          首都
        </p>
        {country.capitals.length > 0 ? (
          <ul className="capital-list">
            {country.capitals.map((capital) => (
              <li key={`${capital.name.en}-${capital.latitude}`}>
                <span aria-hidden="true">◎</span>
                <div>
                  <strong>{capital.name.zh}</strong>
                  <small>{capital.name.en}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="country-detail-muted">暂无首都资料</p>
        )}
      </section>

      <section
        className="country-detail-section"
        aria-labelledby="cities-title"
      >
        <p id="cities-title" className="country-detail-label">
          首都与主要城市
        </p>
        <ul className="city-list">
          {cities.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => onSelectCity(city.id)}
                aria-label={`探索城市${city.name.zh}`}
              >
                <span
                  className={
                    city.isCapital ? 'city-dot is-capital' : 'city-dot'
                  }
                />
                <span>
                  <strong>{city.name.zh}</strong>
                  <small>{city.name.en}</small>
                </span>
                <em>{city.isCapital ? '首都' : '城市'}</em>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="country-facts-grid">
        <section>
          <p className="country-detail-label">语言</p>
          <ul className="country-data-list">
            {country.languages.map((language) => (
              <li key={language.code}>
                <strong>{language.name.zh}</strong>
                <small>{language.name.en}</small>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="country-detail-label">货币</p>
          <ul className="country-data-list">
            {country.currencies.map((currency) => (
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
        </section>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">地理概览</p>
        <dl className="country-geography-grid">
          <div>
            <dt>次区域</dt>
            <dd>
              <strong>{country.subregion.zh}</strong>
              <small>{country.subregion.en}</small>
            </dd>
          </div>
          <div>
            <dt>面积</dt>
            <dd>
              <strong>
                {areaFormatter.format(country.areaSquareKilometers)} km²
              </strong>
            </dd>
          </div>
        </dl>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">相邻国家与地区</p>
        {country.borderCountryCodes.length > 0 ? (
          <div className="country-border-group">
            <span>主权国家</span>
            <div className="country-border-list">
              {country.borderCountryCodes.map((countryCode) => {
                const borderCountry = countriesByCode.get(countryCode)
                return borderCountry ? (
                  <button
                    type="button"
                    key={countryCode}
                    onClick={() => onSelectCountry(countryCode)}
                    aria-label={`探索邻国${borderCountry.name.zh}`}
                  >
                    <img src={borderCountry.flagAsset} alt="" />
                    <span>{borderCountry.name.zh}</span>
                  </button>
                ) : null
              })}
            </div>
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

      <section className="country-detail-section">
        <p className="country-detail-label">你知道吗？</p>
        <ol className="fun-fact-list">
          {country.highlights.map((highlight, index) => (
            <li key={highlight.text}>
              <span>{index + 1}</span>
              <p>{highlight.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <details className="country-sources">
        <summary>资料来源（{referencedSources.length}）</summary>
        <ul>
          {referencedSources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>
              <span>
                {source.publisher}
                {source.version ? ` · v${source.version}` : ''}
                {source.accessedAt ? ` · 查阅于 ${source.accessedAt}` : ''}
              </span>
              <small>{source.license}</small>
            </li>
          ))}
        </ul>
      </details>
    </>
  )
}

type CityDetailViewProps = {
  country: Country
  city: City
  sources: CountrySource[]
  onBack: () => void
}

function CityDetailView({
  country,
  city,
  sources,
  onBack,
}: CityDetailViewProps) {
  return (
    <>
      <button type="button" className="city-detail-back" onClick={onBack}>
        ← 返回{country.name.zh}
      </button>

      <div className="city-detail-heading">
        <img src={country.flagAsset} alt={`${country.name.zh}国旗`} />
        <div>
          <p>{city.isCapital ? '国家首都' : '主要城市'}</p>
          <h2>{city.name.zh}</h2>
          <span>
            {city.name.en} · {country.name.zh}
          </span>
        </div>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">城市概览</p>
        <dl className="city-detail-facts">
          <div>
            <dt>人口</dt>
            <dd>
              {city.population === null
                ? '暂无可靠数据'
                : `约 ${populationFormatter.format(city.population)} 人`}
            </dd>
          </div>
          <div>
            <dt>坐标</dt>
            <dd>
              {Math.abs(city.latitude).toFixed(4)}°
              {city.latitude >= 0 ? 'N' : 'S'} ·{' '}
              {Math.abs(city.longitude).toFixed(4)}°
              {city.longitude >= 0 ? 'E' : 'W'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">入选理由</p>
        <ul className="city-reason-list">
          {city.reasons.map((reason) => (
            <li key={reason}>{cityReasonLabels[reason]}</li>
          ))}
        </ul>
      </section>

      <details className="country-sources">
        <summary>资料来源（{sources.length}）</summary>
        <ul>
          {sources.map((source) =>
            source ? (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.name}
                </a>
                <span>
                  {source.publisher}
                  {source.version ? ` · v${source.version}` : ''}
                </span>
                <small>{source.license}</small>
              </li>
            ) : null,
          )}
        </ul>
      </details>
    </>
  )
}
