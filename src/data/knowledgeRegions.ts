import { z } from 'zod'

import { countries } from './countries'
import type { Country } from './countrySchema'

export const knowledgeContinentIdSchema = z.enum([
  'asia',
  'europe',
  'africa',
  'americas',
  'oceania',
])

export const knowledgeRegionIdSchema = z.enum([
  'east-asia',
  'southeast-asia',
  'south-asia',
  'central-asia',
  'west-asia',
  'north-europe',
  'west-europe',
  'central-europe',
  'south-europe',
  'east-europe',
  'north-africa',
  'west-africa',
  'central-africa',
  'east-africa',
  'southern-africa',
  'north-america',
  'central-america',
  'caribbean',
  'south-america',
  'australia-new-zealand',
  'melanesia',
  'micronesia',
  'polynesia',
])

export type KnowledgeContinentId = z.infer<typeof knowledgeContinentIdSchema>
export type KnowledgeRegionId = z.infer<typeof knowledgeRegionIdSchema>

const localizedLabelSchema = z.object({
  zh: z.string().min(1),
  en: z.string().min(1),
})

const knowledgeRegionDefinitionSchema = z.object({
  id: knowledgeRegionIdSchema,
  continentId: knowledgeContinentIdSchema,
  name: localizedLabelSchema,
  description: z.string().min(1),
  sourceSubregions: z.array(z.string().min(1)).min(1),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
})

export const knowledgeRegionSchema = knowledgeRegionDefinitionSchema.extend({
  countryCodes: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1),
})

export const knowledgeContinentSchema = z.object({
  id: knowledgeContinentIdSchema,
  name: localizedLabelSchema,
  description: z.string().min(1),
})

const continentDefinitions = [
  {
    id: 'asia',
    name: { zh: '亚洲', en: 'Asia' },
    description: '从季风显著的东亚，到连接欧非的西亚，认识面积最大的大洲。',
  },
  {
    id: 'europe',
    name: { zh: '欧洲', en: 'Europe' },
    description: '沿着半岛、平原与海岸线，比较欧洲不同区域的国家。',
  },
  {
    id: 'africa',
    name: { zh: '非洲', en: 'Africa' },
    description: '跨越赤道与南北回归线，观察非洲丰富的自然和人文差异。',
  },
  {
    id: 'americas',
    name: { zh: '美洲', en: 'Americas' },
    description: '从北美洲到南美洲，沿大陆与岛屿认识西半球国家。',
  },
  {
    id: 'oceania',
    name: { zh: '大洋洲', en: 'Oceania' },
    description: '认识太平洋上的大陆国家、群岛国家与岛国。',
  },
] satisfies z.input<typeof knowledgeContinentSchema>[]

const regionAccentSequence = [
  '#4cc9f0',
  '#ff8a5b',
  '#8b8cff',
  '#f6c453',
  '#46d1a3',
] as const

