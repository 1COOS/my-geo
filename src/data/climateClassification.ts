import {
  climateMaskSchema,
  type ClimateMask,
  type ClimateTypeId,
} from './climateLearningSchema'

export const koppenClassByValue = {
  1: 'Af',
  2: 'Am',
  3: 'Aw',
  4: 'BWh',
  5: 'BWk',
  6: 'BSh',
  7: 'BSk',
  8: 'Csa',
  9: 'Csb',
  10: 'Csc',
  11: 'Cwa',
  12: 'Cwb',
  13: 'Cwc',
  14: 'Cfa',
  15: 'Cfb',
  16: 'Cfc',
  17: 'Dsa',
  18: 'Dsb',
  19: 'Dsc',
  20: 'Dsd',
  21: 'Dwa',
  22: 'Dwb',
  23: 'Dwc',
  24: 'Dwd',
  25: 'Dfa',
  26: 'Dfb',
  27: 'Dfc',
  28: 'Dfd',
  29: 'ET',
  30: 'EF',
} as const

export type KoppenClass =
  (typeof koppenClassByValue)[keyof typeof koppenClassByValue] | 'As'

const rawMasks = [
  {
    id: 'east-asia-temperate-monsoon',
    kind: 'temperate-monsoon',
    name: '东亚温带季风审核区',
    polygon: [
      [103, 32],
      [112, 31.5],
      [123, 33],
      [130, 35],
      [142, 34],
      [146, 42],
      [145, 49],
      [136, 56],
      [122, 54],
      [111, 47],
      [103, 32],
    ],
  },
  {
    id: 'tibetan-himalayan-highland',
    kind: 'highland',
    name: '青藏高原—喜马拉雅—帕米尔高原山地区',
    polygon: [
      [70, 35],
      [77, 40],
      [90, 39],
      [101, 36],
      [105, 32],
      [101, 27],
      [91, 28],
      [82, 27],
      [75, 31],
      [70, 35],
    ],
  },
  {
    id: 'andes-highland',
    kind: 'highland',
    name: '北部与中部安第斯高原山地区',
    polygon: [
      [-79.5, 10],
      [-73, 8],
      [-74, -4],
      [-69, -13],
      [-67, -23],
      [-69, -28],
      [-72.5, -25],
      [-72, -15],
      [-77, -5],
      [-81, 2],
      [-79.5, 10],
    ],
  },
  {
    id: 'southern-andes-highland',
    kind: 'highland',
    name: '南部安第斯高原山地区',
    polygon: [
      [-69, -23],
      [-66.5, -27],
      [-68, -36],
      [-71, -47],
      [-73, -55],
      [-76, -51],
      [-72.5, -38],
      [-72.5, -28],
      [-69, -23],
    ],
  },
  {
    id: 'east-african-savanna',
    kind: 'tropical-savanna',
    name: '东非热带草原审核区',
    polygon: [
      [28, 5],
      [42, 5],
      [43, -12],
      [28, -12],
      [28, 5],
    ],
  },
  {
    id: 'alaska-canada-cordillera-highland',
    kind: 'highland',
    name: '阿拉斯加—加拿大科迪勒拉高原山地区',
    polygon: [
      [-151, 63],
      [-139, 68],
      [-121, 58],
      [-112, 50],
      [-117, 46],
      [-126, 52],
      [-142, 58],
      [-151, 63],
    ],
  },
  {
    id: 'rocky-mountains-highland',
    kind: 'highland',
    name: '落基山脉高原山地区',
    polygon: [
      [-117, 51],
      [-108, 50],
      [-103, 39],
      [-106, 31],
      [-112, 31],
      [-114, 40],
      [-117, 51],
    ],
  },
  {
    id: 'pacific-cordillera-highland',
    kind: 'highland',
    name: '北美太平洋沿岸山地高原山地区',
    polygon: [
      [-126, 51],
      [-120, 49],
      [-116, 33],
      [-120, 31],
      [-123, 40],
      [-126, 51],
    ],
  },
  {
    id: 'sierra-madre-highland',
    kind: 'highland',
    name: '墨西哥高原—马德雷山地高原山地区',
    polygon: [
      [-112, 32],
      [-103, 31],
      [-98, 19],
      [-103, 17],
      [-108, 24],
      [-112, 32],
    ],
  },
  {
    id: 'ethiopian-highland',
    kind: 'highland',
    name: '埃塞俄比亚高原山地区',
    polygon: [
      [34, 15],
      [42, 15],
      [43, 8],
      [40, 5],
      [35, 6],
      [33, 10],
      [34, 15],
    ],
  },
  {
    id: 'east-african-rift-highland',
    kind: 'highland',
    name: '东非裂谷南段高原山地区',
    polygon: [
      [33, -2.5],
      [38, -2.5],
      [39, -7],
      [34, -7],
      [33, -2.5],
    ],
  },
  {
    id: 'alps-highland',
    kind: 'highland',
    name: '阿尔卑斯高原山地区',
    polygon: [
      [5, 47.5],
      [9, 49],
      [16.5, 48.5],
      [17.5, 45],
      [8, 43.5],
      [5, 47.5],
    ],
  },
  {
    id: 'caucasus-highland',
    kind: 'highland',
    name: '高加索高原山地区',
    polygon: [
      [37, 44.5],
      [45, 45],
      [50, 42.5],
      [48, 39],
      [39, 39],
      [37, 44.5],
    ],
  },
] satisfies ClimateMask[]

