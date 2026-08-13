import { countrySourcesById } from './countries'
import {
  waterbodyCatalogSchema,
  waterbodyGeometryCatalogSchema,
  type Waterbody,
  type WaterbodyGeometry,
  type WaterbodyKind,
} from './waterbodySchema'

type SurfaceDefinition = {
  id: string
  zh: string
  en: string
  kind: Exclude<WaterbodyKind, 'trench'>
  center: [number, number]
  bounds: [number, number, number, number]
  region: string
  land: string[]
  countries?: string[]
  aliases?: string[]
  priority?: number
}

type TrenchDefinition = Omit<SurfaceDefinition, 'kind' | 'bounds'> & {
  kind: 'trench'
  points: [number, number][]
}

type Definition = SurfaceDefinition | TrenchDefinition

const surface = (
  id: string,
  zh: string,
  en: string,
  kind: SurfaceDefinition['kind'],
  center: [number, number],
  bounds: [number, number, number, number],
  region: string,
  land: string[],
  extras: Partial<SurfaceDefinition> = {},
): SurfaceDefinition => ({
  id,
  zh,
  en,
  kind,
  center,
  bounds,
  region,
  land,
  ...extras,
})

const trench = (
  id: string,
  zh: string,
  en: string,
  center: [number, number],
  points: [number, number][],
  region: string,
  land: string[],
): TrenchDefinition => ({
  id,
  zh,
  en,
  kind: 'trench',
  center,
  points,
  region,
  land,
})