const regionDefinitions = [
  {
    id: 'east-asia',
    continentId: 'asia',
    name: { zh: '东亚', en: 'Eastern Asia' },
    description: '位于亚洲东部，季风影响显著，人口与城市密集。',
    sourceSubregions: ['东亚'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'southeast-asia',
    continentId: 'asia',
    name: { zh: '东南亚', en: 'South-eastern Asia' },
    description: '连接亚洲与大洋洲，由中南半岛和众多岛屿组成。',
    sourceSubregions: ['东南亚'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'south-asia',
    continentId: 'asia',
    name: { zh: '南亚', en: 'Southern Asia' },
    description: '喜马拉雅山脉以南，印度洋北岸的重要区域。',
    sourceSubregions: ['南亚'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'central-asia',
    continentId: 'asia',
    name: { zh: '中亚', en: 'Central Asia' },
    description: '深居亚欧大陆内部，草原、荒漠与绿洲广布。',
    sourceSubregions: ['中亚'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'west-asia',
    continentId: 'asia',
    name: { zh: '西亚', en: 'Western Asia' },
    description: '处在亚欧非交会地带，海陆通道与能源资源重要。',
    sourceSubregions: ['西亚'],
    accent: regionAccentSequence[4],
  },
  {
    id: 'north-europe',
    continentId: 'europe',
    name: { zh: '北欧', en: 'Northern Europe' },
    description: '临近北大西洋和北极圈，峡湾、岛屿与湖泊众多。',
    sourceSubregions: ['北欧'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'west-europe',
    continentId: 'europe',
    name: { zh: '西欧', en: 'Western Europe' },
    description: '大西洋沿岸国家集中，城市化程度较高。',
    sourceSubregions: ['西欧'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'central-europe',
    continentId: 'europe',
    name: { zh: '中欧', en: 'Central Europe' },
    description: '位于欧洲中部，多条河流与交通通道在此交会。',
    sourceSubregions: ['中欧'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'south-europe',
    continentId: 'europe',
    name: { zh: '南欧', en: 'Southern Europe' },
    description: '地中海沿岸半岛众多，历史城市与海洋联系紧密。',
    sourceSubregions: ['南欧', '东南欧'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'east-europe',
    continentId: 'europe',
    name: { zh: '东欧', en: 'Eastern Europe' },
    description: '欧洲东部平原广阔，与亚洲内陆联系紧密。',
    sourceSubregions: ['东欧'],
    accent: regionAccentSequence[4],
  },
  {
    id: 'north-africa',
    continentId: 'africa',
    name: { zh: '北非', en: 'Northern Africa' },
    description: '位于撒哈拉沙漠以北，面向地中海和大西洋。',
    sourceSubregions: ['北非'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'west-africa',
    continentId: 'africa',
    name: { zh: '西非', en: 'Western Africa' },
    description: '从萨赫勒延伸到几内亚湾，气候和植被变化明显。',
    sourceSubregions: ['西非'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'central-africa',
    continentId: 'africa',
    name: { zh: '中非', en: 'Middle Africa' },
    description: '刚果盆地位于其中，赤道雨林分布广泛。',
    sourceSubregions: ['中非'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'east-africa',
    continentId: 'africa',
    name: { zh: '东非', en: 'Eastern Africa' },
    description: '高原、裂谷与印度洋海岸构成多样地貌。',
    sourceSubregions: ['东非'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'southern-africa',
    continentId: 'africa',
    name: { zh: '南部非洲', en: 'Southern Africa' },
    description: '位于非洲大陆南部，草原、高原与荒漠并存。',
    sourceSubregions: ['南部非洲'],
    accent: regionAccentSequence[4],
  },
  {
    id: 'north-america',
    continentId: 'americas',
    name: { zh: '北美洲', en: 'Northern America' },
    description: '横跨寒带到热带，拥有广阔平原和纵贯山系。',
    sourceSubregions: ['北美洲'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'central-america',
    continentId: 'americas',
    name: { zh: '中美洲', en: 'Central America' },
    description: '连接南北美洲的狭长陆桥，火山和热带景观丰富。',
    sourceSubregions: ['中美洲'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'caribbean',
    continentId: 'americas',
    name: { zh: '加勒比地区', en: 'Caribbean' },
    description: '加勒比海中的岛屿国家密集，海洋特色鲜明。',
    sourceSubregions: ['加勒比地区'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'south-america',
    continentId: 'americas',
    name: { zh: '南美洲', en: 'South America' },
    description: '安第斯山脉纵贯西部，亚马孙流域面积广大。',
    sourceSubregions: ['南美洲'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'australia-new-zealand',
    continentId: 'oceania',
    name: { zh: '澳大利亚和新西兰', en: 'Australia and New Zealand' },
    description: '大洋洲面积最大的两个国家，隔塔斯曼海相望。',
    sourceSubregions: ['澳大利亚和新西兰'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'melanesia',
    continentId: 'oceania',
    name: { zh: '美拉尼西亚', en: 'Melanesia' },
    description: '位于西南太平洋，由大岛和群岛国家组成。',
    sourceSubregions: ['美拉尼西亚'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'micronesia',
    continentId: 'oceania',
    name: { zh: '密克罗尼西亚', en: 'Micronesia' },
    description: '西太平洋众多小岛组成的岛屿区域。',
    sourceSubregions: ['密克罗尼西亚'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'polynesia',
    continentId: 'oceania',
    name: { zh: '波利尼西亚', en: 'Polynesia' },
    description: '分布在太平洋中部和南部广阔海域。',
    sourceSubregions: ['波利尼西亚'],
    accent: regionAccentSequence[3],
  },
] satisfies z.input<typeof knowledgeRegionDefinitionSchema>[]

const parsedDefinitions = z
  .array(knowledgeRegionDefinitionSchema)
  .length(23)
  .parse(regionDefinitions)

const derivedRegions = parsedDefinitions.map((definition) => ({
  ...definition,
  countryCodes: countries
    .filter((country) =>
      definition.sourceSubregions.includes(country.subregion.zh),
    )
    .map((country) => country.code),
}))

export const knowledgeRegions = z
  .array(knowledgeRegionSchema)
  .length(23)
  .superRefine((regions, context) => {
    const assignedCodes = new Map<string, string>()
    for (const region of regions) {
      for (const countryCode of region.countryCodes) {
        const existingRegion = assignedCodes.get(countryCode)
        if (existingRegion) {
          context.addIssue({
            code: 'custom',
            message: `${countryCode} appears in ${existingRegion} and ${region.id}`,
          })
        }
        assignedCodes.set(countryCode, region.id)
      }
    }

    for (const country of countries) {
      if (!assignedCodes.has(country.code)) {
        context.addIssue({
          code: 'custom',
          message: `${country.code} is missing from knowledge regions`,
        })
      }
    }

    if (assignedCodes.size !== countries.length) {
      context.addIssue({
        code: 'custom',
        message: `Expected ${countries.length} unique countries, received ${assignedCodes.size}`,
      })
    }
  })
  .parse(derivedRegions)

export const knowledgeContinents = z
  .array(knowledgeContinentSchema)
  .length(5)
  .parse(continentDefinitions)

export const knowledgeRegionsById = new Map(
  knowledgeRegions.map((region) => [region.id, region]),
)

export const knowledgeRegionByCountryCode = new Map(
  knowledgeRegions.flatMap((region) =>
    region.countryCodes.map((countryCode) => [countryCode, region] as const),
  ),
)

export function getKnowledgeRegion(id: string | null | undefined) {
  return id ? knowledgeRegionsById.get(id as KnowledgeRegionId) : undefined
}

export function getKnowledgeRegionsForContinent(
  continentId: KnowledgeContinentId,
) {
  return knowledgeRegions.filter((region) => region.continentId === continentId)
}

export function getCountriesForKnowledgeRegion(
  regionId: KnowledgeRegionId,
): Country[] {
  const codeSet = new Set(knowledgeRegionsById.get(regionId)?.countryCodes)
  return countries.filter((country) => codeSet.has(country.code))
}
