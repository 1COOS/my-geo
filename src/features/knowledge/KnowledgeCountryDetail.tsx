import { Link } from 'react-router-dom'

import { countriesByCode } from '../../data/countries'
import type { Country } from '../../data/countrySchema'
import {
  getKnowledgeRegion,
  type KnowledgeRegionId,
} from '../../data/knowledgeRegions'
import { CountryFlag } from '../../shared/components/CountryFlag'

type KnowledgeCountryDetailProps = {
  country: Country
  regionId: KnowledgeRegionId
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
}

const areaFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
})
const populationFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function KnowledgeCountryDetail({
  country,
  regionId,
  onClose,
  onSelectCountry,
}: KnowledgeCountryDetailProps) {
  const region = getKnowledgeRegion(regionId)!
  return (
    <aside
      className="knowledge-country-detail"
      aria-label={`${country.name.zh}国家学习详情`}
    >
      <button
        type="button"
        className="knowledge-country-detail-close"
        aria-label="关闭国家学习详情"
        onClick={onClose}
      >
        ×
      </button>
      <div className="knowledge-country-detail-heading">
        <CountryFlag src={country.flagAsset} alt={`${country.name.zh}国旗`} />
        <div>
          <span>{country.officialName.zh}</span>
          <h2>{country.name.zh}</h2>
          <p>
            {country.name.en} · {country.code}
          </p>
        </div>
      </div>

      <dl className="knowledge-country-facts">
        <div>
          <dt>首都</dt>
          <dd>
            {country.capitals.length
              ? country.capitals.map((capital) => capital.name.zh).join('、')
              : '暂无资料'}
          </dd>
        </div>
        <div>
          <dt>人口</dt>
          <dd>约 {populationFormatter.format(country.population)} 人</dd>
        </div>
        <div>
          <dt>面积</dt>
          <dd>{areaFormatter.format(country.areaSquareKilometers)} km²</dd>
        </div>
        <div>
          <dt>海陆位置</dt>
          <dd>{country.landlocked ? '内陆国' : '临海国家'}</dd>
        </div>
        <div>
          <dt>主要语言</dt>
          <dd>
            {country.languages.map((language) => language.name.zh).join('、')}
          </dd>
        </div>
        <div>
          <dt>货币</dt>
          <dd>
            {country.currencies.map((currency) => currency.name.zh).join('、')}
          </dd>
        </div>
      </dl>

      <section className="knowledge-country-highlights">
        <h3>地理亮点</h3>
        <ul>
          {country.highlights.map((highlight) => (
            <li key={highlight.text}>{highlight.text}</li>
          ))}
        </ul>
      </section>

      <section className="knowledge-country-neighbours">
        <h3>相邻国家</h3>
        {country.borderCountryCodes.length ? (
          <div>
            {country.borderCountryCodes.map((countryCode) => {
              const neighbour = countriesByCode.get(countryCode)
              return neighbour ? (
                <button
                  key={countryCode}
                  type="button"
                  onClick={() => onSelectCountry(countryCode)}
                >
                  <CountryFlag src={neighbour.flagAsset} alt="" />
                  <span>{neighbour.name.zh}</span>
                </button>
              ) : null
            })}
          </div>
        ) : (
          <p>没有陆地相邻国家</p>
        )}
      </section>

      <Link
        className="knowledge-view-on-globe"
        to={`/explore?country=${country.code}`}
      >
        <span>在3D地球上查看</span>
        <small>从{region.name.zh}返回探索模式</small>
      </Link>
    </aside>
  )
}
