import { Link, useSearchParams } from 'react-router-dom'

import {
  getKnowledgeRegionsForContinent,
  knowledgeContinents,
  knowledgeContinentIdSchema,
  type KnowledgeContinentId,
} from '../../data/knowledgeRegions'
import { KnowledgeRegionMap } from './KnowledgeRegionMap'
import { KnowledgeTopicNavigation } from './KnowledgeTopicNavigation'

export function KnowledgePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedContinent = knowledgeContinentIdSchema.safeParse(
    searchParams.get('continent'),
  )
  const continentId: KnowledgeContinentId = parsedContinent.success
    ? parsedContinent.data
    : 'asia'
  const regions = getKnowledgeRegionsForContinent(continentId)

  return (
    <main className="knowledge-shell">
      <KnowledgeTopicNavigation activeTopic="countries" />

      <section className="knowledge-regions" aria-label="按区域认识世界">
        <div
          className="knowledge-continent-tabs"
          role="tablist"
          aria-label="大洲"
        >
          {knowledgeContinents.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === continentId}
              onClick={() => setSearchParams({ continent: item.id })}
            >
              <strong>{item.name.zh}</strong>
              <span>{item.name.en}</span>
            </button>
          ))}
        </div>

        <div className="knowledge-region-workspace">
          <div className="knowledge-map-card">
            <KnowledgeRegionMap
              continentId={continentId}
              onSelectContinent={(nextContinentId) =>
                setSearchParams({ continent: nextContinentId })
              }
            />
          </div>
          <div className="knowledge-region-grid">
            {regions.map((region, index) => (
              <Link
                key={region.id}
                to={`/knowledge/countries/${region.id}`}
                className="knowledge-region-card"
                data-testid={`knowledge-region-${region.id}`}
                style={
                  { '--region-accent': region.accent } as React.CSSProperties
                }
              >
                <span className="knowledge-region-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{region.name.zh}</h3>
                  <p>{region.name.en}</p>
                </div>
                <strong>{region.countryCodes.length} 国</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
