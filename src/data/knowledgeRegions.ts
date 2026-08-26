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
  naturalGeography: z.array(z.string().min(1)).min(2).max(3),
  humanGeography: z.array(z.string().min(1)).min(2).max(3),
  studyHighlights: z.array(z.string().min(1)).min(2).max(3),
  sourceSubregions: z.array(z.string().min(1)).min(1),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
})

export const knowledgeRegionSchema = knowledgeRegionDefinitionSchema.extend({
  countryCodes: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1),
})

export type KnowledgeRegion = z.infer<typeof knowledgeRegionSchema>

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
    naturalGeography: [
      '西部多高原和山地，东部平原、丘陵与漫长海岸相间分布。',
      '大部分地区受季风影响，气温和降水从沿海向内陆差异明显。',
    ],
    humanGeography: [
      '人口和大型城市主要集中在东部平原、河谷与沿海地带。',
      '区域内历史交流密切，现代制造业、港口和交通网络发达。',
    ],
    studyHighlights: [
      '比较大陆国家、半岛国家与岛国在位置和自然环境上的差异。',
      '结合国旗、首都与海陆位置识别东亚五国。',
    ],
    sourceSubregions: ['东亚'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'southeast-asia',
    continentId: 'asia',
    name: { zh: '东南亚', en: 'South-eastern Asia' },
    description: '连接亚洲与大洋洲，由中南半岛和众多岛屿组成。',
    naturalGeography: [
      '中南半岛山河相间，马来群岛岛屿密集且火山活动较多。',
      '大部分地区位于热带，季风、热带雨林和海洋共同影响气候。',
    ],
    humanGeography: [
      '河流三角洲和沿海平原人口密集，稻作农业分布广泛。',
      '海峡与航线连接印度洋和太平洋，港口贸易具有重要地位。',
    ],
    studyHighlights: [
      '先区分中南半岛国家与海岛国家，再记忆各国位置。',
      '观察主要海峡、群岛和河流三角洲对城市分布的影响。',
    ],
    sourceSubregions: ['东南亚'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'south-asia',
    continentId: 'asia',
    name: { zh: '南亚', en: 'Southern Asia' },
    description: '喜马拉雅山脉以南，印度洋北岸的重要区域。',
    naturalGeography: [
      '北部是喜马拉雅山地，中部为印度河—恒河平原，南部多高原。',
      '季风带来明显的雨季和旱季，大河与沿海平原适合农业发展。',
    ],
    humanGeography: [
      '人口高度集中于平原、河谷和沿海地区，城市规模差异很大。',
      '语言、宗教和文化传统多样，区域内部往来历史悠久。',
    ],
    studyHighlights: [
      '用山脉、大河、半岛和岛屿建立南亚的位置框架。',
      '比较内陆国家、沿海国家和岛国的交通条件。',
    ],
    sourceSubregions: ['南亚'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'central-asia',
    continentId: 'asia',
    name: { zh: '中亚', en: 'Central Asia' },
    description: '深居亚欧大陆内部，草原、荒漠与绿洲广布。',
    naturalGeography: [
      '远离海洋，山地、盆地、草原和荒漠构成主要地貌。',
      '气候干燥且温差较大，河流和绿洲是重要的水源与聚居地。',
    ],
    humanGeography: [
      '人口多分布在绿洲、河谷和山麓，草原牧业具有传统基础。',
      '古代丝绸之路经过这里，现代能源和跨境交通联系突出。',
    ],
    studyHighlights: [
      '辨认五个内陆国家及其相对位置。',
      '理解水资源对城市、农业和人口分布的重要作用。',
    ],
    sourceSubregions: ['中亚'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'west-asia',
    continentId: 'asia',
    name: { zh: '西亚', en: 'Western Asia' },
    description: '处在亚欧非交会地带，海陆通道与能源资源重要。',
    naturalGeography: [
      '高原、山地与荒漠广布，地中海、红海和波斯湾环绕部分地区。',
      '许多地方气候干旱，河谷、绿洲和沿海地带更适合聚居。',
    ],
    humanGeography: [
      '区域位于洲际交通要冲，港口、海峡和陆路通道十分重要。',
      '石油和天然气资源影响经济，同时拥有多种语言与文化传统。',
    ],
    studyHighlights: [
      '用半岛、海湾、海峡和高原定位主要国家。',
      '区分自然资源丰富与资源相对有限国家的发展条件。',
    ],
    sourceSubregions: ['西亚'],
    accent: regionAccentSequence[4],
  },
  {
    id: 'north-europe',
    continentId: 'europe',
    name: { zh: '北欧', en: 'Northern Europe' },
    description: '临近北大西洋和北极圈，峡湾、岛屿与湖泊众多。',
    naturalGeography: [
      '高纬度海岸曲折，冰川塑造的峡湾、湖泊和岛屿十分常见。',
      '西部沿海受海洋影响较强，向东和向北气候逐渐寒冷。',
    ],
    humanGeography: [
      '人口多集中在较温和的南部与沿海城市，北部较为稀疏。',
      '航海、渔业、林业和现代服务业体现出鲜明的海洋联系。',
    ],
    studyHighlights: [
      '观察半岛、岛屿与波罗的海周边国家的位置。',
      '比较海洋性较强地区与高纬内陆地区的环境差异。',
    ],
    sourceSubregions: ['北欧'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'west-europe',
    continentId: 'europe',
    name: { zh: '西欧', en: 'Western Europe' },
    description: '大西洋沿岸国家集中，城市化程度较高。',
    naturalGeography: [
      '大西洋沿岸平原、丘陵与河谷相间，海岸和河口便于通航。',
      '温带海洋性气候影响明显，全年降水较均匀。',
    ],
    humanGeography: [
      '城市和人口密集，跨国铁路、公路与内河航运网络发达。',
      '港口贸易、工业和服务业联系紧密，国家间往来频繁。',
    ],
    studyHighlights: [
      '结合大西洋、北海和主要河流判断国家位置。',
      '比较面积较大的国家与低地小国的空间特点。',
    ],
    sourceSubregions: ['西欧'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'central-europe',
    continentId: 'europe',
    name: { zh: '中欧', en: 'Central Europe' },
    description: '位于欧洲中部，多条河流与交通通道在此交会。',
    naturalGeography: [
      '北部平原、中部丘陵与南部山地共同构成过渡性地形。',
      '莱茵河、多瑙河及其支流连接多个流域和国家。',
    ],
    humanGeography: [
      '区域居于欧洲交通中心，城市、工业区与跨境通道密集。',
      '语言和历史传统多样，国家之间经济联系紧密。',
    ],
    studyHighlights: [
      '利用阿尔卑斯山、多瑙河和周边海域建立位置参照。',
      '注意内陆国家较多以及邻国数量较多的特点。',
    ],
    sourceSubregions: ['中欧'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'south-europe',
    continentId: 'europe',
    name: { zh: '南欧', en: 'Southern Europe' },
    description: '地中海沿岸半岛众多，历史城市与海洋联系紧密。',
    naturalGeography: [
      '伊比利亚、亚平宁和巴尔干等半岛深入地中海，山地面积较大。',
      '沿海多为地中海气候，夏季炎热干燥、冬季温和多雨。',
    ],
    humanGeography: [
      '人口和城市多集中于沿海平原、河谷与岛屿港口。',
      '海运、旅游、特色农业和历史文化遗产具有重要影响。',
    ],
    studyHighlights: [
      '通过三大半岛和主要岛屿识别国家。',
      '比较沿海国家、内陆国家与岛国的空间关系。',
    ],
    sourceSubregions: ['南欧', '东南欧'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'east-europe',
    continentId: 'europe',
    name: { zh: '东欧', en: 'Eastern Europe' },
    description: '欧洲东部平原广阔，与亚洲内陆联系紧密。',
    naturalGeography: [
      '东欧平原面积广阔，河流、森林带和草原带由北向南变化。',
      '大陆性气候较明显，冬夏温差通常大于欧洲西部。',
    ],
    humanGeography: [
      '城市、农业区和交通线多沿平原与河流展开。',
      '区域连接欧洲中部、黑海周边与亚洲内陆，陆路联系突出。',
    ],
    studyHighlights: [
      '保留俄罗斯跨地图左右边缘的标准世界图位置认知。',
      '结合波罗的海、黑海和主要河流区分四个国家。',
    ],
    sourceSubregions: ['东欧'],
    accent: regionAccentSequence[4],
  },
  {
    id: 'north-africa',
    continentId: 'africa',
    name: { zh: '北非', en: 'Northern Africa' },
    description: '位于撒哈拉沙漠以北，面向地中海和大西洋。',
    naturalGeography: [
      '撒哈拉沙漠占据广阔内陆，阿特拉斯山脉和尼罗河谷形成鲜明对比。',
      '北部沿海较温和，向南迅速过渡到极为干旱的沙漠环境。',
    ],
    humanGeography: [
      '人口集中在地中海沿岸、尼罗河谷和少数绿洲。',
      '阿拉伯语文化联系广泛，地中海贸易和跨撒哈拉通道历史悠久。',
    ],
    studyHighlights: [
      '用地中海、撒哈拉和尼罗河定位主要国家。',
      '理解水源如何决定聚落、农业和交通线的分布。',
    ],
    sourceSubregions: ['北非'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'west-africa',
    continentId: 'africa',
    name: { zh: '西非', en: 'Western Africa' },
    description: '从萨赫勒延伸到几内亚湾，气候和植被变化明显。',
    naturalGeography: [
      '北部萨赫勒较干旱，向南逐渐过渡到稀树草原和热带森林。',
      '尼日尔河及几内亚湾沿岸为重要水系和低地。',
    ],
    humanGeography: [
      '人口分布不均，河谷、沿海和主要城市周边更为密集。',
      '语言和文化多样，农业、矿产、港口贸易共同影响经济。',
    ],
    studyHighlights: [
      '沿萨赫勒—森林—海岸的南北方向理解环境变化。',
      '借助尼日尔河和几内亚湾记忆国家相对位置。',
    ],
    sourceSubregions: ['西非'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'central-africa',
    continentId: 'africa',
    name: { zh: '中非', en: 'Middle Africa' },
    description: '刚果盆地位于其中，赤道雨林分布广泛。',
    naturalGeography: [
      '刚果盆地地势较低，周围高原环绕，赤道从区域中部穿过。',
      '刚果河水系庞大，湿热气候孕育广阔的热带雨林。',
    ],
    humanGeography: [
      '内陆雨林地区人口较稀疏，河流和交通走廊附近聚落较集中。',
      '森林、矿产与水能资源丰富，但交通条件差异明显。',
    ],
    studyHighlights: [
      '用赤道、刚果河和刚果盆地建立区域框架。',
      '比较沿海国家与深居内陆国家的对外交通条件。',
    ],
    sourceSubregions: ['中非'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'east-africa',
    continentId: 'africa',
    name: { zh: '东非', en: 'Eastern Africa' },
    description: '高原、裂谷与印度洋海岸构成多样地貌。',
    naturalGeography: [
      '东非高原、大裂谷、高山和大型湖泊共同构成复杂地形。',
      '气候受纬度、海拔和季风影响，草原、森林与干旱区并存。',
    ],
    humanGeography: [
      '高原、湖区和沿海城市是重要人口分布区。',
      '农牧业、港口贸易和旅游业联系内陆国家与印度洋。',
    ],
    studyHighlights: [
      '沿大裂谷、大湖和印度洋海岸识别国家。',
      '理解高海拔如何使赤道附近出现较凉爽的环境。',
    ],
    sourceSubregions: ['东非'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'southern-africa',
    continentId: 'africa',
    name: { zh: '南部非洲', en: 'Southern Africa' },
    description: '位于非洲大陆南部，草原、高原与荒漠并存。',
    naturalGeography: [
      '内陆以高原和盆地为主，西部纳米布沙漠、内陆卡拉哈里较干旱。',
      '东南沿海较湿润，河流、草原和山地环境多样。',
    ],
    humanGeography: [
      '人口和城市多集中在水源较好、交通便利的高原与沿海地带。',
      '矿产、农牧业、制造业和区域交通构成多样经济联系。',
    ],
    studyHighlights: [
      '比较大西洋岸、印度洋岸与内陆国家的环境。',
      '利用荒漠、高原和大陆南端识别国家位置。',
    ],
    sourceSubregions: ['南部非洲'],
    accent: regionAccentSequence[4],
  },
  {
    id: 'north-america',
    continentId: 'americas',
    name: { zh: '北美洲', en: 'Northern America' },
    description: '横跨寒带到热带，拥有广阔平原和纵贯山系。',
    naturalGeography: [
      '西部山系纵贯南北，中部平原广阔，东部高地较为古老。',
      '纬度跨度大，冰原、森林、草原和温暖沿海环境依次出现。',
    ],
    humanGeography: [
      '人口和大城市主要集中在较温暖的南部、两岸及五大湖周边。',
      '跨大陆交通、资源开发和高度城市化塑造紧密经济联系。',
    ],
    studyHighlights: [
      '用西部山系、中部平原、五大湖和三大洋建立空间框架。',
      '比较大陆国家与高纬岛屿地区的人口分布。',
    ],
    sourceSubregions: ['北美洲'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'central-america',
    continentId: 'americas',
    name: { zh: '中美洲', en: 'Central America' },
    description: '连接南北美洲的狭长陆桥，火山和热带景观丰富。',
    naturalGeography: [
      '狭长陆桥夹在太平洋与加勒比海之间，山地和火山较多。',
      '大部分地区位于热带，沿海低地与山地气候差异明显。',
    ],
    humanGeography: [
      '人口和城市多分布在高原盆地、太平洋沿岸与交通走廊。',
      '农业、旅游、港口和跨洋通道连接区域内外。',
    ],
    studyHighlights: [
      '按从墨西哥南部到南美洲的方向记忆陆桥国家。',
      '理解运河、海峡和双海岸位置的交通意义。',
    ],
    sourceSubregions: ['中美洲'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'caribbean',
    continentId: 'americas',
    name: { zh: '加勒比地区', en: 'Caribbean' },
    description: '加勒比海中的岛屿国家密集，海洋特色鲜明。',
    naturalGeography: [
      '大安的列斯、小安的列斯等岛链环绕加勒比海。',
      '热带海洋环境显著，部分岛屿由火山或珊瑚作用形成并受飓风影响。',
    ],
    humanGeography: [
      '人口多集中在沿海城市和适合建设港口的岛屿地带。',
      '多种语言和文化并存，旅游、农业与海运联系突出。',
    ],
    studyHighlights: [
      '先辨认大岛，再沿岛链定位较小的岛国。',
      '比较群岛国家、单岛国家和共享岛屿国家。',
    ],
    sourceSubregions: ['加勒比地区'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'south-america',
    continentId: 'americas',
    name: { zh: '南美洲', en: 'South America' },
    description: '安第斯山脉纵贯西部，亚马孙流域面积广大。',
    naturalGeography: [
      '西部安第斯山脉狭长高峻，中东部以高原、平原和大河流域为主。',
      '亚马孙雨林广阔，南北纬度与海拔变化带来多样气候。',
    ],
    humanGeography: [
      '人口与城市多集中在沿海、高原和气候较适宜的东南部。',
      '西班牙语和葡萄牙语影响广泛，农业、矿业与城市经济并存。',
    ],
    studyHighlights: [
      '用安第斯山、亚马孙河和大陆轮廓判断国家位置。',
      '区分太平洋沿岸、大西洋沿岸和内陆国家。',
    ],
    sourceSubregions: ['南美洲'],
    accent: regionAccentSequence[3],
  },
  {
    id: 'australia-new-zealand',
    continentId: 'oceania',
    name: { zh: '澳大利亚和新西兰', en: 'Australia and New Zealand' },
    description: '大洋洲面积最大的两个国家，隔塔斯曼海相望。',
    naturalGeography: [
      '澳大利亚内陆广阔干燥，新西兰多山并受温带海洋影响。',
      '两国海岸线漫长，岛屿、山地、草原与独特生态系统丰富。',
    ],
    humanGeography: [
      '人口和主要城市多集中在沿海，内陆与高山地区较稀疏。',
      '原住民文化与移民社会并存，农牧业、矿业和服务业联系全球。',
    ],
    studyHighlights: [
      '比较大陆国家澳大利亚与岛国新西兰的地形和城市分布。',
      '用塔斯曼海和主要城市所在海岸确定两国相对位置。',
    ],
    sourceSubregions: ['澳大利亚和新西兰'],
    accent: regionAccentSequence[0],
  },
  {
    id: 'melanesia',
    continentId: 'oceania',
    name: { zh: '美拉尼西亚', en: 'Melanesia' },
    description: '位于西南太平洋，由大岛和群岛国家组成。',
    naturalGeography: [
      '岛屿多位于热带，既有面积较大的高山岛，也有火山岛和珊瑚岛。',
      '高温多雨、森林广布，山地使岛内交通和气候差异明显。',
    ],
    humanGeography: [
      '语言和地方文化非常多样，人口多分布在沿海与适宜耕作的谷地。',
      '农业、渔业、矿产和区域港口是重要生产与交流方式。',
    ],
    studyHighlights: [
      '从新几内亚岛向东沿岛链识别各国。',
      '比较大岛国家与小型群岛国家的交通条件。',
    ],
    sourceSubregions: ['美拉尼西亚'],
    accent: regionAccentSequence[1],
  },
  {
    id: 'micronesia',
    continentId: 'oceania',
    name: { zh: '密克罗尼西亚', en: 'Micronesia' },
    description: '西太平洋众多小岛组成的岛屿区域。',
    naturalGeography: [
      '岛屿面积普遍较小，火山岛、珊瑚岛和环礁散布在广阔海面。',
      '陆地资源有限，海洋、淡水和海岸生态对生活十分重要。',
    ],
    humanGeography: [
      '人口规模较小且分散，聚落多靠近港湾、机场和淡水来源。',
      '航海传统、渔业、旅游与外部联系在区域生活中占重要位置。',
    ],
    studyHighlights: [
      '注意国家陆地很小但海域范围广阔的特点。',
      '借助赤道、国际日期变更线和邻近大岛建立位置参照。',
    ],
    sourceSubregions: ['密克罗尼西亚'],
    accent: regionAccentSequence[2],
  },
  {
    id: 'polynesia',
    continentId: 'oceania',
    name: { zh: '波利尼西亚', en: 'Polynesia' },
    description: '分布在太平洋中部和南部广阔海域。',
    naturalGeography: [
      '岛屿跨越广阔海域，包括高火山岛、低平珊瑚岛和环礁。',
      '热带海洋环境为主，岛屿高度影响淡水、土壤和植被条件。',
    ],
    humanGeography: [
      '远洋航海传统连接分散岛屿，语言文化具有共同渊源和地方特色。',
      '人口多集中在少数主岛，渔业、旅游和跨海外联系较重要。',
    ],
    studyHighlights: [
      '用波利尼西亚三角和国际日期变更线理解岛群分布。',
      '比较高岛与低岛在水源、聚落和交通上的差异。',
    ],
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
