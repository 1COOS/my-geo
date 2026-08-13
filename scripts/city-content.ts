import type { CitySelectionReason } from '../src/data/citySchema'

export type ReviewedCitySelection = {
  sourceName: string
  nameZh: string
  reasons: CitySelectionReason[]
}

const population = 'population_center' as const
const economic = 'economic_center' as const
const global = 'global_fame' as const
const cultural = 'cultural_tourism' as const
const regional = 'regional_center' as const

export const priorityCityCounts = {
  CN: 5,
  IN: 5,
  US: 5,
  JP: 5,
  RU: 5,
  DE: 5,
  FR: 5,
  GB: 5,
  IT: 5,
  BR: 5,
  MX: 5,
  ID: 5,
  TR: 5,
  ES: 5,
  KR: 4,
  CA: 4,
  AU: 4,
  PK: 4,
  BD: 4,
  VN: 4,
  TH: 4,
  PH: 4,
  SA: 4,
  IR: 4,
  ZA: 4,
  EG: 4,
  NG: 4,
  AR: 4,
  CO: 4,
  PE: 4,
  PL: 4,
  MY: 3,
  AE: 3,
  IL: 3,
  NL: 3,
  CH: 3,
  SE: 3,
  NO: 3,
  GR: 3,
  PT: 3,
  AT: 3,
  CZ: 3,
  CL: 3,
  CU: 3,
  KE: 3,
  MA: 3,
  ET: 3,
  TZ: 3,
  NZ: 3,
  SG: 1,
} as const

export const reviewedCitySelections: Record<
  keyof typeof priorityCityCounts,
  ReviewedCitySelection[]
