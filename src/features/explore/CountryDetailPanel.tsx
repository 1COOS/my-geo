import type { City } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
import { knowledgeRegionByCountryCode } from '../../data/knowledgeRegions'
import { CountryKnowledgeCard } from '../country-knowledge/CountryKnowledgeCard'

type CountryDetailPanelProps = {
  country: Country
  cities: City[]
  selectedCity: City | undefined
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
  onSelectCity: (cityId: string) => void
  onBackToCountry: () => void
}

export function CountryDetailPanel({
  country,
  cities,
  selectedCity,
  onClose,
  onSelectCountry,
  onSelectCity,
  onBackToCountry,
}: CountryDetailPanelProps) {
  const region = knowledgeRegionByCountryCode.get(country.code)

  return (
    <CountryKnowledgeCard
      country={country}
      cities={cities}
      selectedCity={selectedCity}
      label={
        selectedCity
          ? `${selectedCity.name.zh}城市知识卡`
          : `${country.name.zh}国家知识卡`
      }
      closeLabel={selectedCity ? '关闭城市知识卡' : '关闭国家知识卡'}
      identity={`${country.code}:${selectedCity?.id ?? 'country'}`}
      onClose={onClose}
      onSelectCountry={onSelectCountry}
      onSelectCity={onSelectCity}
      onBackToCountry={onBackToCountry}
      footerAction={
        region
          ? {
              to: `/knowledge/countries/${region.id}?country=${country.code}`,
              label: '在知识体系中学习',
              description: `打开${region.name.zh}国家学习详情`,
            }
          : undefined
      }
    />
  )
}
