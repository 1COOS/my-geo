import {
  linearGeoFeatureCatalogSchema,
  type LinearGeoFeature,
  type LinearGeoFeatureGeometry,
} from './linearGeoFeatureSchema'
import { getCanalCameraDistance } from './linearFeatureGeometry'

type Position = [number, number]

type RiverDefinition = {
  id: string
  zh: string
  en: string
  aliases?: string[]
  label: Position
  region: string
  countries: string[]
  length: number
  source: string
  mouth: string
  traversed: string[]
  lines: Position[][]
  priority?: number
}

type CanalDefinition = {
  id: string
  zh: string
  en: string
  aliases?: string[]
  label: Position
  region: string
  countries: string[]
  length: number
  start: string
  end: string
  waters: [string, string]
  openedYear?: number
  lines: Position[][]
  priority?: number
}

const river = (definition: RiverDefinition) => definition
const canal = (definition: CanalDefinition) => definition

// Coordinates are repository-reviewed, simplified teaching centerlines in
// [longitude, latitude] order. They show the general course, not a navigation
// channel, flood limit, legal boundary or real-time hydrological condition.
const rivers: RiverDefinition[] = [
  river({
    id: 'yangtze-system',
    zh: '长江',
    en: 'Yangtze River',
    aliases: ['Chang Jiang'],
    label: [110, 30],
    region: '中国中部与东部',
    countries: ['CN'],
    length: 6300,
    source: '青藏高原唐古拉山脉',
    mouth: '东海',
    traversed: ['青藏高原', '四川盆地', '长江中下游平原'],
    lines: [
      [
        [91.5, 33.5],
        [97, 31.5],
        [103, 29.5],
        [108, 30.5],
        [112, 30.2],
        [116, 30.4],
        [121.8, 31.4],
      ],
    ],
    priority: 1,
  }),
  river({
    id: 'yellow-river-system',
    zh: '黄河',
    en: 'Yellow River',
    aliases: ['Huang He'],
    label: [108, 36],
    region: '中国北部',
    countries: ['CN'],
    length: 5464,
    source: '青藏高原巴颜喀拉山脉',
    mouth: '渤海',
    traversed: ['青藏高原', '黄土高原', '华北平原'],
    lines: [
      [
        [96, 34.5],
        [101, 35],
        [106, 37],
        [111, 40],
        [114, 37],
        [118.8, 37.8],
      ],
    ],
    priority: 2,
  }),
  river({
    id: 'pearl-river-system',
    zh: '珠江',
    en: 'Pearl River system',
    aliases: ['Zhu Jiang'],
    label: [111, 23.5],
    region: '中国南部',
    countries: ['CN'],
    length: 2400,
    source: '云贵高原诸水系',
    mouth: '南海珠江口',
    traversed: ['云贵高原', '广西丘陵', '珠江三角洲'],
    lines: [
      [
        [104, 25],
        [108, 24],
        [111, 23],
        [113.6, 22.5],
      ],
      [
        [106, 26],
        [109, 24.5],
        [111, 23],
      ],
    ],
    priority: 8,
  }),
  river({
    id: 'mekong-system',
    zh: '湄公河',
    en: 'Mekong River',
    aliases: ['Lancang River', '澜沧江'],
    label: [103, 18],
    region: '中国西南与东南亚',
    countries: ['CN', 'MM', 'LA', 'TH', 'KH', 'VN'],
    length: 4350,
    source: '青藏高原',
    mouth: '南海湄公河三角洲',
    traversed: ['横断山区', '中南半岛', '湄公河三角洲'],
    lines: [
      [
        [94, 33],
        [99, 25],
        [101, 21],
        [103, 17],
        [104, 12],
        [105.8, 9.5],
      ],
    ],
    priority: 5,
  }),
  river({
    id: 'ganges-brahmaputra-system',
    zh: '恒河—布拉马普特拉河',
    en: 'Ganges–Brahmaputra system',
    aliases: ['Ganges', 'Brahmaputra'],
    label: [88, 25],
    region: '南亚',
    countries: ['CN', 'IN', 'NP', 'BT', 'BD'],
    length: 2900,
    source: '喜马拉雅山脉与青藏高原',
    mouth: '孟加拉湾',
    traversed: ['恒河平原', '阿萨姆谷地', '恒河三角洲'],
    lines: [
      [
        [79, 30],
        [82, 27],
        [87, 25],
        [90, 22],
      ],
      [
        [92, 30],
        [95, 28],
        [91, 25],
        [90, 22],
      ],
    ],
    priority: 3,
  }),
  river({
    id: 'indus-system',
    zh: '印度河',
    en: 'Indus River',
    aliases: [],
    label: [70, 27],
    region: '青藏高原西部与南亚',
    countries: ['CN', 'IN', 'PK'],
    length: 3180,
    source: '青藏高原西部',
    mouth: '阿拉伯海',
    traversed: ['喀喇昆仑山区', '旁遮普平原', '信德平原'],
    lines: [
      [
        [81, 32],
        [75, 34],
        [72, 31],
        [70, 26],
        [67.5, 24],
      ],
    ],
    priority: 7,
  }),
  river({
    id: 'tigris-euphrates-system',
    zh: '底格里斯—幼发拉底河',
    en: 'Tigris–Euphrates system',
    aliases: ['Mesopotamian rivers'],
    label: [43, 33],
    region: '西亚美索不达米亚',
    countries: ['TR', 'SY', 'IQ'],
    length: 2800,
    source: '安纳托利亚高原',
    mouth: '波斯湾',
    traversed: ['安纳托利亚', '叙利亚高原', '美索不达米亚平原'],
    lines: [
      [
        [39, 39],
        [38, 36],
        [41, 34],
        [44, 31],
        [48, 29.5],
      ],
      [
        [42, 38],
        [43, 35],
        [45, 32],
        [48, 29.5],
      ],
    ],
    priority: 10,
  }),
  river({
    id: 'ob-irtysh-system',
    zh: '鄂毕—额尔齐斯河',
    en: 'Ob–Irtysh system',
    aliases: ['Ob River', 'Irtysh River'],
    label: [72, 58],
    region: '中亚北部与西西伯利亚',
    countries: ['CN', 'KZ', 'RU'],
    length: 5410,
    source: '阿尔泰山脉及西伯利亚南部',
    mouth: '喀拉海鄂毕湾',
    traversed: ['阿尔泰山地', '西西伯利亚平原'],
    lines: [
      [
        [88, 48],
        [82, 52],
        [75, 55],
        [70, 62],
        [72, 68],
      ],
      [
        [90, 47],
        [80, 50],
        [75, 55],
      ],
    ],
    priority: 12,
  }),
  river({
    id: 'yenisei-angara-system',
    zh: '叶尼塞—安加拉河',
    en: 'Yenisei–Angara system',
    aliases: ['Yenisei River'],
    label: [91, 59],
    region: '蒙古高原北部与中西伯利亚',
    countries: ['MN', 'RU'],
    length: 5539,
    source: '蒙古高原与贝加尔湖水系',
    mouth: '喀拉海叶尼塞湾',
    traversed: ['图瓦盆地', '中西伯利亚高原'],
    lines: [
      [
        [98, 51],
        [92, 54],
        [90, 60],
        [86, 67],
        [83, 72],
      ],
      [
        [108, 52],
        [104, 56],
        [94, 58],
        [90, 60],
      ],
    ],
    priority: 13,
  }),
  river({
    id: 'lena-system',
    zh: '勒拿河',
    en: 'Lena River',
    aliases: [],
    label: [120, 62],
    region: '东西伯利亚',
    countries: ['RU'],
    length: 4400,
    source: '贝加尔山脉',
    mouth: '拉普捷夫海',
    traversed: ['中西伯利亚高原东缘', '雅库特平原'],
    lines: [
      [
        [107, 54],
        [114, 58],
        [121, 63],
        [126, 68],
        [126, 72],
      ],
    ],
    priority: 14,
  }),
  river({
    id: 'amur-system',
    zh: '黑龙江—阿穆尔河',
    en: 'Amur River system',
    aliases: ['Heilong Jiang'],
    label: [125, 49],
    region: '东北亚',
    countries: ['CN', 'MN', 'RU'],
    length: 4444,
    source: '石勒喀河与额尔古纳河汇合处',
    mouth: '鄂霍次克海鞑靼海峡附近',
    traversed: ['蒙古高原东部', '东北平原北缘', '俄罗斯远东'],
    lines: [
      [
        [110, 49],
        [118, 50],
        [126, 49],
        [134, 48],
        [140, 53],
      ],
    ],
    priority: 11,
  }),
  river({
    id: 'volga-system',
    zh: '伏尔加河',
    en: 'Volga River',
    aliases: [],
    label: [47, 51],
    region: '俄罗斯欧洲部分',
    countries: ['RU'],
    length: 3530,
    source: '瓦尔代丘陵',
    mouth: '里海',
    traversed: ['东欧平原', '伏尔加河中下游平原'],
    lines: [
      [
        [33, 57],
        [40, 56],
        [46, 53],
        [49, 48],
        [48, 45],
      ],
    ],
    priority: 9,
  }),
  river({
    id: 'danube-system',
    zh: '多瑙河',
    en: 'Danube River',
    aliases: [],
    label: [20, 46],
    region: '中欧与东南欧',
    countries: ['DE', 'AT', 'SK', 'HU', 'HR', 'RS', 'RO', 'BG', 'MD', 'UA'],
    length: 2850,
    source: '德国黑森林',
    mouth: '黑海多瑙河三角洲',
    traversed: ['中欧盆地', '潘诺尼亚平原', '多瑙河下游平原'],
    lines: [
      [
        [8, 48],
        [14, 48],
        [19, 47],
        [24, 45],
        [29.7, 45.2],
      ],
    ],
    priority: 4,
  }),
  river({
    id: 'rhine-system',
    zh: '莱茵河',
    en: 'Rhine River',
    aliases: [],
    label: [7, 50],
    region: '西欧',
    countries: ['CH', 'LI', 'AT', 'DE', 'FR', 'NL'],
    length: 1230,
    source: '瑞士阿尔卑斯山',
    mouth: '北海莱茵—马斯三角洲',
    traversed: ['阿尔卑斯山区', '上莱茵平原', '西欧平原'],
    lines: [
      [
        [9, 46.5],
        [8, 48],
        [7, 50],
        [6, 52],
        [4, 52],
      ],
    ],
    priority: 6,
  }),
  river({
    id: 'nile-system',
    zh: '尼罗河',
    en: 'Nile River',
    aliases: ['White Nile', 'Blue Nile'],
    label: [31, 18],
    region: '非洲东北部',
    countries: ['BI', 'RW', 'TZ', 'UG', 'SS', 'SD', 'ET', 'EG'],
    length: 6650,
    source: '东非湖区与埃塞俄比亚高原',
    mouth: '地中海尼罗河三角洲',
    traversed: ['东非高原', '苏丹平原', '撒哈拉沙漠东部'],
    lines: [
      [
        [31, -2],
        [32, 5],
        [31, 12],
        [32, 20],
        [31, 30],
      ],
      [
        [36, 12],
        [34, 15],
        [32, 16],
      ],
    ],
    priority: 1,
  }),
  river({
    id: 'congo-system',
    zh: '刚果河',
    en: 'Congo River',
    aliases: ['Zaire River'],
    label: [20, -2],
    region: '非洲中部',
    countries: ['CD', 'CG', 'AO', 'ZM'],
    length: 4700,
    source: '赞比亚高原与东非裂谷西缘',
    mouth: '大西洋',
    traversed: ['加丹加高原', '刚果盆地'],
    lines: [
      [
        [28, -12],
        [26, -6],
        [24, 0],
        [18, 2],
        [12, -6],
      ],
    ],
    priority: 2,
  }),
  river({
    id: 'niger-system',
    zh: '尼日尔河',
    en: 'Niger River',
    aliases: [],
    label: [-2, 14],
    region: '西非',
    countries: ['GN', 'ML', 'NE', 'BJ', 'NG'],
    length: 4180,
    source: '几内亚高地',
    mouth: '几内亚湾尼日尔三角洲',
    traversed: ['几内亚高地', '萨赫勒', '尼日尔河三角洲'],
    lines: [
      [
        [-10, 10],
        [-5, 14],
        [1, 16],
        [6, 13],
        [7, 5],
      ],
    ],
    priority: 5,
  }),
  river({
    id: 'zambezi-system',
    zh: '赞比西河',
    en: 'Zambezi River',
    aliases: [],
    label: [25, -17],
    region: '非洲南部',
    countries: ['ZM', 'AO', 'NA', 'BW', 'ZW', 'MZ'],
    length: 2574,
    source: '赞比亚西北高地',
    mouth: '印度洋',
    traversed: ['中南非高原', '维多利亚瀑布', '莫桑比克平原'],
    lines: [
      [
        [24, -11],
        [23, -17],
        [27, -18],
        [33, -17],
        [36, -19],
      ],
    ],
    priority: 6,
  }),
  river({
    id: 'orange-system',
    zh: '奥兰治河',
    en: 'Orange River',
    aliases: ['Gariep River'],
    label: [23, -29],
    region: '非洲南部',
    countries: ['LS', 'ZA', 'NA'],
    length: 2200,
    source: '德拉肯斯山脉',
    mouth: '大西洋',
    traversed: ['莱索托高地', '南非高原', '纳米布南缘'],
    lines: [
      [
        [29, -29],
        [25, -30],
        [20, -29],
        [16, -28.6],
      ],
    ],
    priority: 15,
  }),
  river({
    id: 'mississippi-missouri-system',
    zh: '密西西比—密苏里河',
    en: 'Mississippi–Missouri system',
    aliases: ['Mississippi River', 'Missouri River'],
    label: [-91, 37],
    region: '北美洲中部',
    countries: ['US'],
    length: 6275,
    source: '落基山脉与明尼苏达湖区',
    mouth: '墨西哥湾',
    traversed: ['大平原', '中央低地', '密西西比冲积平原'],
    lines: [
      [
        [-95, 48],
        [-93, 43],
        [-91, 37],
        [-90, 31],
        [-89, 29],
      ],
      [
        [-112, 45],
        [-103, 43],
        [-96, 39],
        [-91, 38],
      ],
    ],
    priority: 1,
  }),
  river({
    id: 'mackenzie-system',
    zh: '麦肯齐河',
    en: 'Mackenzie River system',
    aliases: [],
    label: [-122, 63],
    region: '加拿大西北部',
    countries: ['CA'],
    length: 4241,
    source: '加拿大落基山脉与大奴湖水系',
    mouth: '北冰洋波弗特海',
    traversed: ['加拿大西北内陆', '麦肯齐低地'],
    lines: [
      [
        [-117, 53],
        [-114, 58],
        [-117, 62],
        [-125, 67],
        [-135, 69],
      ],
    ],
    priority: 8,
  }),
  river({
    id: 'saint-lawrence-great-lakes-system',
    zh: '圣劳伦斯河—五大湖水系',
    en: 'Saint Lawrence–Great Lakes system',
    aliases: ['St. Lawrence River'],
    label: [-73, 46],
    region: '北美洲东北部',
    countries: ['CA', 'US'],
    length: 3058,
    source: '五大湖水系',
    mouth: '大西洋圣劳伦斯湾',
    traversed: ['五大湖区', '圣劳伦斯低地'],
    lines: [
      [
        [-92, 47],
        [-84, 46],
        [-78, 44],
        [-73, 46],
        [-64, 49],
      ],
    ],
    priority: 4,
  }),
  river({
    id: 'colorado-system',
    zh: '科罗拉多河',
    en: 'Colorado River',
    aliases: [],
    label: [-112, 36],
    region: '北美洲西南部',
    countries: ['US', 'MX'],
    length: 2330,
    source: '落基山脉',
    mouth: '加利福尼亚湾',
    traversed: ['科罗拉多高原', '大峡谷', '索诺拉沙漠'],
    lines: [
      [
        [-106, 40],
        [-110, 38],
        [-112, 36],
        [-114, 33],
        [-114.8, 31.7],
      ],
    ],
    priority: 5,
  }),
  river({
    id: 'rio-grande-system',
    zh: '格兰德河',
    en: 'Rio Grande',
    aliases: ['Río Bravo'],
    label: [-105, 30],
    region: '美国与墨西哥边境地区',
    countries: ['US', 'MX'],
    length: 3051,
    source: '科罗拉多州圣胡安山脉',
    mouth: '墨西哥湾',
    traversed: ['新墨西哥高地', '奇瓦瓦沙漠', '墨西哥湾沿岸平原'],
    lines: [
      [
        [-107, 38],
        [-106, 33],
        [-105, 30],
        [-101, 28],
        [-97, 25.9],
      ],
    ],
    priority: 10,
  }),
  river({
    id: 'yukon-system',
    zh: '育空河',
    en: 'Yukon River',
    aliases: [],
    label: [-150, 64],
    region: '加拿大西北部与阿拉斯加',
    countries: ['CA', 'US'],
    length: 3185,
    source: '加拿大不列颠哥伦比亚北部湖区',
    mouth: '白令海',
    traversed: ['育空高原', '阿拉斯加内陆'],
    lines: [
      [
        [-133, 59],
        [-140, 63],
        [-150, 65],
        [-161, 63.5],
        [-165, 62],
      ],
    ],
    priority: 12,
  }),
  river({
    id: 'amazon-system',
    zh: '亚马孙河',
    en: 'Amazon River',
    aliases: ['Amazonas'],
    label: [-61, -4],
    region: '南美洲北部',
    countries: ['PE', 'CO', 'BR'],
    length: 6400,
    source: '安第斯山脉',
    mouth: '大西洋',
    traversed: ['安第斯山麓', '亚马孙盆地'],
    lines: [
      [
        [-75, -11],
        [-70, -5],
        [-64, -4],
        [-57, -3],
        [-50, 0],
      ],
    ],
    priority: 1,
  }),
  river({
    id: 'parana-paraguay-system',
    zh: '巴拉那—巴拉圭河',
    en: 'Paraná–Paraguay system',
    aliases: ['Paraná River', 'Paraguay River'],
    label: [-58, -27],
    region: '南美洲中南部',
    countries: ['BR', 'BO', 'PY', 'AR', 'UY'],
    length: 4880,
    source: '巴西高原诸水系',
    mouth: '拉普拉塔河口',
    traversed: ['巴西高原南缘', '潘塔纳尔湿地', '拉普拉塔平原'],
    lines: [
      [
        [-49, -20],
        [-54, -24],
        [-58, -28],
        [-59, -34],
        [-58, -35],
      ],
      [
        [-58, -17],
        [-58, -23],
        [-58, -28],
      ],
    ],
    priority: 3,
  }),
  river({
    id: 'orinoco-system',
    zh: '奥里诺科河',
    en: 'Orinoco River',
    aliases: [],
    label: [-65, 7],
    region: '南美洲北部',
    countries: ['VE', 'CO'],
    length: 2140,
    source: '圭亚那高原西南部',
    mouth: '大西洋奥里诺科三角洲',
    traversed: ['圭亚那高原边缘', '奥里诺科平原'],
    lines: [
      [
        [-64, 2],
        [-68, 5],
        [-66, 8],
        [-61, 9],
        [-60, 8],
      ],
    ],
    priority: 6,
  }),
  river({
    id: 'sao-francisco-system',
    zh: '圣弗朗西斯科河',
    en: 'São Francisco River',
    aliases: [],
    label: [-43, -13],
    region: '巴西东部',
    countries: ['BR'],
    length: 2914,
    source: '巴西高原卡纳斯特拉山脉',
    mouth: '大西洋',
    traversed: ['巴西高原东部', '巴伊亚内陆'],
    lines: [
      [
        [-46, -20],
        [-44, -15],
        [-43, -10],
        [-40, -10.5],
        [-36.5, -10.5],
      ],
    ],
    priority: 10,
  }),
  river({
    id: 'murray-darling-system',
    zh: '墨累—达令河',
    en: 'Murray–Darling system',
    aliases: ['Murray River', 'Darling River'],
    label: [143, -34],
    region: '澳大利亚东南部',
    countries: ['AU'],
    length: 3672,
    source: '大分水岭诸水系',
    mouth: '南大洋沿岸亚历山德里娜湖',
    traversed: ['澳大利亚东南内陆平原', '墨累低地'],
    lines: [
      [
        [148, -36],
        [145, -35],
        [141, -34],
        [138.5, -35.5],
      ],
      [
        [147, -29],
        [145, -32],
        [142, -34],
      ],
    ],
    priority: 1,
  }),
]

