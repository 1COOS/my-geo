import type { LinearGeoFeature } from './linearGeoFeatureSchema'
import { linearGeoFeatures } from './linearGeoFeatures'
import type { Waterbody } from './waterbodySchema'
import { waterbodies } from './waterbodies'
import {
  waterLearningCatalogSchema,
  waterLearningLayerIdSchema,
  type WaterLearningLayerId,
  type WaterObjectGroup,
} from './waterLearningSchema'

const curriculumSourceId = 'moe-geography-curriculum-2022'
const naturalEarthSourceId = 'natural-earth-physical-v5'
const oceanSourceId = 'noaa-ocean-service'

const groups = [
  {
    id: 'ocean-oceans',
    layerId: 'ocean',
    name: '大洋',
    nameEn: 'Oceans',
    summary:
      '五大洋彼此连通，共同构成世界海洋的主体，适合比较全球海陆分布和洋际位置。',
    objectKind: 'waterbody',
    objectIds: waterbodies
      .filter(
        (waterbody) =>
          waterbody.layer === 'ocean' && waterbody.kind === 'ocean',
      )
      .map((waterbody) => waterbody.id),
  },
  {
    id: 'ocean-seas',
    layerId: 'ocean',
    name: '海',
    nameEn: 'Seas',
    summary:
      '海通常位于大洋边缘，并受到大陆、半岛和岛屿的包围程度及区域环境影响。',
    objectKind: 'waterbody',
    objectIds: waterbodies
      .filter(
        (waterbody) => waterbody.layer === 'ocean' && waterbody.kind === 'sea',
      )
      .map((waterbody) => waterbody.id),
  },
  {
    id: 'ocean-bays',
    layerId: 'ocean',
    name: '海湾',
    nameEn: 'Gulfs and Bays',
    summary:
      '海湾是海水向陆地凹入的水域，观察重点是开口方向、周围陆地和所连接的海洋。',
    objectKind: 'waterbody',
    objectIds: waterbodies
      .filter(
        (waterbody) =>
          waterbody.layer === 'ocean' &&
          (waterbody.kind === 'gulf' || waterbody.kind === 'bay'),
      )
      .map((waterbody) => waterbody.id),
  },
  {
    id: 'world-lakes',
    layerId: 'lake',
    name: '世界湖泊',
    nameEn: 'World Lakes',
    summary:
      '世界代表性湖泊分布在不同气候和地形区，可比较湖面面积、深度、补给和区域位置。',
    objectKind: 'waterbody',
    objectIds: waterbodies
      .filter((waterbody) => waterbody.layer === 'lake')
      .map((waterbody) => waterbody.id),
  },
  {
    id: 'waterway-straits',
    layerId: 'waterway',
    name: '海峡',
    nameEn: 'Straits',
    summary:
      '海峡连接两片较大水域并分隔两块陆地，地图判读应同时说明连接与分隔关系。',
    objectKind: 'waterbody',
    objectIds: waterbodies
      .filter((waterbody) => waterbody.kind === 'strait')
      .map((waterbody) => waterbody.id),
  },
  {
    id: 'waterway-trenches',
    layerId: 'waterway',
    name: '海沟',
    nameEn: 'Trenches',
    summary:
      '海沟是狭长而深的海底凹地，常分布在板块俯冲带附近并联系火山地震活动。',
    objectKind: 'waterbody',
    objectIds: waterbodies
      .filter((waterbody) => waterbody.kind === 'trench')
      .map((waterbody) => waterbody.id),
  },
  {
    id: 'river-rivers',
    layerId: 'river',
    name: '河流',
    nameEn: 'Rivers',
    summary:
      '主要河流连接源头、支流、流域和河口，可用于比较流向、长度与区域水文特征。',
    objectKind: 'linearFeature',
    objectIds: linearGeoFeatures
      .filter((feature) => feature.kind === 'river')
      .map((feature) => feature.id),
  },
  {
    id: 'river-canals',
    layerId: 'river',
    name: '运河',
    nameEn: 'Canals',
    summary:
      '运河是人工开挖或改造的水道，观察重点是起点、终点及其连接的天然水系和海域。',
    objectKind: 'linearFeature',
    objectIds: linearGeoFeatures
      .filter((feature) => feature.kind === 'canal')
      .map((feature) => feature.id),
  },
] as const

