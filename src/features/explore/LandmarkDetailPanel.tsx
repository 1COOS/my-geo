import { countriesByCode } from '../../data/countries'
import { landmarkCategoryLabels } from '../../data/landmarks'
import type { Landmark } from '../../data/landmarkSchema'
import { DetailPanelShell } from './DetailPanelShell'

export function LandmarkDetailPanel({
  landmark,
  onClose,
  onSelectCountry,
}: {
  landmark: Landmark
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
}) {
  const country = countriesByCode.get(landmark.countryCode)

  return (
    <DetailPanelShell
      label={`${landmark.name.zh}古迹知识卡`}
      closeLabel={`关闭${landmark.name.zh}古迹知识卡`}
      identity={landmark.id}
      onClose={onClose}
    >
      <div className="waterbody-detail-heading landmark-heading">
        <span className="landmark-symbol" aria-hidden="true" />
        <div>
          <p>{landmarkCategoryLabels[landmark.category]}</p>
          <h2>{landmark.name.zh}</h2>
          <span>{landmark.name.en}</span>
        </div>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">历史概览</p>
        <p className="waterbody-summary">{landmark.summary}</p>
        <dl className="city-detail-facts">
          <div>
            <dt>所在地区</dt>
            <dd>
              {landmark.location.zh}
              <small>{landmark.location.en}</small>
            </dd>
          </div>
          <div>
            <dt>代表年代</dt>
            <dd>
              {landmark.period.zh}
              <small>{landmark.period.en}</small>
            </dd>
          </div>
        </dl>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">建筑与遗址特色</p>
        <div className="waterbody-tag-list landmark-tag-list">
          {landmark.features.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
      </section>

      {country ? (
        <section className="country-detail-section">
          <p className="country-detail-label">所在国家</p>
          <div className="country-border-list">
            <button
              type="button"
              onClick={() => onSelectCountry(country.code)}
              aria-label={`探索${country.name.zh}`}
            >
              <img src={country.flagAsset} alt="" />
              <span>{country.name.zh}</span>
            </button>
          </div>
        </section>
      ) : null}

      <section className="country-detail-section">
        <p className="country-detail-label">你知道吗？</p>
        <ol className="fun-fact-list landmark-fact-list">
          {landmark.facts.map((fact, index) => (
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
