import { useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { getCountry } from '../../data/countries'
import {
  getCountriesForKnowledgeRegion,
  getKnowledgeRegion,
  knowledgeContinents,
  knowledgeRegionByCountryCode,
} from '../../data/knowledgeRegions'
import { KnowledgeCountryDetail } from './KnowledgeCountryDetail'
import { KnowledgeRegionMap } from './KnowledgeRegionMap'
import { useKnowledgeProgress } from './useKnowledgeProgress'

type CountryCardField = 'country' | 'flag' | 'capital'

const countryCardFields: Array<{
  id: CountryCardField
  label: string
}> = [
  { id: 'country', label: '国家' },
  { id: 'flag', label: '国旗' },
  { id: 'capital', label: '首都' },
]

export function KnowledgeRegionPage() {
  const { regionId: rawRegionId } = useParams()
  const navigate = useNavigate()
  const region = getKnowledgeRegion(rawRegionId)
  const [searchParams, setSearchParams] = useSearchParams()
  const [visibleCardFields, setVisibleCardFields] = useState<
    Set<CountryCardField>
  >(new Set<CountryCardField>(['flag']))
  const { progressByRegion, persistenceStatus } = useKnowledgeProgress()

  const regionCountries = useMemo(
    () => (region ? getCountriesForKnowledgeRegion(region.id) : []),
    [region],
  )
  if (!region) return <Navigate to="/knowledge" replace />

  const continent = knowledgeContinents.find(
    (item) => item.id === region.continentId,
  )!
  const requestedCountry = getCountry(searchParams.get('country'))
  const selectedCountry = region.countryCodes.includes(
    requestedCountry?.code ?? '',
  )
    ? requestedCountry
    : undefined
  const progress = progressByRegion.get(region.id)
  const showCountry = visibleCardFields.has('country')
  const showFlag = visibleCardFields.has('flag')
  const showCapital = visibleCardFields.has('capital')

  const toggleCardField = (field: CountryCardField) => {
    setVisibleCardFields((current) => {
      const next = new Set(current)
      if (next.has(field)) {
        if (next.size === 1) return current
        next.delete(field)
      } else {
        next.add(field)
      }
      return next
    })
  }

  const openCountry = (countryCode: string) => {
    const targetRegion = knowledgeRegionByCountryCode.get(countryCode)
    if (!targetRegion) return
    if (targetRegion.id === region.id) {
      setSearchParams({ country: countryCode })
      return
    }
    void navigate(
      `/knowledge/countries/${targetRegion.id}?country=${countryCode}`,
    )
  }

  return (
    <main
      className={
        selectedCountry
          ? 'knowledge-shell knowledge-region-shell has-country-selection'
          : 'knowledge-shell knowledge-region-shell'
      }
    >
      <div className="knowledge-region-content">
        <section
          className="knowledge-region-study"
          aria-label={`${region.name.zh}国家学习`}
        >
          <div className="knowledge-region-map-strip">
            <div className="knowledge-region-map-toolbar">
              <div className="knowledge-region-map-identity">
                <Link to={`/knowledge?continent=${region.continentId}`}>
                  ← 返回{continent.name.zh}
                </Link>
                <span>WORLD POSITION</span>
                <h1>{region.name.zh}</h1>
              </div>
            </div>
            <KnowledgeRegionMap
              continentId={region.continentId}
              regionId={region.id}
              selectedCountryCode={selectedCountry?.code}
            />
          </div>

          <div className="knowledge-country-controls-row">
            <div
              className="knowledge-country-display-controls"
              role="group"
              aria-label="国家卡显示内容"
            >
              {countryCardFields.map((field) => {
                const active = visibleCardFields.has(field.id)
                return (
                  <button
                    key={field.id}
                    type="button"
                    aria-pressed={active}
                    disabled={active && visibleCardFields.size === 1}
                    onClick={() => toggleCardField(field.id)}
                  >
                    {field.label}
                  </button>
                )
              })}
            </div>
            <div className="knowledge-region-map-actions">
              <div>
                <strong>{region.countryCodes.length}</strong>
                <span>个国家</span>
              </div>
              <div>
                <strong data-testid="knowledge-region-best-score">
                  {progress?.bestScore ?? 0}%
                </strong>
                <span>{progress?.passedAt ? '已通过' : '最高成绩'}</span>
              </div>
              <Link to={`/knowledge/countries/${region.id}/challenge`}>
                开始区域挑战
              </Link>
            </div>
            {persistenceStatus === 'memory-only' ||
            persistenceStatus === 'error' ? (
              <output className="knowledge-persistence-status" role="status">
                {persistenceStatus === 'memory-only'
                  ? '当前浏览器无法使用本机存储，学习进度不会保留。'
                  : '读取本机学习进度失败，当前显示安全默认值。'}
              </output>
            ) : null}
          </div>

          <div className="knowledge-country-grid">
            {regionCountries.map((country) => (
              <article
                className="knowledge-country-card"
                key={country.code}
                data-field-count={visibleCardFields.size}
                data-show-country={showCountry}
                data-show-flag={showFlag}
                data-show-capital={showCapital}
              >
                <button
                  className="knowledge-country-open"
                  type="button"
                  onClick={() => openCountry(country.code)}
                  aria-label={`查看${country.name.zh}国家详情`}
                >
                  {showFlag ? (
                    <img
                      src={country.flagAsset}
                      alt={`${country.name.zh}国旗`}
                    />
                  ) : null}
                  {showCountry ? (
                    <span className="knowledge-country-name">
                      <strong>{country.name.zh}</strong>
                      <small>{country.name.en}</small>
                    </span>
                  ) : null}
                  {showCapital ? (
                    <span className="knowledge-country-card-capital">
                      <small>首都</small>
                      <strong>
                        {country.capitals
                          .map((capital) => capital.name.zh)
                          .join('、') || '暂无资料'}
                      </strong>
                    </span>
                  ) : null}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      {selectedCountry ? (
        <KnowledgeCountryDetail
          country={selectedCountry}
          regionId={region.id}
          onClose={() => setSearchParams({})}
          onSelectCountry={openCountry}
        />
      ) : (
        <aside
          className="knowledge-country-detail knowledge-country-detail-placeholder"
          aria-label="国家详情提示"
        >
          <div>
            <h2>选择一个国家查看详情</h2>
            <p>点击左侧国家卡，查看首都、语言、货币和地理亮点。</p>
          </div>
        </aside>
      )}
    </main>
  )
}
