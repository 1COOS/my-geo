import { useSearchParams } from 'react-router-dom'

import {
  getKnowledgeRegionsForContinent,
  knowledgeContinents,
  knowledgeContinentIdSchema,
  type KnowledgeContinentId,
} from '../../data/knowledgeRegions'
import { KnowledgeRegionMap } from './KnowledgeRegionMap'
import { KnowledgeCategoryCards } from './KnowledgeCategoryCards'
import { KnowledgeMapWorkbenchPage } from './KnowledgeMapWorkbench'
import { KnowledgePrimaryTabs } from './KnowledgePrimaryTabs'

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
    <KnowledgeMapWorkbenchPage
      label="按区域认识世界"
      title="国家首都"
      renderControls={(compact) => (
        <KnowledgePrimaryTabs
          activeId={continentId}
          compact={compact}
          getTo={(item) => `/knowledge?continent=${item.id}`}
          items={knowledgeContinents.map((item) => ({
            id: item.id,
            label: item.name.zh,
            secondary: item.name.en,
          }))}
          label="大洲"
        />
      )}
      renderMap={(compact) => (
        <div
          className="knowledge-map-card"
          style={{
            width: compact ? 'min(100%, 24rem)' : 'min(100%, 70rem)',
            marginInline: 'auto',
          }}
        >
          <KnowledgeRegionMap
            continentId={continentId}
            onSelectContinent={(nextContinentId) =>
              setSearchParams({ continent: nextContinentId })
            }
          />
        </div>
      )}
      renderResults={(compact) => (
        <KnowledgeCategoryCards
          compact={compact}
          label={`${knowledgeContinents.find((item) => item.id === continentId)!.name.zh}区域`}
          items={regions.map((region) => ({
            id: region.id,
            title: region.name.zh,
            subtitle: region.name.en,
            meta: `${region.countryCodes.length} 国`,
            to: `/knowledge/countries/${region.id}`,
            accent: region.accent,
            testId: `knowledge-region-${region.id}`,
          }))}
        />
      )}
    />
  )
}
