import { countriesByCode, getCountrySource } from '../../data/countries'
import type { MountainRange } from '../../data/mountainRangeSchema'
import { DetailPanelShell } from './DetailPanelShell'

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
  const sources = range.sourceIds.flatMap((sourceId) => {
    const source = getCountrySource(sourceId)
    return source ? [source] : []
  })

  return (
    <DetailPanelShell
      label={`${range.name.zh}知识卡`}
      closeLabel={`关闭${range.name.zh}知识卡`}
      identity={range.id}
      onClose={onClose}
      footer={
        <p className="prototype-note">
          山脊线与峰顶标记为教育性示意，不是地形高程模型、登山路线、完整山界或行政与主权边界。
        </p>
      }
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
        <div className="country-border-list waterbody-country-list">
          {range.countryCodes.map((countryCode) => {
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

      <details className="country-sources">
        <summary>资料来源（{sources.length}）</summary>
        <ul>
          {sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>
              <span>
                {source.publisher}
                {source.version ? ` · ${source.version}` : ''}
                {source.accessedAt ? ` · 查阅于 ${source.accessedAt}` : ''}
              </span>
              <small>{source.license}</small>
            </li>
          ))}
        </ul>
      </details>
    </DetailPanelShell>
  )
}