const catalog = waterLearningCatalogSchema.parse({
  sources: [
    {
      id: curriculumSourceId,
      name: '义务教育地理课程标准（2022年版）',
      publisher: '中华人民共和国教育部',
      url: 'http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
      accessedAt: '2026-08-27',
      usage: '确定义务教育阶段海洋、河湖、水系与海底地形的学习范围。',
    },
    {
      id: naturalEarthSourceId,
      name: 'Natural Earth Physical Vectors',
      publisher: 'Natural Earth',
      url: 'https://www.naturalearthdata.com/downloads/10m-physical-vectors/',
      accessedAt: '2026-08-27',
      usage: '复核主要水体、河流和湖泊的全球位置，并提供离线简化几何。',
    },
    {
      id: oceanSourceId,
      name: 'Ocean, Coasts and Estuaries reference articles',
      publisher: 'NOAA Ocean Service',
      url: 'https://oceanservice.noaa.gov/education/tutorial_currents/',
      accessedAt: '2026-08-27',
      usage: '复核大洋、海岸、海峡、海沟及海洋环境的基础表述。',
    },
  ],
  layers: [
    {
      id: 'ocean',
      name: '海洋',
      aliases: ['大洋', '海', '海湾', '海陆分布', '海底地形'],
      summary:
        '海洋图层对应3D地球上的大洋、海和海湾。它用于认识世界海陆分布、四大洋的位置，以及海、海湾与周围陆地的空间关系。',
      coreKnowledge: [
        '地球表面海洋面积远大于陆地，陆地主要集中在北半球，但任何半球都是海洋面积更大。',
        '大洋是彼此连通的广阔咸水水体；海通常位于大洋边缘，并受大陆、半岛或岛屿部分包围。',
        '海湾是海水深入陆地形成的水域，开口连接海或大洋，名称不代表固定面积等级。',
        '大陆架、大陆坡、洋盆和海岭共同构成主要海底地形，不同海域的深度和海底起伏差异显著。',
        '海水受风、密度差和天体引潮力影响产生波浪、洋流和潮汐，它们的形成机制并不相同。',
        '海洋储存并输送大量热量和水分，会调节沿海气温并影响天气、气候和自然景观。',
      ],
      readingRules: [
        '先在世界地图上确定大洲与大洋的相对位置，再判断海或海湾与周围陆地的关系。',
        '比较海陆面积时应观察整个半球，不能只根据熟悉大陆的面积作出判断。',
        '判读海湾时观察海岸线向陆地凹入的形态，以及开口所连接的海或大洋。',
        '海底地形判读应按从大陆向深海的顺序辨认大陆架、大陆坡、洋盆和海岭。',
      ],
      comparisons: [
        {
          title: '大洋、海与海湾',
          items: [
            '大洋规模最大、彼此连通，是全球海水的主体。',
            '海位于大洋边缘，通常受附近陆地和岛屿影响更明显。',
            '海湾向陆地凹入，开口连接海或大洋。',
          ],
        },
      ],
      commonMistakes: [
        '南半球被称为“水半球”，不代表那里没有大陆；北半球也仍然是海洋面积大于陆地。',
        '海水盐度并非处处相同，降水、蒸发、河流注入和结冰融冰都会造成区域差异。',
        '里海在3D海洋图层中与海域共同显示以便定位，但按自然地理分类属于内陆咸水湖。',
      ],
      sourceIds: [curriculumSourceId, naturalEarthSourceId, oceanSourceId],
    },
    {
      id: 'lake',
      name: '湖泊',
      aliases: ['淡水湖', '咸水湖', '内流湖', '外流湖', '湖盆'],
      summary:
        '湖泊图层包含3D地球上的20个代表性湖泊，并按所在大洲分类。通过湖泊的补给、排泄、盐度和湖盆成因，可以理解湖泊与气候、地形、河流之间的联系。',
      coreKnowledge: [
        '湖泊是被陆地环绕的相对静水水体，可通过河流、降水、冰雪融水和地下水获得补给。',
        '有河流把湖水带向海洋的湖泊通常属于外流湖；缺少外泄通道的湖泊属于内流湖。',
        '淡水湖和咸水湖的区别与盐度有关，不能只根据湖泊是否位于内陆判断。',
        '构造运动、冰川侵蚀、火山活动、河道变化、海岸封闭和人工筑坝都可能形成湖盆。',
        '湖泊面积、水位和盐度会随降水、蒸发、河流补给及地下水交换发生变化。',
        '湖泊能够储存水量、调节河流径流，并为水生和湖滨生物提供栖息环境。',
      ],
      readingRules: [
        '先根据地图确定湖泊所在大洲和地形区，再观察是否有河流流入或流出。',
        '判断内流湖或外流湖时重点寻找地表出水口，并结合区域气候和蒸发强弱。',
        '判读湖泊成因要结合湖盆形态和区域背景，例如断裂带、冰川地貌或河道遗迹。',
        '比较湖泊时区分面积、深度、蓄水量和盐度，面积最大的湖泊不一定最深。',
      ],
      comparisons: [
        {
          title: '内流湖与外流湖',
          items: [
            '外流湖有地表径流流出并最终联系海洋，通常更容易保持较低盐度。',
            '内流湖没有通向海洋的地表出口，在干旱区常因强蒸发而积累盐分。',
          ],
        },
        {
          title: '淡水湖与咸水湖',
          items: [
            '淡水湖盐度较低，常有较稳定的水量补给或外泄通道。',
            '咸水湖盐度较高，常见于蒸发强、排水不畅的内流区。',
          ],
        },
      ],
      commonMistakes: [
        '名称中有“海”字不一定属于海洋，里海和死海在自然地理分类中都是内陆湖泊。',
        '内流湖不一定都是咸水湖，盐度还受补给量、蒸发量、地下水交换和形成历史影响。',
        '五大湖是彼此连通的湖群，不是一座湖，也不能只用其中一座湖代表全部水文特征。',
      ],
      sourceIds: [curriculumSourceId, naturalEarthSourceId],
    },
    {
      id: 'waterway',
      name: '海峡·海沟',
      aliases: ['海峡', '海沟', '狭窄水道', '深海地形'],
      summary:
        '水域图层对应3D地球上的海峡和海沟。海峡强调两片水域与两块陆地的空间关系，海沟则用于认识深海地形和板块俯冲带。',
      coreKnowledge: [
        '海峡是连接两片较大水域、同时分隔两块陆地的天然狭长水道。',
        '海峡的宽度、深度、流向和水体交换会受到海岸形态、海底地形、潮汐和洋流影响。',
        '海沟是海底狭长而深的凹地，许多海沟分布在大洋边缘的板块俯冲带附近。',
        '海沟与岛弧、火山和地震带常具有空间联系，是观察板块运动的重要海底地形。',
        '海峡属于水体通道，海沟属于海底地形，两者名称相近但判读依据完全不同。',
      ],
      readingRules: [
        '判读海峡时同时指出它连接的两片水域和分隔的两块陆地。',
        '观察海峡位置时应先确定相邻大陆、半岛或岛屿，再追踪两侧水域。',
        '判读海沟时结合海底深度、板块边界、岛弧及火山地震带的位置。',
        '地图上的海沟线是位置和走向示意，不表示实际宽度。',
      ],
      comparisons: [
        {
          title: '海峡与运河',
          items: [
            '海峡是天然形成的水道，属于水域图层。',
            '运河是人工开挖或改造的水道，在3D地球上归入河流图层。',
          ],
        },
        {
          title: '海沟与洋中脊',
          items: [
            '海沟是深而狭长的海底凹地，常与板块俯冲有关。',
            '洋中脊是绵延的海底高地，常与板块张裂和新洋壳形成有关。',
          ],
        },
      ],
      commonMistakes: [
        '海峡必须同时体现连接水域和分隔陆地，不能只根据水道狭窄就下结论。',
        '海沟不是海底普遍下沉形成的裂缝，许多深海沟与板块俯冲过程密切相关。',
        '海峡和海沟不是同一类地理事物，前者是水道，后者是海底地形。',
      ],
      sourceIds: [curriculumSourceId, naturalEarthSourceId, oceanSourceId],
    },
    {
      id: 'river',
      name: '河流',
      aliases: ['水系', '流域', '分水岭', '内流河', '外流河', '运河'],
      summary:
        '河流图层包含30条重要河流和10条人工运河。河流用于认识源头、干支流、流域、分水岭、河口和水文特征；运河用于比较天然水系与人工水道。',
      coreKnowledge: [
        '河流通常由源头、上中下游、支流和河口组成，干流与各级支流共同构成水系。',
        '流域是河流及其支流汇集地表水和地下水的区域，相邻流域之间常由分水岭分隔。',
        '河流总体由地势较高处流向较低处，最终注入海洋、湖泊，或在内陆逐渐消失。',
        '外流河最终流入海洋；内流河常注入内陆湖或消失在沙漠、洼地。',
        '水量、汛期、枯水期、含沙量、结冰期和流速属于常用水文特征。',
        '河流上游侵蚀和搬运通常较强，中下游地势趋缓后沉积增多。',
        '运河由人工开挖或改造，可连接原本分隔的水系，但不具备天然河流完整的流域结构。',
      ],
      readingRules: [
        '在地形图上依据高低起伏判断河流流向，不要把地图的上方默认当作上游。',
        '观察支流汇入方向和干流去向，可辅助判断水系形态、流向与流域范围。',
        '分析汛期先找主要补给来源：雨水补给联系雨季，冰雪融水补给联系气温变化。',
        '比较河流时使用相同指标，分别说明流量、季节变化、结冰期、含沙量和流速。',
        '运河判读应关注起点、终点和连接水域，不能套用天然河流的源头与河口概念。',
      ],
      comparisons: [
        {
          title: '内流河与外流河',
          items: [
            '外流河通过河口进入海洋，流域属于外流区。',
            '内流河终止于内陆湖、洼地或沙漠，下游水量常因蒸发和渗漏减少。',
          ],
        },
        {
          title: '河流与运河',
          items: [
            '河流由自然汇水和地形过程形成，具有流域、源头、支流和河口。',
            '运河由人工开挖或改造，主要用于连接水系或缩短水路。',
          ],
        },
      ],
      commonMistakes: [
        '河流越长不一定流量越大，流量还受流域面积、降水、蒸发和补给方式影响。',
        '汛期不一定都在夏季，不同气候和补给方式会形成不同的季节变化。',
        '流域边界不是河道本身，分水岭通常位于相邻水系之间的山地或高地。',
        '河口三角洲并非每条大河都有，海浪、潮流、泥沙量和海岸地形都会影响沉积。',
      ],
      sourceIds: [curriculumSourceId, naturalEarthSourceId],
    },
  ],
  groups,
})

