import { countriesByCode, countrySourcesById } from './countries'
import { desertsById } from './deserts'
import { linearGeoFeaturesById } from './linearGeoFeatures'
import { getMountainRange } from './mountainRanges'
import { waterbodiesById } from './waterbodies'
import {
  worldExtremeCatalogSchema,
  type WorldExtremeCategoryId,
  type WorldExtremeEntry,
  type WorldExtremeMetricId,
} from './worldExtremesSchema'

type EntryDetails = Omit<WorldExtremeEntry, 'name' | 'position' | 'entity'>

function countryEntry(countryCode: string, details: EntryDetails) {
  const country = countriesByCode.get(countryCode)
  if (!country) throw new Error(`Unknown world-extreme country ${countryCode}`)
  return {
    ...details,
    name: country.name,
    position: country.center,
    entity: { kind: 'country' as const, id: country.code },
  }
}

function mountainRangeEntry(rangeId: string, details: EntryDetails) {
  const range = getMountainRange(rangeId)
  if (!range) throw new Error(`Unknown world-extreme range ${rangeId}`)
  return {
    ...details,
    name: range.name,
    position: range.cameraPosition,
    entity: { kind: 'mountainRange' as const, id: range.id },
  }
}

function desertEntry(desertId: string, details: EntryDetails) {
  const desert = desertsById.get(desertId)
  if (!desert) throw new Error(`Unknown world-extreme desert ${desertId}`)
  return {
    ...details,
    name: desert.name,
    position: desert.center,
    entity: { kind: 'desert' as const, id: desert.id },
  }
}

function waterbodyEntry(waterbodyId: string, details: EntryDetails) {
  const waterbody = waterbodiesById.get(waterbodyId)
  if (!waterbody) {
    throw new Error(`Unknown world-extreme waterbody ${waterbodyId}`)
  }
  return {
    ...details,
    name: waterbody.name,
    position: waterbody.center,
    entity: { kind: 'waterbody' as const, id: waterbody.id },
  }
}

function linearFeatureEntry(featureId: string, details: EntryDetails) {
  const feature = linearGeoFeaturesById.get(featureId)
  if (!feature) {
    throw new Error(`Unknown world-extreme linear feature ${featureId}`)
  }
  return {
    ...details,
    name: feature.name,
    position: feature.cameraPosition,
    entity: { kind: 'linearFeature' as const, id: feature.id },
  }
}