export const climateMasks = rawMasks.map((mask) =>
  climateMaskSchema.parse(mask),
)

function isInsideMask(
  longitude: number,
  latitude: number,
  kind: ClimateMask['kind'],
) {
  return climateMasks
    .filter((mask) => mask.kind === kind)
    .some((mask) => pointInPolygon(longitude, latitude, mask.polygon))
}

function pointInPolygon(
  longitude: number,
  latitude: number,
  polygon: ClimateMask['polygon'],
) {
  let inside = false
  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index, index += 1
  ) {
    const [x, y] = polygon[index]
    const [previousX, previousY] = polygon[previous]
    const intersects =
      y > latitude !== previousY > latitude &&
      longitude < ((previousX - x) * (latitude - y)) / (previousY - y) + x
    if (intersects) inside = !inside
  }
  return inside
}

export function mapKoppenClassToClimateType(
  koppenClass: KoppenClass | null,
  position: { latitude: number; longitude: number },
): ClimateTypeId | null {
  if (!koppenClass) return null
  if (isInsideMask(position.longitude, position.latitude, 'highland')) {
    return 'highland-mountain'
  }
  if (isInsideMask(position.longitude, position.latitude, 'tropical-savanna')) {
    return 'tropical-savanna'
  }
  if (
    isInsideMask(position.longitude, position.latitude, 'temperate-monsoon') &&
    ['BSk', 'Dfa', 'Dfb', 'Dwa', 'Dwb', 'Dwc'].includes(koppenClass)
  ) {
    return 'temperate-monsoon'
  }
  if (koppenClass === 'Af') return 'tropical-rainforest'
  if (koppenClass === 'Am') return 'tropical-monsoon'
  if (
    koppenClass === 'Aw' ||
    koppenClass === 'As' ||
    (koppenClass === 'BSh' && Math.abs(position.latitude) < 20)
  ) {
    return 'tropical-savanna'
  }
  if (koppenClass === 'BWh' || koppenClass === 'BSh') {
    return 'tropical-desert'
  }
  if (['Cfa', 'Cwa', 'Cwb', 'Cwc'].includes(koppenClass)) {
    return 'subtropical-monsoon-humid'
  }
  if (['Csa', 'Csb', 'Csc'].includes(koppenClass)) return 'mediterranean'
  if (['Cfb', 'Cfc'].includes(koppenClass)) return 'temperate-oceanic'
  if (
    ['BWk', 'BSk', 'Dsa', 'Dsb', 'Dfa', 'Dfb', 'Dwa', 'Dwb'].includes(
      koppenClass,
    )
  ) {
    return 'temperate-continental'
  }
  if (['Dfc', 'Dfd', 'Dsc', 'Dsd', 'Dwc', 'Dwd'].includes(koppenClass)) {
    return 'subarctic-coniferous'
  }
  if (koppenClass === 'ET') return 'tundra'
  if (koppenClass === 'EF') return 'ice-cap'
  return null
}

export function mapKoppenValueToClimateType(
  value: number,
  position: { latitude: number; longitude: number },
) {
  const koppenClass =
    koppenClassByValue[value as keyof typeof koppenClassByValue]
  return mapKoppenClassToClimateType(koppenClass ?? null, position)
}