const canals: CanalDefinition[] = [
  canal({
    id: 'suez-canal',
    zh: '苏伊士运河',
    en: 'Suez Canal',
    aliases: [],
    label: [32.4, 30.3],
    region: '埃及苏伊士地峡',
    countries: ['EG'],
    length: 193,
    start: '塞得港',
    end: '苏伊士',
    waters: ['地中海', '红海'],
    openedYear: 1869,
    lines: [
      [
        [32.3, 31.3],
        [32.4, 30.7],
        [32.5, 30],
        [32.55, 29.9],
      ],
    ],
    priority: 1,
  }),
  canal({
    id: 'panama-canal',
    zh: '巴拿马运河',
    en: 'Panama Canal',
    aliases: [],
    label: [-79.7, 9.1],
    region: '巴拿马地峡',
    countries: ['PA'],
    length: 82,
    start: '科隆附近',
    end: '巴尔博亚附近',
    waters: ['加勒比海', '太平洋'],
    openedYear: 1914,
    lines: [
      [
        [-79.9, 9.35],
        [-79.75, 9.15],
        [-79.65, 9],
        [-79.55, 8.9],
      ],
    ],
    priority: 2,
  }),
  canal({
    id: 'grand-canal-china',
    zh: '京杭大运河',
    en: 'Beijing–Hangzhou Grand Canal',
    aliases: ['中国大运河', 'Grand Canal of China'],
    label: [117, 34],
    region: '中国东部',
    countries: ['CN'],
    length: 1794,
    start: '北京',
    end: '杭州',
    waters: ['海河与黄河水系', '长江与钱塘江水系'],
    openedYear: 605,
    lines: [
      [
        [116.4, 40],
        [116.8, 37],
        [116.6, 34],
        [119, 31],
        [120.2, 30.3],
      ],
    ],
    priority: 3,
  }),
  canal({
    id: 'kiel-canal',
    zh: '基尔运河',
    en: 'Kiel Canal',
    aliases: ['Nord-Ostsee-Kanal'],
    label: [9.4, 54.3],
    region: '德国北部石勒苏益格—荷尔斯泰因',
    countries: ['DE'],
    length: 98,
    start: '布伦斯比特尔',
    end: '基尔霍尔特瑙',
    waters: ['北海', '波罗的海'],
    openedYear: 1895,
    lines: [
      [
        [9.15, 53.9],
        [9.5, 54.1],
        [10.15, 54.37],
      ],
    ],
    priority: 5,
  }),
  canal({
    id: 'corinth-canal',
    zh: '科林斯运河',
    en: 'Corinth Canal',
    aliases: [],
    label: [23, 37.93],
    region: '希腊科林斯地峡',
    countries: ['GR'],
    length: 6.4,
    start: '科林斯湾',
    end: '萨罗尼科斯湾',
    waters: ['爱奥尼亚海水系', '爱琴海水系'],
    openedYear: 1893,
    lines: [
      [
        [22.96, 37.95],
        [23.01, 37.93],
        [23.07, 37.91],
      ],
    ],
    priority: 8,
  }),
  canal({
    id: 'erie-canal',
    zh: '伊利运河',
    en: 'Erie Canal',
    aliases: [],
    label: [-75, 43],
    region: '美国纽约州',
    countries: ['US'],
    length: 584,
    start: '伊利湖布法罗',
    end: '哈得孙河奥尔巴尼',
    waters: ['五大湖', '哈得孙河—大西洋'],
    openedYear: 1825,
    lines: [
      [
        [-78.9, 42.9],
        [-76.5, 43.1],
        [-74.8, 43],
        [-73.75, 42.65],
      ],
    ],
    priority: 6,
  }),
  canal({
    id: 'welland-canal',
    zh: '韦兰运河',
    en: 'Welland Canal',
    aliases: [],
    label: [-79.2, 43.1],
    region: '加拿大安大略省尼亚加拉半岛',
    countries: ['CA'],
    length: 43.4,
    start: '伊利湖科尔伯恩港',
    end: '安大略湖圣凯瑟琳斯',
    waters: ['伊利湖', '安大略湖'],
    openedYear: 1829,
    lines: [
      [
        [-79.25, 42.88],
        [-79.22, 43.05],
        [-79.2, 43.22],
      ],
    ],
    priority: 9,
  }),
  canal({
    id: 'volga-don-canal',
    zh: '伏尔加—顿河运河',
    en: 'Volga–Don Canal',
    aliases: [],
    label: [44.7, 48.7],
    region: '俄罗斯南部',
    countries: ['RU'],
    length: 101,
    start: '伏尔加河伏尔加格勒附近',
    end: '顿河卡拉奇附近',
    waters: ['里海水系', '亚速海—黑海水系'],
    openedYear: 1952,
    lines: [
      [
        [44.6, 48.7],
        [44, 48.8],
        [43.5, 48.7],
      ],
    ],
    priority: 7,
  }),
  canal({
    id: 'white-sea-baltic-canal',
    zh: '白海—波罗的海运河',
    en: 'White Sea–Baltic Canal',
    aliases: [],
    label: [35.8, 63.5],
    region: '俄罗斯西北部',
    countries: ['RU'],
    length: 227,
    start: '白海别洛莫尔斯克附近',
    end: '奥涅加湖',
    waters: ['白海', '波罗的海水系'],
    openedYear: 1933,
    lines: [
      [
        [34.8, 64.5],
        [35.5, 63.5],
        [34.7, 62.5],
      ],
    ],
    priority: 10,
  }),
  canal({
    id: 'rhine-main-danube-canal',
    zh: '莱茵—美因—多瑙运河',
    en: 'Rhine–Main–Danube Canal',
    aliases: ['Main–Danube Canal'],
    label: [11.2, 49.2],
    region: '德国南部',
    countries: ['DE'],
    length: 171,
    start: '美因河班贝格附近',
    end: '多瑙河凯尔海姆附近',
    waters: ['莱茵河—北海水系', '多瑙河—黑海水系'],
    openedYear: 1992,
    lines: [
      [
        [10.9, 49.9],
        [11.2, 49.4],
        [11.9, 48.9],
      ],
    ],
    priority: 4,
  }),
]