const definition = {
  categories: [
    {
      id: 'country-scale',
      name: '国家尺度',
      note: '面积与人口的两端',
      accent: '#f2c75c',
    },
    {
      id: 'mountains-deserts',
      name: '高山荒漠',
      note: '高度、长度与干旱尺度',
      accent: '#ff9f68',
    },
    {
      id: 'rivers-lakes',
      name: '江河湖泊',
      note: '流动水系与内陆水体',
      accent: '#53e6bd',
    },
    {
      id: 'oceans-depths',
      name: '海洋深处',
      note: '大洋范围与海底深渊',
      accent: '#7ccfff',
    },
  ],
  metrics: [
    {
      id: 'largest-country-area',
      categoryId: 'country-scale',
      name: '面积最大的国家',
      note: '按国家总面积比较',
      unit: 'square-kilometers',
      direction: 'descending',
      measurement: '使用国家总面积比较，包含陆地和资料口径所计入的内陆水域。',
      scopeNote:
        '不同数据集对沿岸水域和争议地区的处理略有差异，本榜与国家知识目录采用同一口径。',
      dispute:
        '中国与美国的总面积排名会因水域计算方法不同而互换，本榜按当前仓库数据列中国第三。',
      entries: [
        countryEntry('RU', {
          id: 'russia',
          rank: 1,
          value: 17_098_242,
          approximate: false,
          summary:
            '俄罗斯横跨欧洲东部和亚洲北部，东西跨度巨大，是世界总面积最大的国家。',
          facts: [
            '俄罗斯跨越十一个时区，并拥有漫长的北冰洋和太平洋海岸线。',
            '其面积接近世界陆地面积的九分之一，内部自然带差异十分显著。',
          ],
          sourceIds: ['world-countries'],
        }),
        countryEntry('CA', {
          id: 'canada',
          rank: 2,
          value: 9_984_670,
          approximate: false,
          summary:
            '加拿大覆盖北美洲北部，拥有大量湖泊、森林和北极群岛，面积位居世界第二。',
          facts: [
            '加拿大拥有世界最长的海岸线，海岸同时面向太平洋、大西洋和北冰洋。',
            '广阔的加拿大地盾分布着数量众多的冰川湖和古老岩石。',
          ],
          sourceIds: ['world-countries'],
        }),
        countryEntry('CN', {
          id: 'china',
          rank: 3,
          value: 9_706_961,
          approximate: false,
          summary: '中国位于亚洲东部，地形从青藏高原向东部平原和近海逐级降低。',
          facts: [
            '中国国土横跨热带、亚热带和温带，形成多样的气候与生态系统。',
            '按当前国家目录的总面积口径，中国列在俄罗斯和加拿大之后。',
          ],
          sourceIds: ['world-countries'],
        }),
      ],
    },
    {
      id: 'smallest-country-area',
      categoryId: 'country-scale',
      name: '面积最小的国家',
      note: '从微型国家理解尺度',
      unit: 'square-kilometers',
      direction: 'ascending',
      measurement:
        '比较主权国家的总面积，数值较小者排名更靠前，不把属地或非主权地区单列。',
      scopeNote:
        '微型国家面积常经过取整，本榜保留国家目录使用的小数精度，地图以圆点补足不可见边界。',
      entries: [
        countryEntry('VA', {
          id: 'vatican-city',
          rank: 1,
          value: 0.44,
          approximate: false,
          summary: '梵蒂冈位于意大利首都罗马城内，是世界面积最小的主权国家。',
          facts: [
            '梵蒂冈的范围小于一平方千米，步行即可穿过其主要区域。',
            '它虽然面积极小，却拥有独立的国家制度和国际外交关系。',
          ],
          sourceIds: ['world-countries'],
        }),
        countryEntry('MC', {
          id: 'monaco',
          rank: 2,
          value: 2.02,
          approximate: false,
          summary: '摩纳哥位于地中海沿岸，被法国包围，是世界第二小的主权国家。',
          facts: [
            '摩纳哥沿海岸狭长分布，城市建设密度非常高。',
            '填海工程会使其实际陆地面积随时间出现细微变化。',
          ],
          sourceIds: ['world-countries'],
        }),
        countryEntry('NR', {
          id: 'nauru',
          rank: 3,
          value: 21,
          approximate: false,
          summary: '瑙鲁是位于太平洋中部的单岛国家，也是面积最小的岛国。',
          facts: [
            '瑙鲁没有传统意义上的正式首都，政府机构主要位于亚伦区。',
            '岛屿内部曾因磷酸盐开采而发生显著的地表变化。',
          ],
          sourceIds: ['world-countries'],
        }),
      ],
    },
    {
      id: 'most-populous-country',
      categoryId: 'country-scale',
      name: '人口最多的国家',
      note: '采用最新可用年度人口',
      unit: 'people',
      direction: 'descending',
      measurement:
        '使用世界银行人口总数指标的最新可用年度值，比较一国通常居住人口总量。',
      scopeNote:
        '人口会持续变化，榜单必须同时显示统计年份，不能把不同年份的数据当作同一时点。',
      entries: [
        countryEntry('IN', {
          id: 'india',
          rank: 1,
          value: 1_463_865_525,
          approximate: false,
          year: 2025,
          summary:
            '印度人口超过十四亿，人口分布集中于恒河平原、沿海地区和大型城市带。',
          facts: [
            '印度人口结构较年轻，不同邦之间的人口密度和城市化程度差异明显。',
            '人口总量是动态指标，阅读排名时必须同时查看统计年份。',
          ],
          sourceIds: ['world-bank-population'],
        }),
        countryEntry('CN', {
          id: 'china',
          rank: 2,
          value: 1_406_585_000,
          approximate: false,
          year: 2025,
          summary:
            '中国人口主要集中在东部季风区，黑河—腾冲线两侧人口密度差异显著。',
          facts: [
            '东部平原、盆地和沿海城市群承载了中国大部分人口。',
            '人口规模与年龄结构都在变化，因此排名不是永久不变的事实。',
          ],
          sourceIds: ['world-bank-population'],
        }),
        countryEntry('US', {
          id: 'united-states',
          rank: 3,
          value: 341_784_857,
          approximate: false,
          year: 2025,
          summary:
            '美国人口超过三亿，主要城市带分布于东西海岸、五大湖和南部地区。',
          facts: [
            '美国人口空间分布并不均匀，阿拉斯加等地区人口密度很低。',
            '移民和国内迁移长期影响各州与城市群的人口变化。',
          ],
          sourceIds: ['world-bank-population'],
        }),
      ],
    },
    {
      id: 'least-populous-country',
      categoryId: 'country-scale',
      name: '人口最少的国家',
      note: '只比较主权国家',
      unit: 'people',
      direction: 'ascending',
      measurement:
        '比较主权国家最新可用人口总数，人口较少者排名更靠前，不把无人属地列入。',
      scopeNote:
        '梵蒂冈采用其政府公布的2024年人口，其余国家使用世界银行2025年最新可用值。',
      entries: [
        countryEntry('VA', {
          id: 'vatican-city',
          rank: 1,
          value: 882,
          approximate: false,
          year: 2024,
          summary: '梵蒂冈常住人口不足一千，是世界人口最少的主权国家。',
          facts: [
            '梵蒂冈人口规模很小，且包含承担宗教与国家职务的居民。',
            '它的统计来源不同于世界银行，因此榜单明确标出独立年份。',
          ],
          sourceIds: ['vatican-population'],
        }),
        countryEntry('TV', {
          id: 'tuvalu',
          rank: 2,
          value: 9_492,
          approximate: false,
          year: 2025,
          summary: '图瓦卢由太平洋上的低平珊瑚岛组成，人口不到一万人。',
          facts: [
            '图瓦卢国土分散在多个环礁和岛屿上，陆地面积也非常有限。',
            '海平面变化与风暴潮是当地长期面对的重要地理风险。',
          ],
          sourceIds: ['world-bank-population'],
        }),
        countryEntry('NR', {
          id: 'nauru',
          rank: 3,
          value: 12_025,
          approximate: false,
          year: 2025,
          summary: '瑙鲁人口约一万二千，是人口最少的国家之一。',
          facts: [
            '居民主要分布在环岛海岸地带，岛内交通距离较短。',
            '人口数字较小，迁移变化会对年度总量产生明显影响。',
          ],
          sourceIds: ['world-bank-population'],
        }),
      ],
    },
    {
      id: 'highest-peak',
      categoryId: 'mountains-deserts',
      name: '海拔最高的山峰',
      note: '以平均海平面为零点',
      unit: 'meters',
      direction: 'descending',
      measurement:
        '比较山峰顶点相对平均海平面的海拔高度，而不是从山脚到峰顶的相对高度。',
      scopeNote:
        '海拔与相对高度是两个不同问题，本榜采用国际地理教材常用的海拔口径。',
      dispute:
        '珠穆朗玛峰8848.86米来自中尼联合公布值，页面按显示精度取整为8849米。',
      entries: [
        {
          id: 'mount-everest',
          rank: 1,
          name: { zh: '珠穆朗玛峰', en: 'Mount Everest' },
          value: 8_849,
          approximate: true,
          position: { latitude: 27.9881, longitude: 86.925 },
          entity: { kind: 'mountainRange', id: 'himalayas' },
          summary:
            '珠穆朗玛峰位于中国与尼泊尔边界，是以平均海平面为基准的世界最高峰。',
          facts: [
            '它属于仍在抬升的喜马拉雅山脉，形成于印度板块与欧亚板块碰撞。',
            '峰顶海拔测量需要结合卫星定位、重力场和雪面厚度等信息。',
          ],
          sourceIds: ['mountain-peak-review', 'britannica-mountains'],
        },
        {
          id: 'k2',
          rank: 2,
          name: { zh: '乔戈里峰', en: 'K2' },
          value: 8_611,
          approximate: false,
          position: { latitude: 35.8808, longitude: 76.5158 },
          entity: { kind: 'mountainRange', id: 'karakoram' },
          summary: '乔戈里峰位于喀喇昆仑山脉，是世界第二高峰。',
          facts: [
            'K2的名称来自早期测绘编号，山体位于中国与巴基斯坦边界附近。',
            '陡峭地形和复杂天气使其攀登难度远高于单纯的海拔数字。',
          ],
          sourceIds: ['mountain-peak-review', 'britannica-mountains'],
        },
        {
          id: 'kangchenjunga',
          rank: 3,
          name: { zh: '干城章嘉峰', en: 'Kangchenjunga' },
          value: 8_586,
          approximate: false,
          position: { latitude: 27.7025, longitude: 88.1475 },
          entity: { kind: 'mountainRange', id: 'himalayas' },
          summary: '干城章嘉峰位于尼泊尔与印度边界，是世界第三高峰。',
          facts: [
            '它由多个高峰组成，名称常被解释为与五座雪峰宝藏有关。',
            '其位置在喜马拉雅山脉东段，季风带来的降雪影响十分明显。',
          ],
          sourceIds: ['mountain-peak-review', 'britannica-mountains'],
        },
      ],
    },
    {
      id: 'longest-continental-mountain-range',
      categoryId: 'mountains-deserts',
      name: '最长的大陆山系',
      note: '比较连续山系的近似长度',
      unit: 'kilometers',
      direction: 'descending',
      measurement:
        '沿山系主要延伸方向比较近似长度，使用陆地上的连续山地系统作为对象。',
      scopeNote:
        '山系边界没有单一精确线，长度会随定义变化，因此三个数值均作为教学近似值。',
      entries: [
        mountainRangeEntry('andes', {
          id: 'andes',
          rank: 1,
          value: 7_000,
          approximate: true,
          summary: '安第斯山脉沿南美洲西缘延伸，是世界最长的大陆山系。',
          facts: [
            '安第斯跨越多个纬度带，从热带高原一直延伸到寒冷的南端。',
            '纳斯卡板块向南美洲板块之下俯冲，是山系形成的重要动力。',
          ],
          sourceIds: ['britannica-mountains', 'mountain-peak-review'],
        }),
        mountainRangeEntry('rocky-mountains', {
          id: 'rocky-mountains',
          rank: 2,
          value: 4_800,
          approximate: true,
          summary: '落基山脉纵贯北美洲西部，是北美科迪勒拉山系的重要组成部分。',
          facts: [
            '山脉从加拿大西部向美国西南部延伸，构成重要大陆分水岭。',
            '不同资料对其南北端位置定义不同，因此长度通常写作约数。',
          ],
          sourceIds: ['britannica-mountains', 'mountain-peak-review'],
        }),
        mountainRangeEntry('great-dividing-range', {
          id: 'great-dividing-range',
          rank: 3,
          value: 3_700,
          approximate: true,
          summary: '大分水岭沿澳大利亚东部延伸，是澳大利亚最长的山地系统。',
          facts: [
            '它影响东部沿海与内陆河流的流向，也影响降水空间分布。',
            '大分水岭并非处处都是陡峭高山，还包括高原和丘陵。',
          ],
          sourceIds: ['britannica-mountains', 'geoscience-australia-mountains'],
        }),
      ],
    },
    {
      id: 'largest-hot-desert',
      categoryId: 'mountains-deserts',
      name: '面积最大的热沙漠',
      note: '明确排除极地荒漠',
      unit: 'square-kilometers',
      direction: 'descending',
      measurement:
        '比较低纬和副热带干旱区的近似面积，把连续的热沙漠地理区域作为对象。',
      scopeNote:
        '南极洲是面积更大的荒漠，但属于寒冷的极地荒漠，所以本指标明确限定为热沙漠。',
      entries: [
        desertEntry('sahara', {
          id: 'sahara',
          rank: 1,
          value: 9_200_000,
          approximate: true,
          summary: '撒哈拉覆盖北非大部，是世界面积最大的热沙漠。',
          facts: [
            '撒哈拉不仅有沙丘，还包括广阔的砾漠、岩漠、山地和盐沼。',
            '副热带高压和大陆内部位置共同维持了这里极端干旱的气候。',
          ],
          sourceIds: ['britannica-deserts'],
        }),
        {
          id: 'arabian-desert',
          rank: 2,
          name: { zh: '阿拉伯沙漠', en: 'Arabian Desert' },
          value: 2_330_000,
          approximate: true,
          position: { latitude: 23.5, longitude: 47.5 },
          summary: '阿拉伯沙漠覆盖阿拉伯半岛大部，是世界第二大的热沙漠区域。',
          facts: [
            '其内部包含鲁卜哈利等巨大沙海，也分布着砾石平原和熔岩台地。',
            '高温、少雨和有限的地表水塑造了稀疏的人口分布。',
          ],
          sourceIds: ['britannica-deserts'],
        },
        desertEntry('kalahari', {
          id: 'kalahari',
          rank: 3,
          value: 900_000,
          approximate: true,
          summary: '卡拉哈里位于南部非洲内陆，是范围广阔的半干旱沙质区域。',
          facts: [
            '卡拉哈里部分地区能够生长草木，因此不是处处裸露的沙海。',
            '奥卡万戈河在北部形成内陆三角洲，为干旱区带来大面积湿地。',
          ],
          sourceIds: ['britannica-deserts'],
        }),
      ],
    },
    {
      id: 'longest-river',
      categoryId: 'rivers-lakes',
      name: '最长的河流',
      note: '源头选择会改变答案',
      unit: 'kilometers',
      direction: 'descending',
      measurement:
        '从选定的最远源头沿主河道量到河口，比较完整河流系统的近似长度。',
      scopeNote:
        '河源、支流和河口位置的选择会改变测量结果，本榜采用现有河流知识目录的教学口径。',
      dispute:
        '尼罗河与亚马孙河谁更长仍有不同研究结论；本榜采用尼罗河6650千米、亚马孙河6400千米的常见教材值。',
      entries: [
        linearFeatureEntry('nile-system', {
          id: 'nile-river',
          rank: 1,
          value: 6_650,
          approximate: true,
          summary:
            '尼罗河向北流经非洲东北部，在采用常见教材源头口径时位居第一。',
          facts: [
            '白尼罗河与青尼罗河汇合后继续向北，最终注入地中海。',
            '古埃及农业和城市长期依赖尼罗河周期性水量与河谷耕地。',
          ],
          sourceIds: ['britannica-rivers'],
        }),
        linearFeatureEntry('amazon-system', {
          id: 'amazon-river',
          rank: 2,
          value: 6_400,
          approximate: true,
          summary:
            '亚马孙河横贯南美洲北部，长度接近尼罗河且拥有世界最大的流量。',
          facts: [
            '不同研究选择不同安第斯源流，使亚马孙河长度估算存在较大差异。',
            '它汇集巨大热带雨林流域的水量，河口淡水影响大西洋大片海域。',
          ],
          sourceIds: ['britannica-rivers', 'peru-ana-rivers'],
        }),
        linearFeatureEntry('yangtze-system', {
          id: 'yangtze-river',
          rank: 3,
          value: 6_300,
          approximate: true,
          summary: '长江从青藏高原流向东海，是亚洲最长、世界第三长的河流。',
          facts: [
            '长江流域跨越中国地势三级阶梯，沿途地形和气候变化显著。',
            '它连接中国西部、中部和东部多个人口密集的经济区域。',
          ],
          sourceIds: ['britannica-rivers', 'china-river-source-review'],
        }),
      ],
    },
    {
      id: 'largest-freshwater-lake-area',
      categoryId: 'rivers-lakes',
      name: '面积最大的淡水湖',
      note: '按湖面面积比较',
      unit: 'square-kilometers',
      direction: 'descending',
      measurement:
        '比较淡水湖的湖面面积，不按蓄水量或最大深度排序，也不把咸水里海列入。',
      scopeNote:
        '湖面面积会随水位变化，本榜采用知识目录中的近似代表值，强调数量级而非实时水位。',
      entries: [
        waterbodyEntry('lake-superior', {
          id: 'lake-superior',
          rank: 1,
          value: 82_100,
          approximate: true,
          summary:
            '苏必利尔湖位于美国和加拿大之间，是按表面积计算最大的淡水湖。',
          facts: [
            '它属于北美五大湖，湖水经其他五大湖和圣劳伦斯河流向大西洋。',
            '苏必利尔湖很深，但按蓄水量仍小于贝加尔湖。',
          ],
          sourceIds: ['britannica-lake'],
        }),
        waterbodyEntry('lake-victoria', {
          id: 'lake-victoria',
          rank: 2,
          value: 68_800,
          approximate: true,
          summary: '维多利亚湖位于东非高原，是非洲面积最大的湖泊。',
          facts: [
            '湖岸分属乌干达、肯尼亚和坦桑尼亚，白尼罗河从湖区向北流出。',
            '其面积很大但平均深度较浅，与贝加尔湖的深窄形态形成对比。',
          ],
          sourceIds: ['britannica-lake'],
        }),
        waterbodyEntry('lake-huron', {
          id: 'lake-huron',
          rank: 3,
          value: 59_600,
          approximate: true,
          summary: '休伦湖位于美国和加拿大之间，是北美五大湖中的第二大湖。',
          facts: [
            '休伦湖拥有复杂湖岸和数量众多的岛屿，地理形态并不规则。',
            '它与密歇根湖水位相连，但通常在地理名称和面积统计中分开计算。',
          ],
          sourceIds: ['britannica-lake'],
        }),
      ],
    },
    {
      id: 'deepest-lake',
      categoryId: 'rivers-lakes',
      name: '最深的湖泊',
      note: '比较湖盆最大水深',
      unit: 'meters',
      direction: 'descending',
      measurement:
        '比较湖面到湖盆最深点的最大垂直水深，不按湖底相对海平面的高度排序。',
      scopeNote:
        '里海地理上是封闭内陆水体，虽名称带“海”，本指标按湖泊学口径将其列入。',
      entries: [
        waterbodyEntry('lake-baikal', {
          id: 'lake-baikal',
          rank: 1,
          value: 1_642,
          approximate: false,
          summary: '贝加尔湖位于俄罗斯西伯利亚南部，是世界最深的湖泊。',
          facts: [
            '贝加尔湖形成于活动裂谷带，狭长而深的湖盆仍在缓慢演化。',
            '它储存了极其巨大的淡水量，远超仅凭湖面面积得到的直觉。',
          ],
          sourceIds: ['britannica-lake'],
        }),
        waterbodyEntry('lake-tanganyika', {
          id: 'lake-tanganyika',
          rank: 2,
          value: 1_470,
          approximate: false,
          summary: '坦噶尼喀湖位于东非大裂谷，是世界第二深的湖泊。',
          facts: [
            '它沿裂谷呈狭长形态，湖岸分属多个东非国家。',
            '深层湖水与表层交换较弱，形成独特的水体分层环境。',
          ],
          sourceIds: ['britannica-lake'],
        }),
        waterbodyEntry('caspian-sea', {
          id: 'caspian-sea',
          rank: 3,
          value: 1_025,
          approximate: false,
          summary: '里海是世界最大的封闭内陆水体，其最深处位于南部湖盆。',
          facts: [
            '里海没有通向世界大洋的天然出口，水体含盐度具有明显区域差异。',
            '名称中的“海”来自巨大尺度，但湖泊学通常把它视为封闭湖泊。',
          ],
          sourceIds: ['britannica-lake'],
        }),
      ],
    },
    {
      id: 'largest-ocean-area',
      categoryId: 'oceans-depths',
      name: '面积最大的大洋',
      note: '按国际通用海域范围比较',
      unit: 'square-kilometers',
      direction: 'descending',
      measurement:
        '按大洋及其边缘海的常见地理范围比较近似水域面积，使用国际通行的大洋划分。',
      scopeNote:
        '大洋边界是人为约定的地理分区，面积会随是否计入边缘海而出现不同版本。',
      dispute:
        '本榜采用NOAA教育资料常见的面积数量级，重点是比较尺度，不用于法律海域划界。',
      entries: [
        waterbodyEntry('pacific-ocean', {
          id: 'pacific-ocean',
          rank: 1,
          value: 165_250_000,
          approximate: true,
          summary:
            '太平洋位于亚洲、大洋洲与美洲之间，是面积最大、平均深度也最大的洋。',
          facts: [
            '太平洋面积大于地球全部陆地面积之和，跨越多个气候带。',
            '其边缘环绕着活跃板块边界，形成著名的环太平洋火山地震带。',
          ],
          sourceIds: ['noaa-ocean', 'iho-oceans-seas'],
        }),
        waterbodyEntry('atlantic-ocean', {
          id: 'atlantic-ocean',
          rank: 2,
          value: 106_460_000,
          approximate: true,
          summary: '大西洋位于美洲与欧洲、非洲之间，面积位居世界第二。',
          facts: [
            '大西洋中部海岭贯穿洋底，是板块向两侧扩张的重要边界。',
            '其南北向形态使海洋环流在全球热量输送中发挥关键作用。',
          ],
          sourceIds: ['noaa-ocean', 'iho-oceans-seas'],
        }),
        waterbodyEntry('indian-ocean', {
          id: 'indian-ocean',
          rank: 3,
          value: 70_560_000,
          approximate: true,
          summary: '印度洋被非洲、亚洲、大洋洲和南大洋包围，面积位居世界第三。',
          facts: [
            '北印度洋表层环流受季风影响，会随季节发生明显改变。',
            '印度洋连接东非、南亚与东南亚，长期承担重要海上交通。',
          ],
          sourceIds: ['noaa-ocean', 'iho-oceans-seas'],
        }),
      ],
    },
    {
      id: 'deepest-ocean-trench',
      categoryId: 'oceans-depths',
      name: '最深的海沟',
      note: '比较海沟最深测点',
      unit: 'meters',
      direction: 'descending',
      measurement:
        '比较各海沟中已测得最深点相对海平面的垂直深度，数值使用近似代表值。',
      scopeNote:
        '深海测量会受声速模型、测线位置和设备精度影响，同一深渊可能出现数十米差异。',
      dispute:
        '最深点数字会随着新测量更新，本榜以GEBCO命名和NOAA教育资料的近似深度为教学口径。',
      entries: [
        waterbodyEntry('mariana-trench', {
          id: 'mariana-trench',
          rank: 1,
          value: 10_935,
          approximate: true,
          summary: '马里亚纳海沟位于西太平洋，其挑战者深渊是已知海洋最深处。',
          facts: [
            '海沟形成于太平洋板块向菲律宾海板块之下俯冲的边界。',
            '即使在万米深处，探测仍发现适应高压环境的生物与沉积物。',
          ],
          sourceIds: ['gebco-gazetteer', 'noaa-ocean'],
        }),
        waterbodyEntry('tonga-trench', {
          id: 'tonga-trench',
          rank: 2,
          value: 10_823,
          approximate: true,
          summary: '汤加海沟位于南太平洋，其地平线深渊是全球最深地点之一。',
          facts: [
            '这里的板块汇聚速度很快，海沟与汤加火山弧平行分布。',
            '不同测次对最深点数值存在小幅差异，因此页面明确标记为约数。',
          ],
          sourceIds: ['gebco-gazetteer', 'noaa-ocean'],
        }),
        {
          id: 'philippine-trench',
          rank: 3,
          name: { zh: '菲律宾海沟', en: 'Philippine Trench' },
          value: 10_540,
          approximate: true,
          position: { latitude: 10.5, longitude: 127.5 },
          summary: '菲律宾海沟位于菲律宾群岛以东，是西太平洋最深的海沟之一。',
          facts: [
            '海沟沿菲律宾东侧延伸，与区域板块俯冲和岛弧活动密切相关。',
            '它没有独立探索图层时仍可按坐标在3D地球上定位。',
          ],
          sourceIds: ['gebco-gazetteer', 'noaa-ocean'],
        },
      ],
    },
  ],
} as const

