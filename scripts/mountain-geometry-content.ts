export type MountainPosition = [number, number]

export type MountainGeometryDefinition = {
  id: string
  naturalEarthNeId: number
  controlPoints: MountainPosition[]
  peak: MountainPosition
  correctionSourceIds: string[]
}

export const NATURAL_EARTH_MOUNTAIN_ARCHIVE_URL =
  'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_geography_regions_polys.zip'

export const NATURAL_EARTH_MOUNTAIN_ARCHIVE_SHA256 =
  'cb7b9db200284ed1551f20eacc7f3333e9b5f311c19f7cb2670694529f688682'

const range = (definition: MountainGeometryDefinition) => definition

// Ordered ridge anchors in [longitude, latitude] order. Natural Earth range
// polygons are used as validation envelopes; these reviewed anchors define the
// educational ridge direction and are retained by all generated detail levels.
export const mountainGeometryDefinitions: MountainGeometryDefinition[] = [
  range({
    id: 'himalayas',
    naturalEarthNeId: 1159104307,
    controlPoints: [
      [76, 32.8],
      [80, 31],
      [84, 29.1],
      [86.925, 27.9881],
      [90.5, 27.8],
      [94.5, 28.9],
    ],
    peak: [86.925, 27.9881],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'karakoram',
    naturalEarthNeId: 1159104185,
    controlPoints: [
      [75.3, 35.3],
      [76.5158, 35.8808],
      [77.5, 35.9],
      [79.2, 35.3],
    ],
    peak: [76.5158, 35.8808],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'hindu-kush',
    naturalEarthNeId: 1159104183,
    controlPoints: [
      [67.4, 34.8],
      [69.5, 35.5],
      [71.841, 36.255],
      [74.7, 36.4],
    ],
    peak: [71.841, 36.255],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'pamirs',
    naturalEarthNeId: 1159104181,
    controlPoints: [
      [71.7, 38.3],
      [72.7, 38.9],
      [74, 38.6],
      [75.3125, 38.5942],
      [76.5, 38],
    ],
    peak: [75.3125, 38.5942],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'tian-shan',
    naturalEarthNeId: 1159104299,
    controlPoints: [
      [73.5, 41],
      [76.5, 42],
      [80.1258, 42.0355],
      [84.5, 42.5],
      [89, 42.8],
      [94.5, 42],
    ],
    peak: [80.1258, 42.0355],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'kunlun',
    naturalEarthNeId: 1159104187,
    controlPoints: [
      [78.5, 35.7],
      [80.93, 35.3],
      [85, 35.6],
      [90, 36],
      [95, 36.4],
      [98.5, 36.8],
    ],
    peak: [80.93, 35.3],
    correctionSourceIds: ['china-mountain-review'],
  }),
  range({
    id: 'altai',
    naturalEarthNeId: 1159104169,
    controlPoints: [
      [82.5, 47.3],
      [86.5908, 49.8075],
      [90, 49.5],
      [94, 48.5],
      [99, 47],
    ],
    peak: [86.5908, 49.8075],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'greater-khingan',
    naturalEarthNeId: 1159104171,
    controlPoints: [
      [117.53, 43.3],
      [120, 46],
      [122, 49],
      [124.5, 52.8],
    ],
    peak: [117.53, 43.3],
    correctionSourceIds: ['china-mountain-review'],
  }),
  range({
    id: 'qinling',
    naturalEarthNeId: 1159103573,
    controlPoints: [
      [105.5, 33.3],
      [107.75, 33.95],
      [110, 33.7],
      [112, 33.5],
      [113.8, 33.3],
    ],
    peak: [107.75, 33.95],
    correctionSourceIds: ['china-mountain-review'],
  }),
  range({
    id: 'zagros',
    naturalEarthNeId: 1159104167,
    controlPoints: [
      [46.8, 35],
      [49, 33.5],
      [51.45, 30.95],
      [54, 28.5],
      [56, 27.2],
    ],
    peak: [51.45, 30.95],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'alps',
    naturalEarthNeId: 1159104297,
    controlPoints: [
      [5.5, 44.6],
      [6.8652, 45.8326],
      [9.3, 46.5],
      [12, 46.7],
      [15.5, 47],
    ],
    peak: [6.8652, 45.8326],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'pyrenees',
    naturalEarthNeId: 1159103941,
    controlPoints: [
      [-1.8, 42.8],
      [0.656, 42.631],
      [2.8, 42.5],
    ],
    peak: [0.656, 42.631],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'carpathians',
    naturalEarthNeId: 1159103937,
    controlPoints: [
      [17.8, 48.8],
      [20.134, 49.164],
      [22, 48],
      [24.5, 46.8],
      [26.5, 45.3],
    ],
    peak: [20.134, 49.164],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'apennines',
    naturalEarthNeId: 1159103939,
    controlPoints: [
      [9.5, 44.6],
      [11.5, 43.5],
      [13.565, 42.469],
      [15.5, 40.5],
    ],
    peak: [13.565, 42.469],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'scandinavian-mountains',
    naturalEarthNeId: 1159103935,
    controlPoints: [
      [6, 59],
      [8.3125, 61.6366],
      [12, 64],
      [16, 66],
      [21, 69],
    ],
    peak: [8.3125, 61.6366],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'ural-mountains',
    naturalEarthNeId: 1159104301,
    controlPoints: [
      [58, 52],
      [59, 56],
      [60, 60],
      [60.118, 65.035],
      [65, 67.8],
    ],
    peak: [60.118, 65.035],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'caucasus',
    naturalEarthNeId: 1159104305,
    controlPoints: [
      [38, 43.5],
      [42.4453, 43.3499],
      [45, 42.8],
      [49, 41.8],
    ],
    peak: [42.4453, 43.3499],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'atlas-mountains',
    naturalEarthNeId: 1159104189,
    controlPoints: [
      [-10, 31],
      [-7.916, 31.059],
      [-4, 32],
      [0, 34],
      [4, 35],
      [9, 36],
    ],
    peak: [-7.916, 31.059],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'ethiopian-highlands',
    naturalEarthNeId: 1159104165,
    controlPoints: [
      [35, 6],
      [37, 10],
      [38.372, 13.236],
      [39, 16],
      [42, 17],
    ],
    peak: [38.372, 13.236],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'drakensberg',
    naturalEarthNeId: 1159103881,
    controlPoints: [
      [24, -32],
      [28, -29.5],
      [29.27, -29.47],
      [30, -26],
      [31.5, -23],
    ],
    peak: [29.27, -29.47],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'rwenzori-mountains',
    naturalEarthNeId: 1730070733,
    controlPoints: [
      [29.72, 0.1],
      [29.872, 0.386],
      [30.2, 0.85],
    ],
    peak: [29.872, 0.386],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'rocky-mountains',
    naturalEarthNeId: 1159104311,
    controlPoints: [
      [-106.5, 35.8],
      [-106.4454, 39.1178],
      [-110, 43],
      [-113, 47],
      [-117, 51],
      [-123, 57],
      [-126, 59],
    ],
    peak: [-106.4454, 39.1178],
    correctionSourceIds: ['usgs-mountain-peaks'],
  }),
  range({
    id: 'appalachian-mountains',
    naturalEarthNeId: 1159104191,
    controlPoints: [
      [-85, 33],
      [-82.2652, 35.7648],
      [-81, 38],
      [-78, 41],
      [-74, 44],
      [-68, 47],
      [-64.5, 49],
    ],
    peak: [-82.2652, 35.7648],
    correctionSourceIds: ['usgs-mountain-peaks'],
  }),
  range({
    id: 'alaska-range',
    naturalEarthNeId: 1159104201,
    controlPoints: [
      [-154, 61.5],
      [-151.0074, 63.0695],
      [-148, 63.5],
      [-143, 62],
    ],
    peak: [-151.0074, 63.0695],
    correctionSourceIds: ['usgs-mountain-peaks'],
  }),
  range({
    id: 'sierra-nevada',
    naturalEarthNeId: 1159103951,
    controlPoints: [
      [-121, 39.8],
      [-119.5, 38],
      [-118.292, 36.5786],
      [-118.5, 35.2],
    ],
    peak: [-118.292, 36.5786],
    correctionSourceIds: ['usgs-mountain-peaks'],
  }),
  range({
    id: 'cascade-range',
    naturalEarthNeId: 1159104199,
    controlPoints: [
      [-122, 40.5],
      [-121.7603, 46.8523],
      [-121.5, 48.5],
      [-120, 50.5],
    ],
    peak: [-121.7603, 46.8523],
    correctionSourceIds: ['usgs-mountain-peaks'],
  }),
  range({
    id: 'andes',
    naturalEarthNeId: 1159104309,
    controlPoints: [
      [-78, 10],
      [-76, 4],
      [-78, -2],
      [-74, -10],
      [-71, -18],
      [-68, -25],
      [-70.01, -32.653],
      [-70, -40],
      [-72, -48],
      [-73, -54],
    ],
    peak: [-70.01, -32.653],
    correctionSourceIds: ['mountain-peak-review'],
  }),
  range({
    id: 'great-dividing-range',
    naturalEarthNeId: 1159104295,
    controlPoints: [
      [145, -37],
      [148.263, -36.455],
      [150, -32],
      [151, -26],
      [149, -20],
      [145, -14],
    ],
    peak: [148.263, -36.455],
    correctionSourceIds: ['geoscience-australia-mountains'],
  }),
  range({
    id: 'southern-alps',
    naturalEarthNeId: 1159104623,
    controlPoints: [
      [167, -46],
      [170.142, -43.595],
      [172.5, -42],
    ],
    peak: [170.142, -43.595],
    correctionSourceIds: ['linz-mountain-peaks'],
  }),
  range({
    id: 'new-guinea-highlands',
    naturalEarthNeId: 1730072617,
    controlPoints: [
      [136, -4],
      [137.159, -4.078],
      [140, -5],
      [144, -6],
      [148, -8.5],
    ],
    peak: [137.159, -4.078],
    correctionSourceIds: ['mountain-peak-review'],
  }),
]