// These deliberately simplified extents are repository-reviewed teaching
// shapes. They indicate where a named waterbody is found, not a legal,
// hydrographic or jurisdictional boundary.
const definitions: Definition[] = [
  surface(
    'pacific-ocean',
    '太平洋',
    'Pacific Ocean',
    'ocean',
    [0, -160],
    [105, -60, -70, 65],
    '亚洲、大洋洲与美洲之间',
    ['亚洲', '大洋洲', '北美洲', '南美洲'],
    { aliases: ['Pacific'], priority: 1 },
  ),
  surface(
    'atlantic-ocean',
    '大西洋',
    'Atlantic Ocean',
    'ocean',
    [5, -30],
    [-75, -60, 20, 70],
    '美洲与欧洲、非洲之间',
    ['北美洲', '南美洲', '欧洲', '非洲'],
    { aliases: ['Atlantic'], priority: 2 },
  ),
  surface(
    'indian-ocean',
    '印度洋',
    'Indian Ocean',
    'ocean',
    [-20, 80],
    [20, -60, 150, 30],
    '非洲、亚洲与大洋洲之间',
    ['非洲', '亚洲', '大洋洲'],
    { aliases: ['Indian'], priority: 3 },
  ),
  surface(
    'arctic-ocean',
    '北冰洋',
    'Arctic Ocean',
    'ocean',
    [82, 0],
    [-180, 66, 180, 90],
    '北极地区',
    ['亚洲', '欧洲', '北美洲'],
    { aliases: ['Arctic'], priority: 4 },
  ),
  surface(
    'southern-ocean',
    '南大洋',
    'Southern Ocean',
    'ocean',
    [-66, 20],
    [-180, -90, 180, -55],
    '环绕南极洲',
    ['南极洲'],
    { aliases: ['Antarctic Ocean'], priority: 5 },
  ),
  surface(
    'mediterranean-sea',
    '地中海',
    'Mediterranean Sea',
    'sea',
    [35, 18],
    [-6, 30, 37, 46],
    '欧洲、非洲与亚洲之间',
    ['南欧', '北非', '西亚'],
    { priority: 6 },
  ),
  surface(
    'caribbean-sea',
    '加勒比海',
    'Caribbean Sea',
    'sea',
    [15, -75],
    [-89, 8, -59, 23],
    '中美洲与安的列斯群岛之间',
    ['中美洲', '大安的列斯群岛', '小安的列斯群岛'],
    { priority: 7 },
  ),
  surface(
    'south-china-sea',
    '南海',
    'South China Sea',
    'sea',
    [12, 114],
    [99, -2, 122, 24],
    '东南亚与中国南部之间',
    ['华南', '中南半岛', '马来群岛'],
    { countries: ['CN', 'VN', 'PH', 'MY', 'BN', 'ID'], priority: 8 },
  ),
  surface(
    'east-china-sea',
    '东海',
    'East China Sea',
    'sea',
    [28, 126],
    [117, 23, 132, 34],
    '中国东部、朝鲜半岛与日本之间',
    ['中国东部', '朝鲜半岛', '日本列岛'],
    { countries: ['CN', 'JP', 'KR'], priority: 9 },
  ),
  surface(
    'yellow-sea',
    '黄海',
    'Yellow Sea',
    'sea',
    [35, 123],
    [118, 31, 127, 41],
    '中国与朝鲜半岛之间',
    ['中国东部', '朝鲜半岛'],
    { countries: ['CN', 'KP', 'KR'], priority: 10 },
  ),
  surface(
    'sea-of-japan',
    '日本海',
    'Sea of Japan',
    'sea',
    [40, 135],
    [127, 33, 143, 52],
    '日本列岛与亚洲大陆之间',
    ['日本列岛', '朝鲜半岛', '俄罗斯远东'],
    { aliases: ['East Sea'], countries: ['JP', 'KR', 'KP', 'RU'] },
  ),
  surface(
    'philippine-sea',
    '菲律宾海',
    'Philippine Sea',
    'sea',
    [20, 137],
    [120, 5, 150, 35],
    '菲律宾以东的西太平洋',
    ['菲律宾群岛', '日本南部', '马里亚纳群岛'],
  ),
  surface(
    'bering-sea',
    '白令海',
    'Bering Sea',
    'sea',
    [58, -175],
    [155, 50, -158, 67],
    '亚洲与北美洲北部之间',
    ['俄罗斯远东', '阿拉斯加', '阿留申群岛'],
  ),
  surface(
    'sea-of-okhotsk',
    '鄂霍次克海',
    'Sea of Okhotsk',
    'sea',
    [54, 150],
    [135, 43, 165, 63],
    '俄罗斯远东与日本北海道以北',
    ['俄罗斯远东', '萨哈林岛', '北海道'],
  ),
  surface(
    'coral-sea',
    '珊瑚海',
    'Coral Sea',
    'sea',
    [-18, 155],
    [142, -30, 170, -8],
    '澳大利亚东北与太平洋岛屿之间',
    ['澳大利亚', '新几内亚', '新喀里多尼亚'],
  ),
  surface(
    'tasman-sea',
    '塔斯曼海',
    'Tasman Sea',
    'sea',
    [-38, 160],
    [145, -50, 175, -25],
    '澳大利亚与新西兰之间',
    ['澳大利亚', '新西兰'],
  ),
  surface(
    'arabian-sea',
    '阿拉伯海',
    'Arabian Sea',
    'sea',
    [15, 65],
    [43, 3, 78, 27],
    '阿拉伯半岛与印度次大陆之间',
    ['阿拉伯半岛', '印度次大陆', '非洲之角'],
  ),
  surface(
    'red-sea',
    '红海',
    'Red Sea',
    'sea',
    [20, 38],
    [32, 12, 44, 30],
    '非洲东北部与阿拉伯半岛之间',
    ['非洲东北部', '阿拉伯半岛'],
  ),
  surface(
    'black-sea',
    '黑海',
    'Black Sea',
    'sea',
    [43, 35],
    [27, 40, 42, 47],
    '东南欧与西亚之间',
    ['东南欧', '安纳托利亚', '高加索'],
  ),
  surface(
    'baltic-sea',
    '波罗的海',
    'Baltic Sea',
    'sea',
    [58, 20],
    [9, 53, 31, 66],
    '北欧与中东欧之间',
    ['斯堪的纳维亚半岛', '欧洲大陆'],
  ),
  surface(
    'north-sea',
    '北海',
    'North Sea',
    'sea',
    [56, 3],
    [-5, 50, 10, 62],
    '英国与欧洲大陆之间',
    ['大不列颠岛', '斯堪的纳维亚半岛', '欧洲大陆'],
  ),
  surface(
    'norwegian-sea',
    '挪威海',
    'Norwegian Sea',
    'sea',
    [68, 2],
    [-12, 61, 16, 76],
    '挪威与冰岛之间',
    ['斯堪的纳维亚半岛', '冰岛'],
  ),
  surface(
    'barents-sea',
    '巴伦支海',
    'Barents Sea',
    'sea',
    [75, 40],
    [15, 68, 65, 82],
    '挪威和俄罗斯北部外海',
    ['斯堪的纳维亚半岛', '俄罗斯北部', '斯瓦尔巴群岛'],
  ),
  surface(
    'greenland-sea',
    '格陵兰海',
    'Greenland Sea',
    'sea',
    [74, -5],
    [-30, 66, 15, 82],
    '格陵兰与斯瓦尔巴群岛之间',
    ['格陵兰', '冰岛', '斯瓦尔巴群岛'],
  ),
  surface(
    'labrador-sea',
    '拉布拉多海',
    'Labrador Sea',
    'sea',
    [58, -52],
    [-66, 50, -42, 67],
    '格陵兰与加拿大拉布拉多之间',
    ['格陵兰', '加拿大东北部'],
  ),
  surface(
    'andaman-sea',
    '安达曼海',
    'Andaman Sea',
    'sea',
    [10, 96],
    [91, 3, 101, 17],
    '中南半岛与安达曼群岛之间',
    ['中南半岛', '安达曼群岛', '苏门答腊岛'],
  ),
  surface(
    'java-sea',
    '爪哇海',
    'Java Sea',
    'sea',
    [-5, 112],
    [105, -9, 118, 0],
    '印度尼西亚群岛之间',
    ['爪哇岛', '苏门答腊岛', '加里曼丹岛'],
  ),
  surface(
    'aegean-sea',
    '爱琴海',
    'Aegean Sea',
    'sea',
    [38, 25],
    [22, 35, 29, 41],
    '希腊与土耳其之间',
    ['巴尔干半岛', '安纳托利亚'],
  ),
  surface(
    'adriatic-sea',
    '亚得里亚海',
    'Adriatic Sea',
    'sea',
    [43, 15],
    [12, 39, 20, 46],
    '意大利半岛与巴尔干半岛之间',
    ['意大利半岛', '巴尔干半岛'],
  ),
  surface(
    'caspian-sea',
    '里海',
    'Caspian Sea',
    'sea',
    [42, 51],
    [46, 36, 55, 48],
    '欧洲与亚洲交界的内陆水体',
    ['东欧平原', '高加索', '中亚'],
  ),
  surface(
    'gulf-of-mexico',
    '墨西哥湾',
    'Gulf of Mexico',
    'gulf',
    [24, -90],
    [-98, 18, -80, 31],
    '北美洲东南部',
    ['北美洲', '尤卡坦半岛', '古巴'],
    { priority: 11 },
  ),
  surface(
    'persian-gulf',
    '波斯湾',
    'Persian Gulf',
    'gulf',
    [27, 51],
    [47, 23, 57, 31],
    '伊朗高原与阿拉伯半岛之间',
    ['伊朗高原', '阿拉伯半岛'],
    { aliases: ['Arabian Gulf'], priority: 12 },
  ),
  surface(
    'bay-of-bengal',
    '孟加拉湾',
    'Bay of Bengal',
    'bay',
    [14, 88],
    [78, 5, 100, 23],
    '南亚与东南亚之间',
    ['印度次大陆', '中南半岛'],
  ),
  surface(
    'gulf-of-guinea',
    '几内亚湾',
    'Gulf of Guinea',
    'gulf',
    [1, 3],
    [-16, -6, 15, 8],
    '西非海岸外',
    ['西非', '中非'],
  ),
  surface(
    'gulf-of-alaska',
    '阿拉斯加湾',
    'Gulf of Alaska',
    'gulf',
    [57, -145],
    [-160, 50, -130, 61],
    '北太平洋东北部',
    ['阿拉斯加', '加拿大西部'],
  ),
  surface(
    'hudson-bay',
    '哈德逊湾',
    'Hudson Bay',
    'bay',
    [59, -85],
    [-96, 51, -75, 66],
    '加拿大东北部内陆',
    ['加拿大地盾', '北美洲北部'],
  ),
  surface(
    'strait-of-malacca',
    '马六甲海峡',
    'Strait of Malacca',
    'strait',
    [3, 101],
    [98, 0, 104, 7],
    '马来半岛与苏门答腊岛之间',
    ['马来半岛', '苏门答腊岛'],
    { priority: 6 },
  ),
  surface(
    'strait-of-gibraltar',
    '直布罗陀海峡',
    'Strait of Gibraltar',
    'strait',
    [36, -5.5],
    [-7, 35, -4, 37],
    '欧洲与非洲之间',
    ['伊比利亚半岛', '北非'],
    { priority: 7 },
  ),
  surface(
    'bering-strait',
    '白令海峡',
    'Bering Strait',
    'strait',
    [66, -169],
    [168, 64, -166, 68],
    '亚洲与北美洲之间',
    ['楚科奇半岛', '阿拉斯加'],
  ),
  surface(
    'strait-of-hormuz',
    '霍尔木兹海峡',
    'Strait of Hormuz',
    'strait',
    [26.5, 56.3],
    [55, 25, 58, 28],
    '波斯湾与阿曼湾之间',
    ['伊朗', '阿拉伯半岛'],
  ),
  surface(
    'bosporus',
    '博斯普鲁斯海峡',
    'Bosporus',
    'strait',
    [41.1, 29.1],
    [28.7, 40.8, 29.5, 41.4],
    '黑海与马尔马拉海之间',
    ['欧洲', '亚洲'],
  ),
  surface(
    'bab-el-mandeb',
    '曼德海峡',
    'Bab-el-Mandeb',
    'strait',
    [12.6, 43.4],
    [42.5, 11.8, 44.5, 13.5],
    '红海与亚丁湾之间',
    ['阿拉伯半岛', '非洲之角'],
  ),
  surface(
    'taiwan-strait',
    '台湾海峡',
    'Taiwan Strait',
    'strait',
    [24.2, 119.5],
    [117, 21.5, 122, 26.5],
    '中国大陆东南部与台湾岛之间',
    ['中国大陆东南部', '台湾岛'],
  ),
  surface(
    'korea-strait',
    '朝鲜海峡',
    'Korea Strait',
    'strait',
    [34, 129],
    [127, 32.5, 131, 35.5],
    '朝鲜半岛与日本列岛之间',
    ['朝鲜半岛', '九州岛'],
  ),
  surface(
    'english-channel',
    '英吉利海峡',
    'English Channel',
    'strait',
    [50, -1],
    [-6, 48, 2, 52],
    '英国与法国之间',
    ['大不列颠岛', '欧洲大陆'],
    { aliases: ['La Manche'] },
  ),
  surface(
    'strait-of-magellan',
    '麦哲伦海峡',
    'Strait of Magellan',
    'strait',
    [-53, -72],
    [-75, -55, -67, -51],
    '南美洲大陆与火地岛之间',
    ['南美洲', '火地岛'],
  ),
  trench(
    'mariana-trench',
    '马里亚纳海沟',
    'Mariana Trench',
    [17, 145],
    [
      [11, 143],
      [15, 144],
      [19, 145],
      [22, 147],
    ],
    '西太平洋马里亚纳群岛以东',
    ['马里亚纳群岛'],
  ),
  trench(
    'tonga-trench',
    '汤加海沟',
    'Tonga Trench',
    [-23, -174],
    [
      [-15, -173],
      [-20, -174],
      [-25, -175],
      [-30, -176],
    ],
    '南太平洋汤加群岛以东',
    ['汤加群岛'],
  ),
  trench(
    'puerto-rico-trench',
    '波多黎各海沟',
    'Puerto Rico Trench',
    [20, -66],
    [
      [19, -70],
      [20, -67],
      [20, -64],
      [19, -62],
    ],
    '北大西洋波多黎各以北',
    ['大安的列斯群岛'],
  ),
  trench(
    'java-trench',
    '爪哇海沟',
    'Java Trench',
    [-10, 110],
    [
      [-6, 96],
      [-9, 104],
      [-11, 112],
      [-11, 120],
    ],
    '印度洋苏门答腊岛与爪哇岛以南',
    ['苏门答腊岛', '爪哇岛'],
  ),
]