const referencedCatalogSchema = worldExtremeCatalogSchema.superRefine(
  (catalog, context) => {
    for (const metric of catalog.metrics) {
      for (const entry of metric.entries) {
        for (const sourceId of entry.sourceIds) {
          if (!countrySourcesById.has(sourceId)) {
            context.addIssue({
              code: 'custom',
              message: `Unknown source ${sourceId} on ${metric.id}/${entry.id}`,
            })
          }
        }

        const entity = entry.entity
        const entityExists =
          !entity ||
          (entity.kind === 'country' && countriesByCode.has(entity.id)) ||
          (entity.kind === 'waterbody' && waterbodiesById.has(entity.id)) ||
          (entity.kind === 'linearFeature' &&
            linearGeoFeaturesById.has(entity.id)) ||
          (entity.kind === 'mountainRange' &&
            Boolean(getMountainRange(entity.id))) ||
          (entity.kind === 'desert' && desertsById.has(entity.id))
        if (!entityExists) {
          context.addIssue({
            code: 'custom',
            message: `Unknown entity on ${metric.id}/${entry.id}`,
          })
        }

        if (
          metric.id === 'most-populous-country' ||
          metric.id === 'least-populous-country'
        ) {
          if (!entry.year) {
            context.addIssue({
              code: 'custom',
              message: `Population year required on ${metric.id}/${entry.id}`,
            })
          }
        }

        if (entity?.kind === 'country') {
          const country = countriesByCode.get(entity.id)!
          if (
            (metric.id === 'largest-country-area' ||
              metric.id === 'smallest-country-area') &&
            entry.value !== country.areaSquareKilometers
          ) {
            context.addIssue({
              code: 'custom',
              message: `Country area mismatch on ${metric.id}/${entry.id}`,
            })
          }
          if (
            (metric.id === 'most-populous-country' ||
              metric.id === 'least-populous-country') &&
            (entry.value !== country.population ||
              entry.year !== country.populationYear)
          ) {
            context.addIssue({
              code: 'custom',
              message: `Country population mismatch on ${metric.id}/${entry.id}`,
            })
          }
        }
      }
    }
  },
)