const featureKindLabels = { river: '河流水系', canal: '人工运河' } as const

function lowDetail(lines: Position[][]) {
  return lines.map((line) =>
    line.length <= 3
      ? line
      : [line[0], line[Math.floor(line.length / 2)], line.at(-1)!],
  )
}

function buildRiver(definition: RiverDefinition): LinearGeoFeature {
  return {
    id: definition.id,
    name: { zh: definition.zh, en: definition.en },
    aliases: definition.aliases ?? [],
    kind: 'river',
    labelPosition: {
      longitude: definition.label[0],
      latitude: definition.label[1],
    },
    cameraPosition: {
      longitude: definition.label[0],
      latitude: definition.label[1],
    },
    cameraDistance: 235,
    region: definition.region,
    countryCodes: definition.countries,
    lengthKilometers: definition.length,
    approximateLength: true,
    source: definition.source,
    mouth: definition.mouth,
    traversedRegions: definition.traversed,
    summary: `${definition.zh}是${definition.region}的重要${featureKindLabels.river}，从${definition.source}流向${definition.mouth}。`,
    facts: [
      `该水系全长约${definition.length.toLocaleString('zh-CN')}千米，长度会因水系口径和测量方法不同而变化。`,
      `它串联${definition.traversed.join('、')}等自然地理区域。`,
    ],
    sourceIds: ['natural-earth-rivers', 'britannica-rivers'],
    labelPriority: definition.priority ?? 30,
  }
}