const kindLabels: Record<WaterbodyKind, string> = {
  ocean: '大洋',
  sea: '海',
  gulf: '海湾',
  bay: '海湾',
  strait: '海峡',
  trench: '海沟',
}

const kindFacts: Record<WaterbodyKind, string> = {
  ocean: '大洋是地球上规模最大的连续咸水区域，并通过全球环流交换热量。',
  sea: '海通常比大洋更靠近大陆或岛屿，并与相邻大洋保持水体交换。',
  gulf: '海湾是海水深入陆地形成的水域，开口通常连接更大的海或洋。',
  bay: '海湾是海岸线向陆地凹入形成的水域，大小和形态差异很大。',
  strait: '海峡是连接两片较大水域、同时分隔两块陆地的狭长水道。',
  trench: '海沟是海底狭长而深的凹地，许多形成于板块俯冲带附近。',
}

function ring(west: number, south: number, east: number, north: number) {
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ]
}

function geometryForBounds(bounds: [number, number, number, number]) {
  const [west, south, east, north] = bounds
  if (west <= east) {
    return {
      type: 'Polygon' as const,
      coordinates: [ring(west, south, east, north)],
    }
  }
  return {
    type: 'MultiPolygon' as const,
    coordinates: [
      [ring(west, south, 180, north)],
      [ring(-180, south, east, north)],
    ],
  }
}

