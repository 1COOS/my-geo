import { Link, useSearchParams } from 'react-router-dom'

import {
  getKnowledgeRegionsForContinent,
  knowledgeContinents,
  knowledgeContinentIdSchema,
  type KnowledgeContinentId,
} from '../../data/knowledgeRegions'
import { KnowledgeRegionMap } from './KnowledgeRegionMap'
import { useKnowledgeProgress } from './useKnowledgeProgress'

const futureTopics = [
  { name: '气候', note: '世界气候类型与分布规律' },
  { name: '地形', note: '山脉、高原、平原与盆地' },
  { name: '水域', note: '海洋、河流、湖泊与运河' },
]

export function KnowledgePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedContinent = knowledgeContinentIdSchema.safeParse(
    searchParams.get('continent'),
  )
  const continentId: KnowledgeContinentId = parsedContinent.success
    ? parsedContinent.data
    : 'asia'
  const continent = knowledgeContinents.find((item) => item.id === continentId)!
  const regions = getKnowledgeRegionsForContinent(continentId)
  const { progressByRegion } = useKnowledgeProgress()

  return (
    <main className="knowledge-shell">
      <section className="knowledge-topics" aria-label="知识主题">
        <div className="knowledge-topic-grid">
          <article className="knowledge-topic-card is-active">
            <div className="knowledge-topic-copy">
              <h1>国家 · 国旗 · 首都</h1>
              <p>按区域认识国家，用即时挑战检验学习成果。</p>
            </div>
            <div className="knowledge-topic-stats" aria-label="国家知识范围">
              <div>
                <strong>195</strong>
                <span>个国家</span>
              </div>
              <i aria-hidden="true" />
              <div>
                <strong>23</strong>
                <span>个地区</span>
              </div>
            </div>
          </article>
          {futureTopics.map((topic) => (
            <article
              className="knowledge-topic-card is-locked"
              key={topic.name}
            >
              <div>
                <span>即将开放</span>
                <h3>{topic.name}</h3>
                <p>{topic.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

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
            <div>
              <span>当前大洲</span>
              <strong>{continent.name.zh}</strong>
              <small>{continent.name.en}</small>
            </div>
            <KnowledgeRegionMap continentId={continentId} />
          </div>
          <div className="knowledge-region-grid">
            {regions.map((region, index) => {
              const progress = progressByRegion.get(region.id)
              return (
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
                  <div className="knowledge-region-progress">
                    <span>
                      {progress?.passedAt
                        ? '已通过'
                        : progress
                          ? `最高 ${progress.bestScore}%`
                          : '尚未挑战'}
                    </span>
                    <i>
                      <b style={{ width: `${progress?.bestScore ?? 0}%` }} />
                    </i>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