function buildCanal(definition: CanalDefinition): LinearGeoFeature {
  const geometry = buildGeometry(definition)
  return {
    id: definition.id,
    name: { zh: definition.zh, en: definition.en },
    aliases: definition.aliases ?? [],
    kind: 'canal',
    labelPosition: {
      longitude: definition.label[0],
      latitude: definition.label[1],
    },
    cameraPosition: {
      longitude: definition.label[0],
      latitude: definition.label[1],
    },
    cameraDistance: getCanalCameraDistance(geometry.geometry),
    region: definition.region,
    countryCodes: definition.countries,
    lengthKilometers: definition.length,
    approximateLength: false,
    start: definition.start,
    end: definition.end,
    connectedWaters: definition.waters,
    openedYear: definition.openedYear,
    summary: `${definition.zh}位于${definition.region}，连接${definition.waters[0]}与${definition.waters[1]}。`,
    facts: [
      `${definition.zh}全长约${definition.length.toLocaleString('zh-CN')}千米，是重要的人工水道。`,
      definition.openedYear
        ? `其代表性通航阶段始于${definition.openedYear}年。`
        : `它通过人工开挖和水工设施连接原本分隔的水系。`,
    ],
    sourceIds:
      definition.id === 'grand-canal-china'
        ? ['unesco-grand-canal', 'britannica-canals']
        : definition.id === 'suez-canal'
          ? ['suez-canal-authority', 'britannica-canals']
          : definition.id === 'panama-canal'
            ? ['panama-canal-authority', 'britannica-canals']
            : ['britannica-canals'],
    labelPriority: definition.priority ?? 30,
  }
}

function buildGeometry(definition: CanalDefinition): LinearGeoFeatureGeometry {
  const lowDetailCoordinates = lowDetail(definition.lines)
  return {
    id: definition.id,
    geometry: { type: 'MultiLineString', coordinates: definition.lines },
    mediumDetailGeometry: {
      type: 'MultiLineString',
      coordinates: definition.lines,
    },
    lowDetailGeometry: {
      type: 'MultiLineString',
      coordinates: lowDetailCoordinates,
    },
  }
}

export const linearGeoFeatures = linearGeoFeatureCatalogSchema.parse([
  ...rivers.map(buildRiver),
  ...canals.map(buildCanal),
])
export const linearGeoFeaturesById = new Map(
  linearGeoFeatures.map((feature) => [feature.id, feature]),
)

export function getLinearGeoFeature(id: string | null | undefined) {
  return id ? linearGeoFeaturesById.get(id) : undefined
}

export function getEmbeddedLinearFeatureGeometries() {
  return canals.map(buildGeometry)
}

export const linearGeoFeatureKindLabels = {
  river: '河流',
  canal: '运河',
} as const
