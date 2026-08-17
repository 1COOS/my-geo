import { countriesByCode } from '../../data/countries'
import type { City, CitySelectionReason } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
import { DetailPanelShell } from './DetailPanelShell'
import { ExpandableItems } from './ExpandableItems'

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
  return (
    <DetailPanelShell
      label={
        selectedCity
          ? `${selectedCity.name.zh}城市知识卡`
          : `${country.name.zh}国家知识卡`
      }
      closeLabel={selectedCity ? '关闭城市知识卡' : '关闭国家知识卡'}
      identity={`${country.code}:${selectedCity?.id ?? 'country'}`}
      onClose={onClose}
      footer={
        <p className="prototype-note">
          原型地图 · 公开发布前需重新评估地图合规
        </p>
      }
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
    </DetailPanelShell>
  )
}

type CountryDetailViewProps = {
  country: Country
  cities: City[]
  onSelectCountry: (countryCode: string) => void
  onSelectCity: (cityId: string) => void
}

function CountryDetailView({
  country,
  cities,
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
          <small className="country-detail-official">
            {country.officialName.zh} · {country.officialName.en}
          </small>
        </div>
      </div>

      <dl className="detail-facts-grid country-overview-grid">
        <div>
          <dt>首都</dt>
          <dd>
            {country.capitals.length > 0 ? (
              <span className="detail-value-stack">
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
        <div>
          <dt>人口</dt>
          <dd>
            <strong>
              约 {populationFormatter.format(country.population)} 人
            </strong>
            <small>{country.populationYear} 年</small>
          </dd>
        </div>
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
        <div>
          <dt>语言</dt>
          <dd>
            <ExpandableItems
              key={`${country.code}:languages`}
              items={country.languages}
              previewCount={2}
              expandLabel="语言"
              renderItems={(languages) => (
                <ul className="country-data-list">
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
        <div>
          <dt>货币</dt>
          <dd>
            <ExpandableItems
              key={`${country.code}:currencies`}
              items={country.currencies}
              previewCount={2}
              expandLabel="货币"
              renderItems={(currencies) => (
                <ul className="country-data-list">
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
      </dl>

      <section
        className="country-detail-section"
        aria-labelledby="cities-title"
      >
        <p id="cities-title" className="country-detail-label">
          首都与主要城市
        </p>
        <ExpandableItems
          key={`${country.code}:cities`}
          items={cities}
          previewCount={3}
          expandLabel="主要城市"
          renderItems={(visibleCities) => (
            <ul className="city-list">
              {visibleCities.map((city) => (
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
          )}
        />
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">相邻国家与地区</p>
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
                        <img src={borderCountry.flagAsset} alt="" />
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
    </>
  )
}

type CityDetailViewProps = {
  country: Country
  city: City
  onBack: () => void
}

function CityDetailView({ country, city, onBack }: CityDetailViewProps) {
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
    </>
  )
}