export const worldExtremeCatalog = referencedCatalogSchema.parse(definition)
export const worldExtremeCategories = worldExtremeCatalog.categories
export const worldExtremeMetrics = worldExtremeCatalog.metrics
export const worldExtremeEntryCount = worldExtremeMetrics.reduce(
  (total, metric) => total + metric.entries.length,
  0,
)

const categoriesById = new Map<string, (typeof worldExtremeCategories)[number]>(
  worldExtremeCategories.map((category) => [category.id, category]),
)
const metricsById = new Map<string, (typeof worldExtremeMetrics)[number]>(
  worldExtremeMetrics.map((metric) => [metric.id, metric]),
)

export const DEFAULT_WORLD_EXTREME_CATEGORY_ID: WorldExtremeCategoryId =
  'country-scale'
export const DEFAULT_WORLD_EXTREME_METRIC_ID: WorldExtremeMetricId =
  'largest-country-area'

export function getWorldExtremeCategory(categoryId: string | null | undefined) {
  return categoryId ? categoriesById.get(categoryId) : undefined
}

export function getWorldExtremeMetric(metricId: string | null | undefined) {
  return metricId ? metricsById.get(metricId) : undefined
}

export function getWorldExtremeMetricsForCategory(
  categoryId: WorldExtremeCategoryId,
) {
  return worldExtremeMetrics.filter(
    (metric) => metric.categoryId === categoryId,
  )
}

