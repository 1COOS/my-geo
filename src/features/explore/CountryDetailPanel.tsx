import type { City } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
import { knowledgeRegionByCountryCode } from '../../data/knowledgeRegions'
import { CountryKnowledgeCard } from '../country-knowledge/CountryKnowledgeCard'

type CountryDetailPanelProps = {
  country: Country
  cities: City[]
  onSelectCountry: (countryCode: string) => void
  onSelectTerritory?: (territoryId: string) => void
}

export function CountryDetailPanel({
  country,
  cities,
  onSelectCountry,
  onSelectTerritory,
}: CountryDetailPanelProps) {
  const region = knowledgeRegionByCountryCode.get(country.code)

  return (
    <CountryKnowledgeCard
      country={country}
      cities={cities}
      label={`${country.name.zh}国家知识卡`}
      identity={`${country.code}:country`}
      onSelectCountry={onSelectCountry}
      onSelectTerritory={onSelectTerritory}
      footerAction={
        region
          ? {
              to: `/knowledge/countries/${region.id}?country=${country.code}`,
              label: '在图鉴中学习',
              description: `打开${region.name.zh}国家学习详情`,
            }
          : undefined
      }
    />
  )
}