> = {
  CN: [
    {
      sourceName: 'Shanghai',
      nameZh: '上海',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Guangzhou',
      nameZh: '广州',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Shenzhen',
      nameZh: '深圳',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Chengdu',
      nameZh: '成都',
      reasons: [population, cultural, regional],
    },
  ],
  IN: [
    {
      sourceName: 'Mumbai',
      nameZh: '孟买',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Bangalore',
      nameZh: '班加罗尔',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Kolkata',
      nameZh: '加尔各答',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Chennai',
      nameZh: '金奈',
      reasons: [population, economic, regional],
    },
  ],
  US: [
    {
      sourceName: 'New York',
      nameZh: '纽约',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Los Angeles',
      nameZh: '洛杉矶',
      reasons: [population, economic, global, cultural],
    },
    {
      sourceName: 'Chicago',
      nameZh: '芝加哥',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'San Francisco',
      nameZh: '旧金山',
      reasons: [economic, global, cultural],
    },
  ],
  JP: [
    {
      sourceName: 'Osaka',
      nameZh: '大阪',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Yokohama',
      nameZh: '横滨',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Nagoya',
      nameZh: '名古屋',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Kyoto', nameZh: '京都', reasons: [global, cultural] },
  ],
  RU: [
    {
      sourceName: 'Saint Petersburg',
      nameZh: '圣彼得堡',
      reasons: [population, global, cultural],
    },
    {
      sourceName: 'Novosibirsk',
      nameZh: '新西伯利亚',
      reasons: [population, regional],
    },
    {
      sourceName: 'Yekaterinburg',
      nameZh: '叶卡捷琳堡',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Kazan',
      nameZh: '喀山',
      reasons: [population, cultural, regional],
    },
  ],
  DE: [
    {
      sourceName: 'Munich',
      nameZh: '慕尼黑',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Hamburg',
      nameZh: '汉堡',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Frankfurt',
      nameZh: '法兰克福',
      reasons: [economic, global, regional],
    },
    {
      sourceName: 'Cologne',
      nameZh: '科隆',
      reasons: [population, cultural, regional],
    },
  ],
  FR: [
    {
      sourceName: 'Marseille',
      nameZh: '马赛',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Lyon',
      nameZh: '里昂',
      reasons: [population, economic, cultural],
    },
    {
      sourceName: 'Toulouse',
      nameZh: '图卢兹',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Nice', nameZh: '尼斯', reasons: [global, cultural] },
  ],
  GB: [
    {
      sourceName: 'Birmingham',
      nameZh: '伯明翰',
      reasons: [population, regional],
    },
    {
      sourceName: 'Manchester',
      nameZh: '曼彻斯特',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Edinburgh',
      nameZh: '爱丁堡',
      reasons: [global, cultural, regional],
    },
    { sourceName: 'Liverpool', nameZh: '利物浦', reasons: [global, cultural] },
  ],
  IT: [
    {
      sourceName: 'Milan',
      nameZh: '米兰',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Naples',
      nameZh: '那不勒斯',
      reasons: [population, cultural, global],
    },
    {
      sourceName: 'Turin',
      nameZh: '都灵',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Florence', nameZh: '佛罗伦萨', reasons: [global, cultural] },
  ],
  BR: [
    {
      sourceName: 'Sao Paulo',
      nameZh: '圣保罗',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Rio de Janeiro',
      nameZh: '里约热内卢',
      reasons: [population, global, cultural],
    },
    {
      sourceName: 'Belo Horizonte',
      nameZh: '贝洛奥里藏特',
      reasons: [population, regional],
    },
    {
      sourceName: 'Salvador',
      nameZh: '萨尔瓦多',
      reasons: [population, cultural, regional],
    },
  ],
  MX: [
    {
      sourceName: 'Guadalajara',
      nameZh: '瓜达拉哈拉',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Monterrey',
      nameZh: '蒙特雷',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Tijuana',
      nameZh: '蒂华纳',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Cancun', nameZh: '坎昆', reasons: [global, cultural] },
  ],
  ID: [
    {
      sourceName: 'Surabaya',
      nameZh: '泗水',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Medan',
      nameZh: '棉兰',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Denpasar',
      nameZh: '登巴萨',
      reasons: [global, cultural, regional],
    },
    {
      sourceName: 'Makassar',
      nameZh: '望加锡',
      reasons: [population, regional],
    },
  ],
  TR: [
    {
      sourceName: 'Istanbul',
      nameZh: '伊斯坦布尔',
      reasons: [population, economic, global, cultural],
    },
    {
      sourceName: 'Izmir',
      nameZh: '伊兹密尔',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Bursa',
      nameZh: '布尔萨',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Antalya', nameZh: '安塔利亚', reasons: [global, cultural] },
  ],
  ES: [
    {
      sourceName: 'Barcelona',
      nameZh: '巴塞罗那',
      reasons: [population, economic, global, cultural],
    },
    {
      sourceName: 'Valencia',
      nameZh: '瓦伦西亚',
      reasons: [population, economic, cultural],
    },
    {
      sourceName: 'Sevilla',
      nameZh: '塞维利亚',
      reasons: [population, global, cultural],
    },
    {
      sourceName: 'Bilbao',
      nameZh: '毕尔巴鄂',
      reasons: [economic, cultural, regional],
    },
  ],
  KR: [
    {
      sourceName: 'Busan',
      nameZh: '釜山',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Incheon',
      nameZh: '仁川',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Daegu', nameZh: '大邱', reasons: [population, regional] },
  ],
  CA: [
    {
      sourceName: 'Toronto',
      nameZh: '多伦多',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Montreal',
      nameZh: '蒙特利尔',
      reasons: [population, cultural, global],
    },
    {
      sourceName: 'Vancouver',
      nameZh: '温哥华',
      reasons: [population, economic, global],
    },
  ],
  AU: [
    {
      sourceName: 'Sydney',
      nameZh: '悉尼',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Melbourne',
      nameZh: '墨尔本',
      reasons: [population, economic, global, cultural],
    },
    {
      sourceName: 'Brisbane',
      nameZh: '布里斯班',
      reasons: [population, economic, regional],
    },
  ],
  PK: [
    {
      sourceName: 'Karachi',
      nameZh: '卡拉奇',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Lahore',
      nameZh: '拉合尔',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Faisalabad',
      nameZh: '费萨拉巴德',
      reasons: [population, economic, regional],
    },
  ],
  BD: [
    {
      sourceName: 'Chattogram',
      nameZh: '吉大港',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Khulna', nameZh: '库尔纳', reasons: [population, regional] },
    {
      sourceName: 'Rajshahi',
      nameZh: '拉杰沙希',
      reasons: [population, cultural, regional],
    },
  ],
  VN: [
    {
      sourceName: 'Ho Chi Minh City',
      nameZh: '胡志明市',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Haiphong',
      nameZh: '海防',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Can Tho',
      nameZh: '芹苴',
      reasons: [population, economic, regional],
    },
  ],
  TH: [
    {
      sourceName: 'Chiang Mai',
      nameZh: '清迈',
      reasons: [population, cultural, regional],
    },
    { sourceName: 'Phuket', nameZh: '普吉', reasons: [global, cultural] },
    { sourceName: 'Phatthaya', nameZh: '芭堤雅', reasons: [global, cultural] },
  ],
  PH: [
    {
      sourceName: 'Quezon City',
      nameZh: '奎松市',
      reasons: [population, regional],
    },
    {
      sourceName: 'Davao',
      nameZh: '达沃',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Cebu City',
      nameZh: '宿务市',
      reasons: [population, economic, cultural],
    },
  ],
  SA: [
    {
      sourceName: 'Jeddah',
      nameZh: '吉达',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Mecca', nameZh: '麦加', reasons: [global, cultural] },
    { sourceName: 'Medina', nameZh: '麦地那', reasons: [global, cultural] },
  ],
  IR: [
    {
      sourceName: 'Mashhad',
      nameZh: '马什哈德',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Esfahan',
      nameZh: '伊斯法罕',
      reasons: [population, cultural, global],
    },
    {
      sourceName: 'Shiraz',
      nameZh: '设拉子',
      reasons: [population, cultural, global],
    },
  ],
  ZA: [
    {
      sourceName: 'Johannesburg',
      nameZh: '约翰内斯堡',
      reasons: [population, economic, global],
    },
  ],
  EG: [
    {
      sourceName: 'Alexandria',
      nameZh: '亚历山大',
      reasons: [population, cultural, global],
    },
    {
      sourceName: 'Giza',
      nameZh: '吉萨',
      reasons: [population, cultural, global],
    },
    { sourceName: 'Luxor', nameZh: '卢克索', reasons: [global, cultural] },
  ],
  NG: [
    {
      sourceName: 'Lagos',
      nameZh: '拉各斯',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Kano',
      nameZh: '卡诺',
      reasons: [population, economic, regional],
    },
    { sourceName: 'Ibadan', nameZh: '伊巴丹', reasons: [population, regional] },
  ],
  AR: [
    {
      sourceName: 'Cordoba',
      nameZh: '科尔多瓦',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Rosario',
      nameZh: '罗萨里奥',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Mendoza',
      nameZh: '门多萨',
      reasons: [economic, global, cultural],
    },
  ],
  CO: [
    {
      sourceName: 'Medellin',
      nameZh: '麦德林',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Cali',
      nameZh: '卡利',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Cartagena',
      nameZh: '卡塔赫纳',
      reasons: [global, cultural],
    },
  ],
  PE: [
    {
      sourceName: 'Arequipa',
      nameZh: '阿雷基帕',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Trujillo',
      nameZh: '特鲁希略',
      reasons: [population, cultural, regional],
    },
    { sourceName: 'Cusco', nameZh: '库斯科', reasons: [global, cultural] },
  ],
  PL: [
    {
      sourceName: 'Krakow',
      nameZh: '克拉科夫',
      reasons: [population, global, cultural],
    },
    {
      sourceName: 'Wroclaw',
      nameZh: '弗罗茨瓦夫',
      reasons: [population, economic, cultural],
    },
    {
      sourceName: 'Gdansk',
      nameZh: '格但斯克',
      reasons: [economic, cultural, regional],
    },
  ],
  MY: [
    {
      sourceName: 'George Town',
      nameZh: '乔治市',
      reasons: [population, global, cultural],
    },
    {
      sourceName: 'Johor Bahru',
      nameZh: '新山',
      reasons: [population, economic, regional],
    },
  ],
  AE: [
    {
      sourceName: 'Dubai',
      nameZh: '迪拜',
      reasons: [population, economic, global, cultural],
    },
    {
      sourceName: 'Sharjah',
      nameZh: '沙迦',
      reasons: [population, cultural, regional],
    },
  ],
  IL: [
    {
      sourceName: 'Tel Aviv-Yafo',
      nameZh: '特拉维夫-雅法',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Haifa',
      nameZh: '海法',
      reasons: [population, economic, regional],
    },
  ],
  NL: [
    {
      sourceName: 'Rotterdam',
      nameZh: '鹿特丹',
      reasons: [population, economic, global],
    },
    { sourceName: 'The Hague', nameZh: '海牙', reasons: [global, regional] },
  ],
  CH: [
    {
      sourceName: 'Zurich',
      nameZh: '苏黎世',
      reasons: [population, economic, global],
    },
    { sourceName: 'Geneva', nameZh: '日内瓦', reasons: [global, regional] },
  ],
  SE: [
    {
      sourceName: 'Gothenburg',
      nameZh: '哥德堡',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Malmo',
      nameZh: '马尔默',
      reasons: [population, cultural, regional],
    },
  ],
  NO: [
    {
      sourceName: 'Bergen',
      nameZh: '卑尔根',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Trondheim',
      nameZh: '特隆赫姆',
      reasons: [population, cultural, regional],
    },
  ],
  GR: [
    {
      sourceName: 'Thessaloniki',
      nameZh: '塞萨洛尼基',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Irakleio',
      nameZh: '伊拉克利翁',
      reasons: [population, cultural, regional],
    },
  ],
  PT: [
    {
      sourceName: 'Porto',
      nameZh: '波尔图',
      reasons: [population, economic, global, cultural],
    },
    {
      sourceName: 'Coimbra',
      nameZh: '科英布拉',
      reasons: [cultural, regional],
    },
  ],
  AT: [
    {
      sourceName: 'Graz',
      nameZh: '格拉茨',
      reasons: [population, cultural, regional],
    },
    { sourceName: 'Salzburg', nameZh: '萨尔茨堡', reasons: [global, cultural] },
  ],
  CZ: [
    {
      sourceName: 'Brno',
      nameZh: '布尔诺',
      reasons: [population, economic, regional],
    },
    {
      sourceName: 'Ostrava',
      nameZh: '俄斯特拉发',
      reasons: [population, economic, regional],
    },
  ],
  CL: [
    {
      sourceName: 'Valparaiso',
      nameZh: '瓦尔帕莱索',
      reasons: [global, cultural],
    },
    {
      sourceName: 'Concepcion',
      nameZh: '康塞普西翁',
      reasons: [population, economic, regional],
    },
  ],
  CU: [
    {
      sourceName: 'Santiago de Cuba',
      nameZh: '圣地亚哥-德古巴',
      reasons: [population, cultural, regional],
    },
    { sourceName: 'Trinidad', nameZh: '特立尼达', reasons: [global, cultural] },
  ],
  KE: [
    {
      sourceName: 'Mombasa',
      nameZh: '蒙巴萨',
      reasons: [population, economic, cultural],
    },
    { sourceName: 'Kisumu', nameZh: '基苏木', reasons: [population, regional] },
  ],
  MA: [
    {
      sourceName: 'Casablanca',
      nameZh: '卡萨布兰卡',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Marrakech',
      nameZh: '马拉喀什',
      reasons: [global, cultural],
    },
  ],
  ET: [
    {
      sourceName: 'Gonder',
      nameZh: '贡德尔',
      reasons: [population, cultural, regional],
    },
    {
      sourceName: 'Dire Dawa',
      nameZh: '德雷达瓦',
      reasons: [population, economic, regional],
    },
  ],
  TZ: [
    {
      sourceName: 'Dar es Salaam',
      nameZh: '达累斯萨拉姆',
      reasons: [population, economic, global],
    },
    { sourceName: 'Zanzibar', nameZh: '桑给巴尔', reasons: [global, cultural] },
  ],
  NZ: [
    {
      sourceName: 'Auckland',
      nameZh: '奥克兰',
      reasons: [population, economic, global],
    },
    {
      sourceName: 'Christchurch',
      nameZh: '基督城',
      reasons: [population, cultural, regional],
    },
  ],
  SG: [],
}