const waterbodyById = new Map(
  waterbodies.map((waterbody) => [waterbody.id, waterbody]),
)
const linearFeatureById = new Map(
  linearGeoFeatures.map((feature) => [feature.id, feature]),
)
const objectMembership = new Map<string, string>()

for (const group of catalog.groups) {
  for (const objectId of group.objectIds) {
    const exists =
      group.objectKind === 'waterbody'
        ? waterbodyById.has(objectId)
        : linearFeatureById.has(objectId)
    if (!exists) {
      throw new Error(`Unknown ${group.objectKind} ${objectId} on ${group.id}`)
    }
    const previousGroup = objectMembership.get(objectId)
    if (previousGroup) {
      throw new Error(
        `Water learning object ${objectId} is duplicated in ${previousGroup} and ${group.id}`,
      )
    }
    objectMembership.set(objectId, group.id)
  }
}

for (const waterbody of waterbodies) {
  if (!objectMembership.has(waterbody.id)) {
    throw new Error(
      `Waterbody missing from water learning groups: ${waterbody.id}`,
    )
  }
}
for (const feature of linearGeoFeatures) {
  if (!objectMembership.has(feature.id)) {
    throw new Error(
      `Linear feature missing from water learning groups: ${feature.id}`,
    )
  }
}

const layerById = new Map(catalog.layers.map((layer) => [layer.id, layer]))
const groupById = new Map(catalog.groups.map((group) => [group.id, group]))
const legacyGroupIds: Record<string, string> = {
  'lake-asia': 'world-lakes',
  'lake-europe': 'world-lakes',
  'lake-africa': 'world-lakes',
  'lake-north-america': 'world-lakes',
  'lake-south-america': 'world-lakes',
  'lake-oceania': 'world-lakes',
}
const legacyTopicLayers: Record<string, WaterLearningLayerId> = {
  'ocean-and-land': 'ocean',
  'lakes-and-wetlands': 'lake',
  'rivers-and-basins': 'river',
  'water-cycle': 'ocean',
}

