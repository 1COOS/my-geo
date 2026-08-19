import { countriesByCode } from '../../data/countries'
import type { MountainRange } from '../../data/mountainRangeSchema'
import { DetailPanelShell } from './DetailPanelShell'
import { ExpandableItems } from './ExpandableItems'

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 0,
})

export function MountainRangeDetailPanel({
  range,
  onClose,
  onSelectCountry,
}: {
  range: MountainRange
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
}) {
  return (
    <DetailPanelShell
      label={`${range.name.zh}知识卡`}
      closeLabel={`关闭${range.name.zh}知识卡`}
      identity={range.id}
      onClose={onClose}
    >
      <div className="waterbody-detail-heading mountain-range-heading">
        <span className="mountain-range-symbol" aria-hidden="true" />
        <div>
          <p>山脉</p>
          <h2>{range.name.zh}</h2>
          <span>{range.name.en}</span>
        </div>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">地理概览</p>
        <p className="waterbody-summary">{range.summary}</p>
        <dl className="city-detail-facts">
          <div>
            <dt>所在区域</dt>
            <dd>{range.region}</dd>
          </div>
          {range.lengthKilometers ? (
            <div>
              <dt>长度</dt>
              <dd>
                {range.approximateLength ? '约 ' : ''}
                {numberFormatter.format(range.lengthKilometers)} km
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="country-detail-section mountain-peak-section">
        <p className="country-detail-label">最高峰</p>
        <div className="mountain-peak-card">
          <span className="mountain-peak-card-icon" aria-hidden="true" />
          <div>
            <strong>{range.highestPeak.name.zh}</strong>
            <span>{range.highestPeak.name.en}</span>
          </div>
          <b>
            {range.highestPeak.approximateElevation ? '约 ' : ''}
            {numberFormatter.format(range.highestPeak.elevationMeters)} m
          </b>
        </div>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">所在国家和地区</p>
        <ExpandableItems
          key={`${range.id}:countries`}
          items={range.countryCodes}
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
                    <img src={country.flagAsset} alt="" />
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
        <ol className="fun-fact-list">
          {range.facts.map((fact, index) => (
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
