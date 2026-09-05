import {
  territoryCatalogSchema,
  territorySourceRegistrySchema,
  type Territory,
  type TerritoryType,
} from './territorySchema'

const source = (id: string) => [id]

export const territorySources = territorySourceRegistrySchema.parse([
  {
    id: 'statistics-greenland',
    name: 'Greenland in Figures',
    publisher: 'Statistics Greenland',
    url: 'https://stat.gl/default.asp?lang=en',
    accessedAt: '2026-09-04',
    license:
      'Official statistical reference; short repository-authored summaries.',
  },
  {
    id: 'statistics-faroe',
    name: 'Statistics Faroe Islands',
    publisher: 'Statistics Faroe Islands',
    url: 'https://hagstova.fo/en',
    accessedAt: '2026-09-04',
    license:
      'Official statistical reference; short repository-authored summaries.',
  },
  {
    id: 'gibraltar-statistics',
    name: 'Statistics Office',
    publisher: 'Government of Gibraltar',
    url: 'https://www.gibraltar.gov.gi/statistics',
    accessedAt: '2026-09-04',
    license:
      'Official public information; short repository-authored summaries.',
  },
  {
    id: 'bermuda-statistics',
    name: 'Department of Statistics',
    publisher: 'Government of Bermuda',
    url: 'https://www.gov.bm/department/statistics',
    accessedAt: '2026-09-04',
    license:
      'Official public information; short repository-authored summaries.',
  },
  {
    id: 'us-census-territories',
    name: 'Island Areas',
    publisher: 'United States Census Bureau',
    url: 'https://www.census.gov/programs-surveys/island-areas.html',
    accessedAt: '2026-09-04',
    license: 'U.S. government public information.',
  },
  {
    id: 'insee-french-guiana',
    name: 'Guyane statistics',
    publisher: 'INSEE',
    url: 'https://www.insee.fr/en/accueil',
    accessedAt: '2026-09-04',
    license:
      'Official statistical reference; short repository-authored summaries.',
  },
  {
    id: 'ispf-polynesia',
    name: 'French Polynesia statistics',
    publisher: 'Institut de la statistique de la Polynesie francaise',
    url: 'https://www.ispf.pf/',
    accessedAt: '2026-09-04',
    license:
      'Official statistical reference; short repository-authored summaries.',
  },
  {
    id: 'isee-new-caledonia',
    name: 'New Caledonia statistics',
    publisher: 'ISEE',
    url: 'https://www.isee.nc/',
    accessedAt: '2026-09-04',
    license:
      'Official statistical reference; short repository-authored summaries.',
  },
])

export const territoryTypeLabels: Record<TerritoryType, string> = {
  'autonomous-territory': '自治领地',
  'overseas-territory': '海外领地',
  'unincorporated-territory': '非合并领土',
  'overseas-department': '海外省和大区',
  'overseas-collectivity': '海外集体',
  'special-collectivity': '特殊集体',
}

