import { useMemo, useState, type CSSProperties } from 'react'
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
import { CountryFlag } from '../../shared/components/CountryFlag'
import { KnowledgeCountryDetail } from './KnowledgeCountryDetail'
import { KnowledgeRegionMap } from './KnowledgeRegionMap'
import { KnowledgeRegionOverviewCard } from './KnowledgeRegionOverviewCard'
import { useKnowledgeProgress } from './useKnowledgeProgress'

type CountryCardField = 'country' | 'flag' | 'capital'

const countryCardFields: Array<{
  id: CountryCardField
  label: string
}> = [
  { id: 'flag', label: '国旗' },
  { id: 'country', label: '国家' },
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
  const { persistenceStatus } = useKnowledgeProgress()

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
  const showCountry = visibleCardFields.has('country')
  const showFlag = visibleCardFields.has('flag')
  const showCapital = visibleCardFields.has('capital')
  const regionHeaderStyle = {
    '--knowledge-region-title-accent': region.accent,
  } as CSSProperties
  const countryGridStyle = {
    '--knowledge-country-columns-wide': Math.min(regionCountries.length, 5),
    '--knowledge-country-columns-detail': Math.min(regionCountries.length, 5),
    '--knowledge-country-columns-tablet': Math.min(regionCountries.length, 3),
    '--knowledge-country-columns-compact': Math.min(regionCountries.length, 2),
  } as CSSProperties

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
    <main className="knowledge-shell knowledge-region-shell">
      <div className="knowledge-region-content">
        <section
          className="knowledge-region-study"
          aria-label={`${region.name.zh}国家学习`}
        >
          <header
            className="knowledge-region-page-header"
            style={regionHeaderStyle}
          >
            <Link
              className="knowledge-earth-detail-back"
              to={`/knowledge?continent=${region.continentId}`}
            >
              ← 返回{continent.name.zh}
            </Link>
            <h1>
              {region.name.zh}
              <strong>{region.countryCodes.length}</strong>国
            </h1>
          </header>
          <div className="knowledge-region-map-strip">
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
            {persistenceStatus === 'memory-only' ||
            persistenceStatus === 'error' ? (
              <output className="knowledge-persistence-status" role="status">
                {persistenceStatus === 'memory-only'
                  ? '当前浏览器无法使用本机存储，学习进度不会保留。'
                  : '读取本机学习进度失败，当前显示安全默认值。'}
              </output>
            ) : null}
          </div>

          <div className="knowledge-country-grid" style={countryGridStyle}>
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
                    <CountryFlag
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
                      <strong>
                        {country.capitals
                          .map((capital) => capital.name.zh)
                          .join('、') || '暂无资料'}
                      </strong>
                      <small>
                        {country.capitals
                          .map((capital) => capital.name.en)
                          .join(' / ') || 'No data'}
                      </small>
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
        <KnowledgeRegionOverviewCard
          continentName={continent.name.zh}
          countries={regionCountries}
          region={region}
        />
      )}
    </main>
  )
}
