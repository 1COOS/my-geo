import { countriesByCode, getCountrySource } from '../../data/countries'
import type { Desert } from '../../data/desertSchema'
import { DetailPanelShell } from './DetailPanelShell'

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 0,
})

export function DesertDetailPanel({
  desert,
  onClose,
  onSelectCountry,
}: {
  desert: Desert
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
}) {
  const sources = desert.sourceIds.flatMap((sourceId) => {
    const source = getCountrySource(sourceId)
    return source ? [source] : []
  })

  return (
    <DetailPanelShell
      label={`${desert.name.zh}知识卡`}
      closeLabel={`关闭${desert.name.zh}知识卡`}
      identity={desert.id}
      onClose={onClose}
      footer={
        <p className="prototype-note">
          沙漠轮廓为地理学习示意，表示大致自然区域，不是生态分区、土地利用、行政或主权边界。
        </p>
      }
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
          <div>
            <dt>代表坐标</dt>
            <dd>
              {Math.abs(desert.center.latitude).toFixed(1)}°
              {desert.center.latitude >= 0 ? 'N' : 'S'} ·{' '}
              {Math.abs(desert.center.longitude).toFixed(1)}°
              {desert.center.longitude >= 0 ? 'E' : 'W'}
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
        <div className="country-border-list waterbody-country-list">
          {desert.countryCodes.map((countryCode) => {
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
        <ol className="fun-fact-list desert-fact-list">
          {desert.facts.map((fact, index) => (
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
