import { countriesByCode } from '../../data/countries'
import { waterbodyKindLabels } from '../../data/waterbodies'
import type { Waterbody } from '../../data/waterbodySchema'
import { DetailPanelShell } from './DetailPanelShell'
import { ExpandableItems } from './ExpandableItems'

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 1,
})

export function WaterbodyDetailPanel({
  waterbody,
  onClose,
  onSelectCountry,
}: {
  waterbody: Waterbody
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
}) {
  return (
    <DetailPanelShell
      label={`${waterbody.name.zh}水域知识卡`}
      closeLabel="关闭水域知识卡"
      identity={waterbody.id}
      onClose={onClose}
      footer={
        <p className="prototype-note">
          示意范围仅用于地理学习，不代表领海、专属经济区、管辖权或法定边界。
        </p>
      }
    >
      <div className="waterbody-detail-heading">
        <span
          className={`waterbody-detail-symbol is-${waterbody.layer}`}
          aria-hidden="true"
        />
        <div>
          <p>{waterbodyKindLabels[waterbody.kind]}</p>
          <h2>{waterbody.name.zh}</h2>
          <span>{waterbody.name.en}</span>
        </div>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">位置概览</p>
        <p className="waterbody-summary">{waterbody.summary}</p>
        <dl className="city-detail-facts">
          <div>
            <dt>所在区域</dt>
            <dd>{waterbody.region}</dd>
          </div>
          {waterbody.areaSquareKilometers ? (
            <div>
              <dt>面积</dt>
              <dd>
                {numberFormatter.format(waterbody.areaSquareKilometers)} km²
              </dd>
            </div>
          ) : null}
          {waterbody.lengthKilometers ? (
            <div>
              <dt>长度</dt>
              <dd>{numberFormatter.format(waterbody.lengthKilometers)} km</dd>
            </div>
          ) : null}
          {waterbody.maxDepthMeters ? (
            <div>
              <dt>最大深度</dt>
              <dd>{numberFormatter.format(waterbody.maxDepthMeters)} m</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">相邻陆地与岛屿</p>
        <div className="waterbody-tag-list">
          {waterbody.adjacentLandmasses.map((landmass) => (
            <span key={landmass}>{landmass}</span>
          ))}
        </div>
        {waterbody.adjacentCountryCodes.length ? (
          <ExpandableItems
            key={`${waterbody.id}:countries`}
            items={waterbody.adjacentCountryCodes}
            previewCount={6}
            expandLabel="相邻国家和地区"
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
        ) : null}
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">你知道吗？</p>
        <ol className="fun-fact-list">
          {waterbody.facts.map((fact, index) => (
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