function buildWaterbody(definition: Definition): Waterbody {
  const layer =
    definition.kind === 'strait' || definition.kind === 'trench'
      ? 'waterway'
      : 'ocean'
  return {
    id: definition.id,
    name: { zh: definition.zh, en: definition.en },
    aliases: definition.aliases ?? [],
    kind: definition.kind,
    layer,
    center: { latitude: definition.center[0], longitude: definition.center[1] },
    cameraDistance:
      definition.kind === 'ocean' ? 350 : definition.kind === 'sea' ? 250 : 215,
    region: definition.region,
    adjacentCountryCodes: definition.countries ?? [],
    adjacentLandmasses: definition.land,
    summary: `${definition.zh}位于${definition.region}，属于${kindLabels[definition.kind]}。图层使用简化示意范围帮助理解它在全球的位置。`,
    facts: [
      kindFacts[definition.kind],
      `${definition.zh}位于${definition.region}，与${definition.land.join('、')}等陆地或岛屿区域相邻。`,
    ],
    sourceIds:
      definition.kind === 'trench'
        ? ['gebco-gazetteer', 'noaa-ocean', 'britannica-ocean']
        : ['marine-regions', 'iho-oceans-seas', 'britannica-ocean'],
    labelPriority: definition.priority ?? 30,
  }
}

