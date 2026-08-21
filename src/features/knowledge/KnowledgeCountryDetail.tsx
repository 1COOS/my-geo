import { getCitiesForCountry } from '../../data/countries'
import type { Country } from '../../data/countrySchema'
import {
  getKnowledgeRegion,
  type KnowledgeRegionId,
} from '../../data/knowledgeRegions'
import { CountryKnowledgeCard } from '../country-knowledge/CountryKnowledgeCard'

type KnowledgeCountryDetailProps = {
  country: Country
  regionId: KnowledgeRegionId
  onClose: () => void
  onSelectCountry: (countryCode: string) => void
}

export function KnowledgeCountryDetail({
  country,
  regionId,
  onClose,
  onSelectCountry,
}: KnowledgeCountryDetailProps) {
  const region = getKnowledgeRegion(regionId)!

  return (
    <CountryKnowledgeCard
      country={country}
      cities={getCitiesForCountry(country.code)}
      label={`${country.name.zh}国家学习详情`}
      closeLabel="关闭国家学习详情"
      identity={`${country.code}:knowledge`}
      onClose={onClose}
      onSelectCountry={onSelectCountry}
      footerAction={{
        to: `/explore?country=${country.code}`,
        label: '在3D地球上查看',
        description: `从${region.name.zh}返回探索模式`,
      }}
    />
  )
}
