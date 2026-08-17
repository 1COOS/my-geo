import { geographyLearningCatalogSchema } from './geographyLearningSchema'

const sourceIds = [
  'moe-geography-curriculum-2022',
  'britannica-latitude-longitude',
] as const

const catalog = geographyLearningCatalogSchema.parse({
  sources: [
    {
      id: sourceIds[0],
      name: '义务教育课程方案和课程标准（2022年版）',
      publisher: '中华人民共和国教育部',
      url: 'http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
      accessedAt: '2026-08-17',
      usage: '用于确定义务教育阶段地球与地图基础知识的课程范围。',
    },
    {
      id: sourceIds[1],
      name: 'Latitude and longitude reference articles',
      publisher: 'Encyclopaedia Britannica',
      url: 'https://www.britannica.com/science/latitude',
      accessedAt: '2026-08-17',
      usage: '用于复核纬度、经度及重要纬线的通用地理定义。',
    },
  ],
  topics: [
    {
      id: 'grid-reading',
      name: { zh: '经纬网判读', en: 'Reading the Geographic Grid' },
      aliases: ['经纬网', '经纬度', '坐标判读', '纬度', '经度'],
      summary:
        '经纬网用纬线和经线为地球表面建立坐标。My Geo统一按“纬度在前、经度在后”显示位置。',
      rules: [
        '纬线指示东西方向，纬度从赤道0°向南北两极增大到90°。',
        '经线指示南北方向，经度从本初子午线0°向东、向西增大到180°。',
        '先判断目标位于赤道南北和本初子午线东西，再读取度数与方向字母。',
      ],
      commonMistakes: [
        '0°经线和180°经线划分东西经，不等同于20°W与160°E划分东西半球。',
        '经纬网交点必须同时写出纬度和经度，不能只写一个方向。',
      ],
      examples: ['北京约为39.9°N、116.4°E，即北纬39.9°、东经116.4°。'],
      sourceIds,
    },
    {
      id: 'hemispheres',
      name: { zh: '半球划分', en: 'Hemispheres' },
      aliases: ['南北半球', '东西半球', '北半球', '南半球', '东半球', '西半球'],
      summary:
        '赤道划分南北半球；东西半球采用20°W和160°E组成的经线圈，尽量减少对主要大陆的切割。',
      rules: [
        '赤道以北属于北半球，以南属于南半球，赤道本身是分界线。',
        '从20°W向东经过0°到160°E属于东半球，其余范围属于西半球。',
        '20°W和160°E本身显示为东西半球分界线，不归入单一半球。',
      ],
      commonMistakes: [
        '东经不一定都在东半球，西经也不一定都在西半球，应结合20°W和160°E判断。',
      ],
      examples: ['116.4°E位于20°W至160°E之间，因此北京位于东半球。'],
      sourceIds,
    },
    {
      id: 'latitude-zones',
      name: { zh: '低中高纬度', en: 'Latitude Zones' },
      aliases: [
        '低纬度',
        '中纬度',
        '高纬度',
        '纬度分区',
        '30度纬线',
        '60度纬线',
      ],
      summary:
        '南北半球都可按距赤道的纬度大小分为低纬度、中纬度和高纬度，30°与60°是常用分界。',
      rules: [
        '0°至30°之间是低纬度地区，接近赤道。',
        '30°至60°之间是中纬度地区，许多温带大陆位于这里。',
        '60°至90°之间是高纬度地区，接近南北两极。',
      ],
      commonMistakes: [
        '低中高纬按纬度绝对值判断，南纬和北纬使用相同的30°、60°分界。',
      ],
      examples: ['39.9°N位于30°与60°之间，因此北京属于中纬度地区。'],
      sourceIds,
    },
    {
      id: 'earth-zones',
      name: { zh: '地球五带', en: 'Earth’s Heat Zones' },
      aliases: ['五带', '热带', '北温带', '南温带', '北寒带', '南寒带'],
      summary:
        '南北回归线和南北极圈把地球划分为热带、南北温带和南北寒带，反映太阳照射与昼夜现象的纬度差异。',
      rules: [
        '南北回归线之间是热带，有太阳直射现象。',
        '回归线与极圈之间分别是北温带和南温带，四季变化通常较明显。',
        '极圈以内分别是北寒带和南寒带，可能出现极昼和极夜。',
      ],
      commonMistakes: [
        '五带界线是约23.5°的回归线和约66.5°的极圈，不是30°与60°纬线。',
      ],
      examples: ['39.9°N位于北回归线与北极圈之间，因此北京属于北温带。'],
      sourceIds,
    },
  ],
  referenceLines: [
    {
      id: 'equator',
      name: { zh: '赤道', en: 'Equator' },
      shortLabel: '赤道 0°',
      aliases: ['0度纬线', '零度纬线'],
      orientation: 'latitude',
      coordinate: 0,
      category: 'equator',
      topicId: 'hemispheres',
      anchorPosition: { latitude: 0, longitude: 25 },
      focusPosition: { latitude: 0, longitude: 25 },
      cameraDistance: 385,
      explanation: '赤道是0°纬线、最长的纬线，也是南北半球的分界线。',
      sourceIds,
    },
    {
      id: 'tropic-of-cancer',
      name: { zh: '北回归线', en: 'Tropic of Cancer' },
      shortLabel: '北回归线 23.5°N',
      aliases: ['北纬23.5度', '23度26分北纬'],
      orientation: 'latitude',
      coordinate: 23.5,
      category: 'tropic',
      topicId: 'earth-zones',
      anchorPosition: { latitude: 23.5, longitude: 105 },
      focusPosition: { latitude: 23.5, longitude: 105 },
      cameraDistance: 350,
      explanation: '北回归线约为23.5°N，是热带与北温带的分界线。',
      sourceIds,
    },
    {
      id: 'tropic-of-capricorn',
      name: { zh: '南回归线', en: 'Tropic of Capricorn' },
      shortLabel: '南回归线 23.5°S',
      aliases: ['南纬23.5度', '23度26分南纬'],
      orientation: 'latitude',
      coordinate: -23.5,
      category: 'tropic',
      topicId: 'earth-zones',
      anchorPosition: { latitude: -23.5, longitude: 135 },
      focusPosition: { latitude: -23.5, longitude: 135 },
      cameraDistance: 350,
      explanation: '南回归线约为23.5°S，是热带与南温带的分界线。',
      sourceIds,
    },
    {
      id: 'north-low-middle-boundary',
      name: { zh: '北纬30°线', en: '30° North' },
      shortLabel: '30°N',
      aliases: ['北半球低中纬分界'],
      orientation: 'latitude',
      coordinate: 30,
      category: 'latitude-zone-boundary',
      topicId: 'latitude-zones',
      anchorPosition: { latitude: 30, longitude: 35 },
      focusPosition: { latitude: 30, longitude: 35 },
      cameraDistance: 370,
      explanation: '30°N是北半球低纬度与中纬度地区的常用分界线。',
      sourceIds,
    },
    {
      id: 'south-low-middle-boundary',
      name: { zh: '南纬30°线', en: '30° South' },
      shortLabel: '30°S',
      aliases: ['南半球低中纬分界'],
      orientation: 'latitude',
      coordinate: -30,
      category: 'latitude-zone-boundary',
      topicId: 'latitude-zones',
      anchorPosition: { latitude: -30, longitude: 35 },
      focusPosition: { latitude: -30, longitude: 35 },
      cameraDistance: 370,
      explanation: '30°S是南半球低纬度与中纬度地区的常用分界线。',
      sourceIds,
    },
    {
      id: 'north-middle-high-boundary',
      name: { zh: '北纬60°线', en: '60° North' },
      shortLabel: '60°N',
      aliases: ['北半球中高纬分界'],
      orientation: 'latitude',
      coordinate: 60,
      category: 'latitude-zone-boundary',
      topicId: 'latitude-zones',
      anchorPosition: { latitude: 60, longitude: 35 },
      focusPosition: { latitude: 60, longitude: 35 },
      cameraDistance: 370,
      explanation: '60°N是北半球中纬度与高纬度地区的常用分界线。',
      sourceIds,
    },
    {
      id: 'south-middle-high-boundary',
      name: { zh: '南纬60°线', en: '60° South' },
      shortLabel: '60°S',
      aliases: ['南半球中高纬分界'],
      orientation: 'latitude',
      coordinate: -60,
      category: 'latitude-zone-boundary',
      topicId: 'latitude-zones',
      anchorPosition: { latitude: -60, longitude: 35 },
      focusPosition: { latitude: -60, longitude: 35 },
      cameraDistance: 370,
      explanation: '60°S是南半球中纬度与高纬度地区的常用分界线。',
      sourceIds,
    },
    {
      id: 'arctic-circle',
      name: { zh: '北极圈', en: 'Arctic Circle' },
      shortLabel: '北极圈 66.5°N',
      aliases: ['北纬66.5度', '66度34分北纬'],
      orientation: 'latitude',
      coordinate: 66.5,
      category: 'polar-circle',
      topicId: 'earth-zones',
      anchorPosition: { latitude: 66.5, longitude: 30 },
      focusPosition: { latitude: 66.5, longitude: 30 },
      cameraDistance: 350,
      explanation: '北极圈约为66.5°N，是北温带与北寒带的分界线。',
      sourceIds,
    },
    {
      id: 'antarctic-circle',
      name: { zh: '南极圈', en: 'Antarctic Circle' },
      shortLabel: '南极圈 66.5°S',
      aliases: ['南纬66.5度', '66度34分南纬'],
      orientation: 'latitude',
      coordinate: -66.5,
      category: 'polar-circle',
      topicId: 'earth-zones',
      anchorPosition: { latitude: -66.5, longitude: 30 },
      focusPosition: { latitude: -66.5, longitude: 30 },
      cameraDistance: 350,
      explanation: '南极圈约为66.5°S，是南温带与南寒带的分界线。',
      sourceIds,
    },
    {
      id: 'prime-meridian',
      name: { zh: '本初子午线', en: 'Prime Meridian' },
      shortLabel: '本初子午线 0°',
      aliases: ['零度经线', '格林尼治经线'],
      orientation: 'longitude',
      coordinate: 0,
      category: 'longitude-origin',
      topicId: 'grid-reading',
      anchorPosition: { latitude: 12, longitude: 0 },
      focusPosition: { latitude: 12, longitude: 0 },
      cameraDistance: 370,
      explanation:
        '本初子午线是0°经线，是东西经度的起始线，但不是东西半球界线。',
      sourceIds,
    },
    {
      id: 'antimeridian',
      name: { zh: '180°经线', en: '180th Meridian' },
      shortLabel: '180°经线',
      aliases: ['东西经180度', '反子午线'],
      orientation: 'longitude',
      coordinate: 180,
      category: 'longitude-origin',
      topicId: 'grid-reading',
      anchorPosition: { latitude: 12, longitude: 180 },
      focusPosition: { latitude: 12, longitude: 180 },
      cameraDistance: 370,
      explanation: '180°经线是东经和西经共同的终点，与0°经线组成经线圈。',
      sourceIds,
    },
    {
      id: 'western-hemisphere-boundary',
      name: { zh: '20°W半球分界线', en: '20° West Hemisphere Boundary' },
      shortLabel: '20°W 半球界线',
      aliases: ['西经20度', '20W'],
      orientation: 'longitude',
      coordinate: -20,
      category: 'hemisphere-boundary',
      topicId: 'hemispheres',
      anchorPosition: { latitude: -5, longitude: -20 },
      focusPosition: { latitude: -5, longitude: -20 },
      cameraDistance: 370,
      explanation: '20°W与160°E共同组成东西半球分界经线圈。',
      sourceIds,
    },
    {
      id: 'eastern-hemisphere-boundary',
      name: { zh: '160°E半球分界线', en: '160° East Hemisphere Boundary' },
      shortLabel: '160°E 半球界线',
      aliases: ['东经160度', '160E'],
      orientation: 'longitude',
      coordinate: 160,
      category: 'hemisphere-boundary',
      topicId: 'hemispheres',
      anchorPosition: { latitude: -5, longitude: 160 },
      focusPosition: { latitude: -5, longitude: 160 },
      cameraDistance: 370,
      explanation: '160°E与20°W共同组成东西半球分界经线圈。',
      sourceIds,
    },
  ],
})

export const geographyTopics = catalog.topics
export const geographyReferenceLines = catalog.referenceLines
export const geographyLearningSources = catalog.sources

export const geographyTopicsById = new Map(
  geographyTopics.map((topic) => [topic.id, topic]),
)
export const geographyReferenceLinesById = new Map(
  geographyReferenceLines.map((line) => [line.id, line]),
)

export function getGeographyTopic(id: string | null | undefined) {
  return id ? geographyTopicsById.get(id as never) : undefined
}

export function getReferenceLine(id: string | null | undefined) {
  return id ? geographyReferenceLinesById.get(id as never) : undefined
}

export function getReferenceLineScenePoints(
  line: (typeof geographyReferenceLines)[number],
) {
  if (line.orientation === 'latitude') {
    return Array.from(
      { length: 181 },
      (_, index) => [line.coordinate, -180 + index * 2] as const,
    )
  }
  return Array.from(
    { length: 91 },
    (_, index) => [-89.5 + index * (179 / 90), line.coordinate] as const,
  )
}