const rawTerritories: Territory[] = [
  {
    id: 'greenland',
    code: 'GL',
    name: { zh: '格陵兰', en: 'Greenland' },
    aliases: ['格陵兰岛'],
    type: 'autonomous-territory',
    administeringCountryCode: 'DK',
    relationSummary: '丹麦王国内实行高度自治的领地。',
    continent: { zh: '北美洲', en: 'North America' },
    subregion: { zh: '北极地区', en: 'Arctic' },
    center: { latitude: 72, longitude: -41 },
    cameraDistance: 245,
    displayMode: 'polygon',
    areaSquareKilometers: 2166086,
    population: 56699,
    populationYear: 2024,
    administrativeCenter: { zh: '努克', en: 'Nuuk' },
    currency: {
      code: 'DKK',
      symbol: 'kr',
      name: { zh: '丹麦克朗', en: 'Danish krone' },
    },
    geography: {
      summary: '世界最大岛屿，绝大部分被冰盖覆盖。',
      items: [
        '位于北美洲东北部和北冰洋、大西洋之间',
        '沿海多峡湾，居民点主要分布在无冰海岸',
      ],
      sourceIds: source('statistics-greenland'),
    },
    people: {
      summary: '人口稀少，因纽特文化影响鲜明。',
      items: ['格陵兰语是主要语言', '居民主要集中在西南沿海城镇'],
      sourceIds: source('statistics-greenland'),
    },
    economy: {
      summary: '渔业是重要经济基础。',
      items: ['虾、比目鱼等海洋渔业重要', '旅游业和矿产开发具有发展潜力'],
      sourceIds: source('statistics-greenland'),
    },
    settlements: [
      { zh: '努克', en: 'Nuuk' },
      { zh: '西西缪特', en: 'Sisimiut' },
    ],
    landmarks: [
      { zh: '格陵兰冰盖', en: 'Greenland Ice Sheet' },
      { zh: '伊卢利萨特冰峡湾', en: 'Ilulissat Icefjord' },
    ],
    sourceIds: source('statistics-greenland'),
  },
  {
    id: 'faroe-islands',
    code: 'FO',
    name: { zh: '法罗群岛', en: 'Faroe Islands' },
    aliases: ['法罗'],
    type: 'autonomous-territory',
    administeringCountryCode: 'DK',
    relationSummary: '丹麦王国内实行自治的群岛。',
    continent: { zh: '欧洲', en: 'Europe' },
    subregion: { zh: '北大西洋', en: 'North Atlantic' },
    center: { latitude: 62, longitude: -6.8 },
    cameraDistance: 150,
    displayMode: 'marker',
    areaSquareKilometers: 1393,
    population: 54676,
    populationYear: 2024,
    administrativeCenter: { zh: '托尔斯港', en: 'Torshavn' },
    currency: {
      code: 'DKK',
      symbol: 'kr',
      name: { zh: '丹麦克朗', en: 'Danish krone' },
    },
    geography: {
      summary: '北大西洋上的火山岩群岛。',
      items: ['岛屿地势陡峭、海岸多悬崖', '海洋性气候多风多雾'],
      sourceIds: source('statistics-faroe'),
    },
    people: {
      summary: '聚落沿海分布，法罗语文化突出。',
      items: ['法罗语和丹麦语通行', '传统生活与海洋联系紧密'],
      sourceIds: source('statistics-faroe'),
    },
    economy: {
      summary: '渔业和水产养殖占重要地位。',
      items: ['鱼类及水产品是主要出口', '海运和旅游业提供服务业就业'],
      sourceIds: source('statistics-faroe'),
    },
    settlements: [
      { zh: '托尔斯港', en: 'Torshavn' },
      { zh: '克拉克斯维克', en: 'Klaksvik' },
    ],
    landmarks: [
      { zh: '沃格岛', en: 'Vagar' },
      { zh: '斯特莱默岛', en: 'Streymoy' },
    ],
    sourceIds: source('statistics-faroe'),
  },
  {
    id: 'gibraltar',
    code: 'GI',
    name: { zh: '直布罗陀', en: 'Gibraltar' },
    aliases: ['直布罗陀地区'],
    type: 'overseas-territory',
    administeringCountryCode: 'GB',
    relationSummary: '英国海外领地，位于伊比利亚半岛南端。',
    continent: { zh: '欧洲', en: 'Europe' },
    subregion: { zh: '南欧', en: 'Southern Europe' },
    center: { latitude: 36.14, longitude: -5.35 },
    cameraDistance: 135,
    displayMode: 'marker',
    areaSquareKilometers: 6.8,
    population: 34003,
    populationYear: 2024,
    administrativeCenter: { zh: '直布罗陀', en: 'Gibraltar' },
    currency: {
      code: 'GIP',
      symbol: '£',
      name: { zh: '直布罗陀镑', en: 'Gibraltar pound' },
    },
    geography: {
      summary: '扼守地中海与大西洋之间的海峡通道。',
      items: ['直布罗陀巨岩是最醒目的地形', '陆地面积很小并与西班牙相连'],
      sourceIds: source('gibraltar-statistics'),
    },
    people: {
      summary: '人口高度城市化，语言文化多元。',
      items: ['英语是官方语言', '西班牙语在日常交流中常见'],
      sourceIds: source('gibraltar-statistics'),
    },
    economy: {
      summary: '港口和跨境服务业发达。',
      items: ['航运、金融和旅游业重要', '海峡位置带来港口服务需求'],
      sourceIds: source('gibraltar-statistics'),
    },
    settlements: [{ zh: '直布罗陀', en: 'Gibraltar' }],
    landmarks: [
      { zh: '直布罗陀巨岩', en: 'Rock of Gibraltar' },
      { zh: '欧罗巴角', en: 'Europa Point' },
    ],
    sourceIds: source('gibraltar-statistics'),
  },
  {
    id: 'bermuda',
    code: 'BM',
    name: { zh: '百慕大', en: 'Bermuda' },
    aliases: ['百慕大群岛'],
    type: 'overseas-territory',
    administeringCountryCode: 'GB',
    relationSummary: '英国海外领地，位于北大西洋西部。',
    continent: { zh: '北美洲', en: 'North America' },
    subregion: { zh: '北大西洋', en: 'North Atlantic' },
    center: { latitude: 32.3, longitude: -64.78 },
    cameraDistance: 140,
    displayMode: 'marker',
    areaSquareKilometers: 54,
    population: 64636,
    populationYear: 2024,
    administrativeCenter: { zh: '哈密尔顿', en: 'Hamilton' },
    currency: {
      code: 'BMD',
      symbol: '$',
      name: { zh: '百慕大元', en: 'Bermudian dollar' },
    },
    geography: {
      summary: '由低平的珊瑚岛组成。',
      items: ['位于北大西洋暖流影响区', '岛屿面积小、海岸曲折'],
      sourceIds: source('bermuda-statistics'),
    },
    people: {
      summary: '人口集中在相连的主要岛屿。',
      items: ['英语是主要语言', '城市和港口聚落密集'],
      sourceIds: source('bermuda-statistics'),
    },
    economy: {
      summary: '国际商业和旅游业占主导。',
      items: ['保险及再保险服务重要', '海滨旅游吸引国际游客'],
      sourceIds: source('bermuda-statistics'),
    },
    settlements: [
      { zh: '哈密尔顿', en: 'Hamilton' },
      { zh: '圣乔治', en: "St George's" },
    ],
    landmarks: [
      { zh: '圣乔治古城', en: 'Historic Town of St George' },
      { zh: '马蹄湾', en: 'Horseshoe Bay' },
    ],
    sourceIds: source('bermuda-statistics'),
  },
  {
    id: 'puerto-rico',
    code: 'PR',
    name: { zh: '波多黎各', en: 'Puerto Rico' },
    aliases: ['波多黎各自由邦'],
    type: 'unincorporated-territory',
    administeringCountryCode: 'US',
    relationSummary: '美国非合并领土，实行地方自治。',
    continent: { zh: '北美洲', en: 'North America' },
    subregion: { zh: '加勒比地区', en: 'Caribbean' },
    center: { latitude: 18.22, longitude: -66.59 },
    cameraDistance: 155,
    displayMode: 'polygon',
    areaSquareKilometers: 9104,
    population: 3203295,
    populationYear: 2024,
    administrativeCenter: { zh: '圣胡安', en: 'San Juan' },
    currency: {
      code: 'USD',
      symbol: '$',
      name: { zh: '美元', en: 'United States dollar' },
    },
    geography: {
      summary: '大安的列斯群岛东部的山地岛屿。',
      items: ['岛屿中部山地起伏', '沿海平原和热带海岸景观明显'],
      sourceIds: source('us-census-territories'),
    },
    people: {
      summary: '西班牙语文化与加勒比传统鲜明。',
      items: ['西班牙语和英语为官方语言', '人口主要集中在沿海城市带'],
      sourceIds: source('us-census-territories'),
    },
    economy: {
      summary: '制造业和服务业是经济主体。',
      items: ['医药及高技术制造业重要', '旅游、贸易和公共服务就业较多'],
      sourceIds: source('us-census-territories'),
    },
    settlements: [
      { zh: '圣胡安', en: 'San Juan' },
      { zh: '庞塞', en: 'Ponce' },
    ],
    landmarks: [
      { zh: '圣胡安古城', en: 'Old San Juan' },
      { zh: '云盖国家森林', en: 'El Yunque National Forest' },
    ],
    sourceIds: source('us-census-territories'),
  },
  {
    id: 'guam',
    code: 'GU',
    name: { zh: '关岛', en: 'Guam' },
    aliases: [],
    type: 'unincorporated-territory',
    administeringCountryCode: 'US',
    relationSummary: '美国非合并领土，位于西太平洋。',
    continent: { zh: '大洋洲', en: 'Oceania' },
    subregion: { zh: '密克罗尼西亚', en: 'Micronesia' },
    center: { latitude: 13.44, longitude: 144.79 },
    cameraDistance: 140,
    displayMode: 'marker',
    areaSquareKilometers: 544,
    population: 153836,
    populationYear: 2024,
    administrativeCenter: { zh: '阿加尼亚', en: 'Hagatna' },
    currency: {
      code: 'USD',
      symbol: '$',
      name: { zh: '美元', en: 'United States dollar' },
    },
    geography: {
      summary: '马里亚纳群岛南部的热带岛屿。',
      items: ['北部以石灰岩台地为主', '南部丘陵和火山岩地形较多'],
      sourceIds: source('us-census-territories'),
    },
    people: {
      summary: '查莫罗文化是重要地方文化。',
      items: ['英语和查莫罗语为官方语言', '人口集中在中北部城镇'],
      sourceIds: source('us-census-territories'),
    },
    economy: {
      summary: '公共服务和旅游业较重要。',
      items: ['旅游活动与东亚客源联系密切', '军事及相关服务占较大比重'],
      sourceIds: source('us-census-territories'),
    },
    settlements: [
      { zh: '阿加尼亚', en: 'Hagatna' },
      { zh: '迪迪多', en: 'Dededo' },
    ],
    landmarks: [
      { zh: '恋人岬', en: 'Two Lovers Point' },
      { zh: '马里亚纳海沟附近海域', en: 'Mariana Trench region' },
    ],
    sourceIds: source('us-census-territories'),
  },
  {
    id: 'french-guiana',
    code: 'GF',
    name: { zh: '法属圭亚那', en: 'French Guiana' },
    aliases: ['圭亚那海外省'],
    type: 'overseas-department',
    administeringCountryCode: 'FR',
    relationSummary: '法国海外省和大区，也是欧盟最外围地区。',
    continent: { zh: '南美洲', en: 'South America' },
    subregion: { zh: '南美洲北部', en: 'Northern South America' },
    center: { latitude: 3.93, longitude: -53.13 },
    cameraDistance: 175,
    displayMode: 'polygon',
    areaSquareKilometers: 83534,
    population: 292354,
    populationYear: 2024,
    administrativeCenter: { zh: '卡宴', en: 'Cayenne' },
    currency: { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'Euro' } },
    geography: {
      summary: '位于南美洲东北部，热带雨林广布。',
      items: ['北临大西洋，内陆属于圭亚那高原', '河流众多且人口主要集中在沿海'],
      sourceIds: source('insee-french-guiana'),
    },
    people: {
      summary: '人口和文化来源多样。',
      items: ['法语是官方语言', '沿海城镇汇聚克里奥尔及多种移民文化'],
      sourceIds: source('insee-french-guiana'),
    },
    economy: {
      summary: '航天、公共服务和资源产业具有特色。',
      items: ['库鲁航天中心具有国际影响', '林业、渔业和黄金开采是地方产业'],
      sourceIds: source('insee-french-guiana'),
    },
    settlements: [
      { zh: '卡宴', en: 'Cayenne' },
      { zh: '库鲁', en: 'Kourou' },
    ],
    landmarks: [
      { zh: '圭亚那航天中心', en: 'Guiana Space Centre' },
      { zh: '亚马孙雨林', en: 'Amazon rainforest' },
    ],
    sourceIds: source('insee-french-guiana'),
  },
  {
    id: 'french-polynesia',
    code: 'PF',
    name: { zh: '法属波利尼西亚', en: 'French Polynesia' },
    aliases: ['大溪地群岛'],
    type: 'overseas-collectivity',
    administeringCountryCode: 'FR',
    relationSummary: '法国海外集体，由南太平洋多组群岛组成。',
    continent: { zh: '大洋洲', en: 'Oceania' },
    subregion: { zh: '波利尼西亚', en: 'Polynesia' },
    center: { latitude: -17.68, longitude: -149.4 },
    cameraDistance: 165,
    displayMode: 'marker',
    areaSquareKilometers: 4167,
    population: 281807,
    populationYear: 2024,
    administrativeCenter: { zh: '帕皮提', en: 'Papeete' },
    currency: {
      code: 'XPF',
      symbol: '₣',
      name: { zh: '太平洋法郎', en: 'CFP franc' },
    },
    geography: {
      summary: '岛屿分散在广阔的南太平洋。',
      items: ['兼有高火山岛和低平环礁', '陆地面积小但海域跨度很大'],
      sourceIds: source('ispf-polynesia'),
    },
    people: {
      summary: '波利尼西亚文化和法语文化并存。',
      items: ['法语和塔希提语广泛使用', '人口主要集中在塔希提岛'],
      sourceIds: source('ispf-polynesia'),
    },
    economy: {
      summary: '旅游业和海洋产业突出。',
      items: ['海岛旅游是主要服务业', '黑珍珠养殖和渔业具有特色'],
      sourceIds: source('ispf-polynesia'),
    },
    settlements: [
      { zh: '帕皮提', en: 'Papeete' },
      { zh: '法阿', en: 'Faaa' },
    ],
    landmarks: [
      { zh: '塔希提岛', en: 'Tahiti' },
      { zh: '博拉博拉岛', en: 'Bora Bora' },
    ],
    sourceIds: source('ispf-polynesia'),
  },
  {
    id: 'new-caledonia',
    code: 'NC',
    name: { zh: '新喀里多尼亚', en: 'New Caledonia' },
    aliases: ['新喀里多尼亚群岛'],
    type: 'special-collectivity',
    administeringCountryCode: 'FR',
    relationSummary: '法国具有特殊地位的海外集体。',
    continent: { zh: '大洋洲', en: 'Oceania' },
    subregion: { zh: '美拉尼西亚', en: 'Melanesia' },
    center: { latitude: -21.3, longitude: 165.5 },
    cameraDistance: 155,
    displayMode: 'polygon',
    areaSquareKilometers: 18575,
    population: 269000,
    populationYear: 2023,
    administrativeCenter: { zh: '努美阿', en: 'Noumea' },
    currency: {
      code: 'XPF',
      symbol: '₣',
      name: { zh: '太平洋法郎', en: 'CFP franc' },
    },
    geography: {
      summary: '南太平洋美拉尼西亚的狭长岛群。',
      items: ['主岛中央有纵贯山地', '外围潟湖和珊瑚礁规模巨大'],
      sourceIds: source('isee-new-caledonia'),
    },
    people: {
      summary: '卡纳克文化与多元移民文化并存。',
      items: ['法语是官方语言', '人口主要集中在南部努美阿都市区'],
      sourceIds: source('isee-new-caledonia'),
    },
    economy: {
      summary: '镍矿业是重要经济支柱。',
      items: ['拥有丰富的镍矿资源', '服务业、旅游业和水产养殖共同发展'],
      sourceIds: source('isee-new-caledonia'),
    },
    settlements: [
      { zh: '努美阿', en: 'Noumea' },
      { zh: '敦贝阿', en: 'Dumbea' },
    ],
    landmarks: [
      { zh: '新喀里多尼亚潟湖', en: 'Lagoons of New Caledonia' },
      { zh: '大地岛', en: 'Grande Terre' },
    ],
    sourceIds: source('isee-new-caledonia'),
  },
]

export const territories = territoryCatalogSchema.parse(rawTerritories)
export const territoriesById = new Map(
  territories.map((item) => [item.id, item]),
)
export const territoriesByAdministeringCountryCode = new Map<
  string,
  Territory[]
>()
for (const territory of territories) {
  const items =
    territoriesByAdministeringCountryCode.get(
      territory.administeringCountryCode,
    ) ?? []
  items.push(territory)
  territoriesByAdministeringCountryCode.set(
    territory.administeringCountryCode,
    items,
  )
}

export function getTerritory(id: string | null | undefined) {
  return id ? territoriesById.get(id) : undefined
}

export function getTerritoriesForCountry(countryCode: string) {
  return territoriesByAdministeringCountryCode.get(countryCode) ?? []
}