export type WaterLearningObject =
  | { kind: 'waterbody'; value: Waterbody }
  | { kind: 'linearFeature'; value: LinearGeoFeature }

export const waterLearningLayers = catalog.layers
export const waterLearningSources = catalog.sources
export const waterLearningObjectGroups = catalog.groups
export const waterLearningObjectCount = objectMembership.size

export function getWaterLearningLayer(id: string | null | undefined) {
  const parsed = waterLearningLayerIdSchema.safeParse(id)
  return parsed.success ? layerById.get(parsed.data) : undefined
}

export function resolveWaterLearningLayerId(
  id: string | null | undefined,
  legacyTopicId?: string | null,
): WaterLearningLayerId {
  return (
    getWaterLearningLayer(id)?.id ??
    (legacyTopicId ? legacyTopicLayers[legacyTopicId] : undefined) ??
    'ocean'
  )
}

export function getWaterObjectLayerId(
  waterbodyId?: string,
  linearFeatureId?: string,
): WaterLearningLayerId | null {
  if (waterbodyId) {
    const waterbody = waterbodyById.get(waterbodyId)
    return waterbody?.layer ?? null
  }
  return linearFeatureId && linearFeatureById.has(linearFeatureId)
    ? 'river'
    : null
}

export function getWaterLayerWaterbodies(layerId: WaterLearningLayerId) {
  return layerId === 'river'
    ? []
    : waterbodies.filter((waterbody) => waterbody.layer === layerId)
}