export function getWorldExtremeEntry(
  metricId: string | null | undefined,
  entryId: string | null | undefined,
) {
  return getWorldExtremeMetric(metricId)?.entries.find(
    (entry) => entry.id === entryId,
  )
}

export function resolveWorldExtremeSelection(
  categoryId: string | null | undefined,
  metricId: string | null | undefined,
) {
  const metric = getWorldExtremeMetric(metricId)
  if (metric) {
    return {
      categoryId: metric.categoryId,
      metricId: metric.id,
    }
  }

  const category =
    getWorldExtremeCategory(categoryId) ??
    getWorldExtremeCategory(DEFAULT_WORLD_EXTREME_CATEGORY_ID)!
  return {
    categoryId: category.id,
    metricId: getWorldExtremeMetricsForCategory(category.id)[0].id,
  }
}

export function getWorldExtremeOverviewPath(
  categoryId: WorldExtremeCategoryId,
  metricId: WorldExtremeMetricId,
) {
  return `/knowledge/extremes?category=${categoryId}&metric=${metricId}`
}

export function getWorldExtremeExplorePath(entry: WorldExtremeEntry) {
  const searchParams = new URLSearchParams({
    latitude: String(entry.position.latitude),
    longitude: String(entry.position.longitude),
  })
  if (entry.entity?.kind === 'country') {
    searchParams.set('country', entry.entity.id)
  } else if (entry.entity?.kind === 'waterbody') {
    searchParams.set('waterbody', entry.entity.id)
  } else if (entry.entity?.kind === 'linearFeature') {
    searchParams.set('linearFeature', entry.entity.id)
  } else if (entry.entity?.kind === 'mountainRange') {
    searchParams.set('mountainRange', entry.entity.id)
  } else if (entry.entity?.kind === 'desert') {
    searchParams.set('desert', entry.entity.id)
  }
  return `/explore?${searchParams.toString()}`
}

export function getWorldExtremeSource(sourceId: string) {
  return countrySourcesById.get(sourceId)
}