function buildGeometry(definition: Definition): WaterbodyGeometry {
  if (definition.kind === 'trench') {
    return {
      id: definition.id,
      kind: 'trench',
      points: definition.points,
      lowDetailPoints: [definition.points[0], definition.points.at(-1)!],
    }
  }
  const geometry = geometryForBounds(definition.bounds)
  return {
    id: definition.id,
    kind: 'surface',
    geometry,
    lowDetailGeometry: geometry,
  }
}

export const waterbodies = waterbodyCatalogSchema.parse(
  definitions.map(buildWaterbody),
)
export const waterbodyGeometries = waterbodyGeometryCatalogSchema.parse(
  definitions.map(buildGeometry),
)
export const waterbodiesById = new Map(
  waterbodies.map((waterbody) => [waterbody.id, waterbody]),
)
export const waterbodyGeometriesById = new Map(
  waterbodyGeometries.map((geometry) => [geometry.id, geometry]),
)

export function getWaterbody(id: string | null | undefined) {
  return id ? waterbodiesById.get(id) : undefined
}

export function getWaterbodyGeometry(id: string | null | undefined) {
  return id ? waterbodyGeometriesById.get(id) : undefined
}

export function getWaterbodySource(id: string) {
  return countrySourcesById.get(id)
}

export const waterbodyKindLabels = kindLabels
