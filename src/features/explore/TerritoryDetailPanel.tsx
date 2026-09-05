import type { Territory } from '../../data/territorySchema'
import { TerritoryKnowledgeCard } from '../country-knowledge/TerritoryKnowledgeCard'

type TerritoryDetailPanelProps = {
  territory: Territory
  onSelectCountry: (countryCode: string) => void
}

export function TerritoryDetailPanel({
  territory,
  onSelectCountry,
}: TerritoryDetailPanelProps) {
  return (
    <TerritoryKnowledgeCard
      territory={territory}
      onSelectCountry={onSelectCountry}
    />
  )
}
