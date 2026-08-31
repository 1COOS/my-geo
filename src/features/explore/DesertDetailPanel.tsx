import { countriesByCode } from '../../data/countries'
import type { Desert } from '../../data/desertSchema'
import { CountryFlag } from '../../shared/components/CountryFlag'
import { DetailPanelShell } from './DetailPanelShell'
import { ExpandableItems } from './ExpandableItems'

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 0,
})

export function DesertDetailPanel({
  desert,
  onSelectCountry,
}: {
  desert: Desert
  onSelectCountry: (countryCode: string) => void
}) {
  return (
    <DetailPanelShell
      label={`${desert.name.zh}知识卡`}
      identity={desert.id}
      accent="#e9ad58"
    >
      <div className="waterbody-detail-heading desert-heading">
        <span className="desert-symbol" aria-hidden="true" />
        <div>
          <p>沙漠</p>
          <h2>{desert.name.zh}</h2>
          <span>{desert.name.en}</span>
        </div>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">地理概览</p>
        <p className="waterbody-summary">{desert.summary}</p>
        <dl className="city-detail-facts">
          <div>
            <dt>所在区域</dt>
            <dd>{desert.region}</dd>
          </div>
          <div>
            <dt>面积</dt>
            <dd>
              {desert.approximateArea ? '约 ' : ''}
              {numberFormatter.format(desert.areaSquareKilometers)} km²
            </dd>
          </div>
        </dl>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">典型景观</p>
        <div className="waterbody-tag-list desert-tag-list">
          {desert.landscape.map((landscape) => (
            <span key={landscape}>{landscape}</span>
          ))}
        </div>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">所在国家和地区</p>
        <ExpandableItems
          key={`${desert.id}:countries`}
          items={desert.countryCodes}
          previewCount={6}
          expandLabel="所在国家和地区"
          renderItems={(countryCodes) => (
            <div className="country-border-list waterbody-country-list">
              {countryCodes.map((countryCode) => {
                const country = countriesByCode.get(countryCode)
                return country ? (
                  <button
                    key={countryCode}
                    type="button"
                    onClick={() => onSelectCountry(countryCode)}
                  >
                    <CountryFlag src={country.flagAsset} alt="" />
                    <span>{country.name.zh}</span>
                  </button>
                ) : null
              })}
            </div>
          )}
        />
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">你知道吗？</p>
        <ol className="fun-fact-list desert-fact-list">
          {desert.facts.map((fact, index) => (
            <li key={fact}>
              <span>{index + 1}</span>
              <p>{fact}</p>
            </li>
          ))}
        </ol>
      </section>
    </DetailPanelShell>
  )
}
