import generatedDesertGeometries from './generated/desert-geometries.json'
import {
  desertCatalogSchema,
  desertGeometryCatalogSchema,
  type Desert,
} from './desertSchema'

type Position = [number, number]

type DesertDefinition = {
  id: string
  zh: string
  en: string
  aliases?: string[]
  center: Position
  cameraDistance: number
  region: string
  countries: string[]
  area: number
  landscape: string[]
  facts: [string, string]
  priority: number
}

const desert = (definition: DesertDefinition) => definition
const position = ([longitude, latitude]: Position) => ({
  latitude,
  longitude,
})

const definitions: DesertDefinition[] = [
  desert({
    id: 'sahara',
    zh: '撒哈拉沙漠',
    en: 'Sahara',
    aliases: ['Sahara Desert', '撒哈拉'],
    center: [13, 23],
    cameraDistance: 335,
    region: '北非',
    countries: ['MA', 'DZ', 'TN', 'LY', 'EG', 'MR', 'ML', 'NE', 'TD', 'SD'],
    area: 9_200_000,
    landscape: ['沙丘海', '砾漠', '岩漠', '绿洲'],
    facts: [
      '撒哈拉并不只有沙丘，大面积地表其实由砾石平原和裸露岩台组成。',
      '它的南缘萨赫勒地带是沙漠与热带草原之间变化显著的过渡区。',
    ],
    priority: 1,
  }),
  desert({
    id: 'gobi',
    zh: '戈壁沙漠',
    en: 'Gobi Desert',
    aliases: ['Gobi', '戈壁'],
    center: [103, 42.5],
    cameraDistance: 300,
    region: '中国北部与蒙古南部',
    countries: ['CN', 'MN'],
    area: 1_295_000,
    landscape: ['砾漠', '岩漠', '沙地'],
    facts: [
      '戈壁是典型的温带内陆荒漠，冬季可能出现严寒和降雪。',
      '这里保存了丰富的恐龙化石，并记录着亚洲内陆长期的地貌演化。',
    ],
    priority: 2,
  }),
  desert({
    id: 'rub-al-khali',
    zh: '鲁卜哈利沙漠',
    en: "Rub' al Khali",
    aliases: ['Empty Quarter', '空旷之地', '阿拉伯沙漠'],
    center: [48.5, 20],
    cameraDistance: 265,
    region: '阿拉伯半岛南部',
    countries: ['SA', 'OM', 'YE', 'AE'],
    area: 650_000,
    landscape: ['巨型沙丘', '盐沼', '沙质平原'],
    facts: [
      '鲁卜哈利拥有世界上面积最大的连续沙海之一，沙丘可绵延数百千米。',
      '极少的降水和有限的地表水使其成为阿拉伯半岛人烟最稀少的地区之一。',
    ],
    priority: 3,
  }),
  desert({
    id: 'kalahari',
    zh: '卡拉哈里沙漠',
    en: 'Kalahari Desert',
    aliases: ['Kalahari', '喀拉哈里沙漠'],
    center: [22, -23],
    cameraDistance: 285,
    region: '南部非洲内陆',
    countries: ['BW', 'NA', 'ZA'],
    area: 900_000,
    landscape: ['红色沙地', '稀树草原', '盐沼'],
    facts: [
      '卡拉哈里部分地区降水足以生长草木，因此它并非处处都是裸露沙地。',
      '奥卡万戈河在其北部形成内陆三角洲，让干旱环境中出现大面积湿地。',
    ],
    priority: 4,
  }),
  desert({
    id: 'namib',
    zh: '纳米布沙漠',
    en: 'Namib Desert',
    aliases: ['Namib'],
    center: [15, -24],
    cameraDistance: 245,
    region: '非洲西南部大西洋沿岸',
    countries: ['NA', 'AO', 'ZA'],
    area: 81_000,
    landscape: ['沿海沙丘', '雾漠', '砾石平原'],
    facts: [
      '寒冷的本格拉洋流抑制降雨，却常带来沿海雾气，为生物提供水分。',
      '纳米布拥有高大的红色沙丘，也被认为是地球上最古老的沙漠之一。',
    ],
    priority: 5,
  }),
  desert({
    id: 'atacama',
    zh: '阿塔卡马沙漠',
    en: 'Atacama Desert',
    aliases: ['Atacama'],
    center: [-69.5, -24],
    cameraDistance: 245,
    region: '南美洲太平洋沿岸',
    countries: ['CL'],
    area: 105_000,
    landscape: ['盐沼', '火山高原', '砾漠'],
    facts: [
      '副热带高压、寒冷洋流和安第斯山雨影共同造成了极端干旱。',
      '高海拔、干燥且晴朗的环境使这里成为世界重要的天文观测地区。',
    ],
    priority: 6,
  }),
  desert({
    id: 'taklamakan',
    zh: '塔克拉玛干沙漠',
    en: 'Taklamakan Desert',
    aliases: ['Taklimakan Desert', '塔克拉玛干'],
    center: [83.5, 39],
    cameraDistance: 255,
    region: '中国新疆塔里木盆地',
    countries: ['CN'],
    area: 337_000,
    landscape: ['流动沙丘', '沙海', '绿洲边缘'],
    facts: [
      '高山环绕的塔里木盆地阻挡湿润气流，形成广阔的内陆沙海。',
      '古代丝绸之路的多条路线沿沙漠南北缘的绿洲展开，而非横穿腹地。',
    ],
    priority: 7,
  }),
  desert({
    id: 'thar',
    zh: '塔尔沙漠',
    en: 'Thar Desert',
    aliases: ['Great Indian Desert', '大印度沙漠'],
    center: [71, 27],
    cameraDistance: 245,
    region: '印度西北部与巴基斯坦东南部',
    countries: ['IN', 'PK'],
    area: 200_000,
    landscape: ['沙丘', '灌丛', '季节性河道'],
    facts: [
      '塔尔沙漠靠近南亚季风边缘，降水的年际变化很大。',
      '这里人口密度高于许多大型沙漠，灌溉农业和放牧活动十分重要。',
    ],
    priority: 8,
  }),
  desert({
    id: 'great-victoria',
    zh: '大维多利亚沙漠',
    en: 'Great Victoria Desert',
    aliases: ['Great Victoria'],
    center: [129, -29],
    cameraDistance: 280,
    region: '澳大利亚南部内陆',
    countries: ['AU'],
    area: 348_750,
    landscape: ['沙脊', '盐湖', '灌丛'],
    facts: [
      '大维多利亚沙漠横跨西澳大利亚州和南澳大利亚州，是澳大利亚最大的沙漠。',
      '平行沙脊、盐湖和耐旱灌丛共同构成其并不单调的荒漠景观。',
    ],
    priority: 9,
  }),
  desert({
    id: 'great-sandy',
    zh: '大沙沙漠',
    en: 'Great Sandy Desert',
    aliases: ['Great Sandy'],
    center: [124, -20],
    cameraDistance: 265,
    region: '澳大利亚西北部内陆',
    countries: ['AU'],
    area: 284_993,
    landscape: ['纵向沙丘', '岩石高地', '季节性湿地'],
    facts: [
      '大沙沙漠以成列的纵向沙丘闻名，部分沙脊延伸距离很长。',
      '北部受季风影响，偶发强降雨会短暂改变河道和湿地景观。',
    ],
    priority: 10,
  }),
  desert({
    id: 'simpson',
    zh: '辛普森沙漠',
    en: 'Simpson Desert',
    aliases: ['Simpson'],
    center: [137, -25],
    cameraDistance: 245,
    region: '澳大利亚中部',
    countries: ['AU'],
    area: 176_500,
    landscape: ['平行沙脊', '盐湖', '黏土洼地'],
    facts: [
      '辛普森沙漠分布着数量众多的平行沙脊，整体大致沿南北方向延伸。',
      '短暂降雨能够唤醒休眠种子，使低洼地区迅速出现季节性植被。',
    ],
    priority: 15,
  }),
  desert({
    id: 'sonoran',
    zh: '索诺兰沙漠',
    en: 'Sonoran Desert',
    aliases: ['Sonora Desert', '索诺拉沙漠'],
    center: [-113, 31],
    cameraDistance: 255,
    region: '美国西南部与墨西哥西北部',
    countries: ['US', 'MX'],
    area: 260_000,
    landscape: ['柱状仙人掌地', '山间盆地', '沙地'],
    facts: [
      '索诺兰沙漠拥有两个降雨季，因此生物多样性高于许多同纬度荒漠。',
      '巨人柱仙人掌是这里极具代表性的植物，但其自然分布范围并不覆盖整个沙漠。',
    ],
    priority: 11,
  }),
  desert({
    id: 'chihuahuan',
    zh: '奇瓦瓦沙漠',
    en: 'Chihuahuan Desert',
    aliases: ['Chihuahua Desert', '奇瓦瓦荒漠'],
    center: [-104, 29],
    cameraDistance: 270,
    region: '墨西哥高原北部与美国西南部',
    countries: ['MX', 'US'],
    area: 362_600,
    landscape: ['高原盆地', '石灰岩山地', '灌丛'],
    facts: [
      '奇瓦瓦沙漠大部分位于较高海拔，冬季通常比索诺兰沙漠更冷。',
      '山间盆地与孤立山地交错，形成了许多彼此分隔的生境。',
    ],
    priority: 12,
  }),
  desert({
    id: 'karakum',
    zh: '卡拉库姆沙漠',
    en: 'Karakum Desert',
    aliases: ['Garagum Desert', 'Kara Kum'],
    center: [59, 39],
    cameraDistance: 255,
    region: '中亚土库曼斯坦',
    countries: ['TM'],
    area: 350_000,
    landscape: ['沙丘', '黏土平原', '绿洲'],
    facts: [
      '卡拉库姆覆盖土库曼斯坦大部分国土，名称常被解释为“黑沙”。',
      '卡拉库姆运河把阿姆河水引向干旱内陆，对沿线农业和聚落影响很大。',
    ],
    priority: 13,
  }),
  desert({
    id: 'kyzylkum',
    zh: '克孜勒库姆沙漠',
    en: 'Kyzylkum Desert',
    aliases: ['Kyzyl Kum', 'Qizilqum Desert', '红沙漠'],
    center: [64, 43],
    cameraDistance: 255,
    region: '阿姆河与锡尔河之间的中亚内陆',
    countries: ['UZ', 'KZ', 'TM'],
    area: 300_000,
    landscape: ['红色沙地', '砾石平原', '孤立山地'],
    facts: [
      '克孜勒库姆名称意为“红沙”，位于中亚两条重要河流之间。',
      '沙漠中分布着矿产资源、牧场和绿洲城镇，并非完全无人活动。',
    ],
    priority: 14,
  }),
  desert({
    id: 'syrian',
    zh: '叙利亚沙漠',
    en: 'Syrian Desert',
    aliases: ['Syrian Steppe', '叙利亚荒漠'],
    center: [39, 33],
    cameraDistance: 265,
    region: '西亚北部内陆',
    countries: ['SY', 'JO', 'IQ', 'SA'],
    area: 500_000,
    landscape: ['玄武岩荒原', '砾漠', '干草原'],
    facts: [
      '叙利亚沙漠连接阿拉伯半岛与美索不达米亚，许多古代商路从绿洲经过。',
      '其地表包含玄武岩熔岩区、砾石平原和干草原，而不只是沙丘。',
    ],
    priority: 16,
  }),
  desert({
    id: 'lut',
    zh: '卢特沙漠',
    en: 'Lut Desert',
    aliases: ['Dasht-e Lut', 'Dasht-i Lut', '达什特卢特'],
    center: [58.5, 30.5],
    cameraDistance: 225,
    region: '伊朗东南部',
    countries: ['IR'],
    area: 51_800,
    landscape: ['风蚀雅丹', '沙丘', '盐碱地'],
    facts: [
      '强风在卢特沙漠塑造出巨大的雅丹地貌，形成平行延伸的风蚀脊。',
      '卫星观测曾在这里记录到极高的地表温度，但地表温度不同于气温。',
    ],
    priority: 17,
  }),
  desert({
    id: 'negev',
    zh: '内盖夫沙漠',
    en: 'Negev Desert',
    aliases: ['Negev'],
    center: [34.8, 30.5],
    cameraDistance: 205,
    region: '西亚地中海东岸南部',
    countries: ['IL'],
    area: 13_000,
    landscape: ['侵蚀谷地', '砾漠', '干河床'],
    facts: [
      '内盖夫拥有由侵蚀形成的大型凹地地貌，外形类似陨石坑但成因不同。',
      '短时暴雨可能在干河床中形成突发洪水，说明沙漠也会经历强烈流水作用。',
    ],
    priority: 18,
  }),
  desert({
    id: 'danakil',
    zh: '达纳基勒沙漠',
    en: 'Danakil Desert',
    aliases: ['Danakil Depression', '达纳基勒凹地'],
    center: [41.5, 13.5],
    cameraDistance: 225,
    region: '非洲之角阿法尔凹地',
    countries: ['ET', 'ER', 'DJ'],
    area: 136_956,
    landscape: ['盐原', '火山地貌', '低地盆地'],
    facts: [
      '达纳基勒位于板块张裂活跃区，火山、热泉和盐原常在同一景观中出现。',
      '部分区域低于海平面，极端高温与稀少降水共同形成严酷环境。',
    ],
    priority: 19,
  }),
  desert({
    id: 'betpak-dala',
    zh: '别特帕克达拉沙漠',
    en: 'Betpak-Dala Desert',
    aliases: ['Betpaqdala', 'Betpak Dala', '饥饿草原'],
    center: [70, 46],
    cameraDistance: 245,
    region: '哈萨克斯坦中南部',
    countries: ['KZ'],
    area: 75_000,
    landscape: ['黏土荒漠', '砾石平原', '盐湖'],
    facts: [
      '别特帕克达拉是一片寒冷的大陆性荒漠，冬夏温差非常明显。',
      '广阔的平坦荒漠也是赛加羚羊迁徙活动所经过的重要区域之一。',
    ],
    priority: 20,
  }),
]

export const deserts: Desert[] = desertCatalogSchema.parse(
  definitions.map((definition) => ({
    id: definition.id,
    name: { zh: definition.zh, en: definition.en },
    aliases: definition.aliases ?? [],
    center: position(definition.center),
    cameraDistance: definition.cameraDistance,
    region: definition.region,
    countryCodes: definition.countries,
    areaSquareKilometers: definition.area,
    approximateArea: true,
    landscape: definition.landscape,
    summary: `${definition.zh}位于${definition.region}，代表了沙丘、砾石、岩石、盐地或耐旱植被共同构成的多样干旱景观。`,
    facts: definition.facts,
    sourceIds: ['natural-earth-deserts', 'britannica-deserts'],
    labelPriority: definition.priority,
  })),
)

export const desertGeometries = desertGeometryCatalogSchema.parse(
  generatedDesertGeometries,
)

export const desertsById = new Map(deserts.map((item) => [item.id, item]))
export const desertGeometriesById = new Map(
  desertGeometries.map((geometry) => [geometry.id, geometry]),
)

export function getDesert(id: string | null | undefined) {
  return id ? desertsById.get(id) : undefined
}

export function getDesertGeometry(id: string | null | undefined) {
  return id ? desertGeometriesById.get(id) : undefined
}