export function getWaterLayerLinearFeatures(layerId: WaterLearningLayerId) {
  return layerId === 'river' ? linearGeoFeatures : []
}

export function getWaterObjectGroups(layerId: WaterLearningLayerId) {
  return waterLearningObjectGroups.filter((group) => group.layerId === layerId)
}

export function getWaterObjectGroup(groupId: string | null | undefined) {
  if (!groupId) return undefined
  return groupById.get(legacyGroupIds[groupId] ?? groupId)
}

export function resolveWaterObjectGroup(
  layerId: WaterLearningLayerId,
  groupId: string | null | undefined,
) {
  const group = getWaterObjectGroup(groupId)
  return group?.layerId === layerId ? group : getWaterObjectGroups(layerId)[0]
}

export function getWaterObjectGroupForObject(
  waterbodyId?: string,
  linearFeatureId?: string,
) {
  const objectId = waterbodyId ?? linearFeatureId
  const groupId = objectId ? objectMembership.get(objectId) : undefined
  return getWaterObjectGroup(groupId)
}

export function getWaterObjectsForGroup(
  group: Pick<WaterObjectGroup, 'objectKind' | 'objectIds'>,
): WaterLearningObject[] {
  const objects: WaterLearningObject[] = []
  for (const objectId of group.objectIds) {
    if (group.objectKind === 'waterbody') {
      const waterbody = waterbodyById.get(objectId)
      if (waterbody) objects.push({ kind: 'waterbody', value: waterbody })
      continue
    }
    const feature = linearFeatureById.get(objectId)
    if (feature) objects.push({ kind: 'linearFeature', value: feature })
  }
  return objects
}
