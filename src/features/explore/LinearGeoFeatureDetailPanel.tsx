import { countriesByCode, getCountrySource } from '../../data/countries'
import { linearGeoFeatureKindLabels } from '../../data/linearGeoFeatures'
import type { LinearGeoFeature } from '../../data/linearGeoFeatureSchema'
import { DetailPanelShell } from './DetailPanelShell'

const lengthFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 1,
})

export function LinearGeoFeatureDetailPanel({
  feature,
  onClose,
  onSelectCountry,
}: {
  feature: LinearGeoFeature
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
}) {
  const sources = feature.sourceIds.flatMap((sourceId) => {
    const source = getCountrySource(sourceId)
    return source ? [source] : []
  })

  return (
    <DetailPanelShell
      label={`${feature.name.zh}知识卡`}
      closeLabel={`关闭${linearGeoFeatureKindLabels[feature.kind]}知识卡`}
      identity={feature.id}
      onClose={onClose}
      footer={
        <p className="prototype-note">
          线路为教育性简化中心线，不代表航道保证、行政边界、水权或实时水文状态。
        </p>
      }
    >
      <div className="waterbody-detail-heading linear-feature-heading">
        <span
          className={`linear-feature-symbol is-${feature.kind}`}
          aria-hidden="true"
        />
        <div>
          <p>{linearGeoFeatureKindLabels[feature.kind]}</p>
          <h2>{feature.name.zh}</h2>
          <span>{feature.name.en}</span>
        </div>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">地理概览</p>
        <p className="waterbody-summary">{feature.summary}</p>
        <dl className="city-detail-facts">
          <div>
            <dt>所在区域</dt>
            <dd>{feature.region}</dd>
          </div>
          <div>
            <dt>长度</dt>
            <dd>
              {feature.approximateLength ? '约 ' : ''}
              {lengthFormatter.format(feature.lengthKilometers)} km
            </dd>
          </div>
          {feature.kind === 'river' ? (
            <>
              <div>
                <dt>源头</dt>
                <dd>{feature.source}</dd>
              </div>
              <div>
                <dt>河口</dt>
                <dd>{feature.mouth}</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt>起点</dt>
                <dd>{feature.start}</dd>
              </div>
              <div>
                <dt>终点</dt>
                <dd>{feature.end}</dd>
              </div>
              {feature.openedYear ? (
                <div>
                  <dt>代表性通航年份</dt>
                  <dd>{feature.openedYear} 年</dd>
                </div>
              ) : null}
            </>
          )}
        </dl>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">
          {feature.kind === 'river' ? '流经区域' : '连接水域'}
        </p>
        <div className="waterbody-tag-list">
          {(feature.kind === 'river'
            ? feature.traversedRegions
            : feature.connectedWaters
          ).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="country-border-list waterbody-country-list">
          {feature.countryCodes.map((countryCode) => {
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
          {feature.facts.map((fact, index) => (
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
