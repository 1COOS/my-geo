export type RiverPosition = [number, number]

export type RiverRecordPart = {
  neId: number
  part: number
}

export type RiverStemDefinition = {
  sourceAnchor: RiverPosition
  mouthAnchor: RiverPosition
  parts: RiverRecordPart[]
  sourceSupplement?: RiverPosition[]
  mouthSupplement?: RiverPosition[]
  bridgeVias?: Record<number, RiverPosition[]>
}

export type RiverGeometryDefinition = {
  id: string
  stems: RiverStemDefinition[]
  supplementalSourceIds?: string[]
  supplementKind?: 'reviewed-gap' | 'authoritative-open-data'
  controlPoints?: RiverPosition[]
}

export const NATURAL_EARTH_RIVER_ARCHIVE_URL =
  'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_rivers_lake_centerlines.zip'
export const NATURAL_EARTH_RIVER_ARCHIVE_SHA256 =
  'ded71b01870855ccfe19b51f2ec14c9bb48fae23c0e9f3c11974d426433b5c38'

const part = (neId: number, partIndex = 0): RiverRecordPart => ({
  neId,
  part: partIndex,
})

// Every Natural Earth record and part index below is repository-reviewed.
// Ordering is source-to-mouth after deterministic endpoint orientation. The
// generator refuses gaps over 15 km unless the whole object explicitly declares
// a supplemental source here; all inserted gaps are emitted in provenance.
export const riverGeometryDefinitions: RiverGeometryDefinition[] = [
  {
    id: 'yangtze-system',
    stems: [
      {
        sourceAnchor: [91.5, 33.5],
        mouthAnchor: [121.9, 31.35],
        sourceSupplement: [
          [91.5, 33.5],
          [94.5, 33.1],
          [96.8, 32.4],
          [98.5415, 31.68976],
        ],
        mouthSupplement: [
          [119.60635, 32.19689],
          [120.6, 31.75],
          [121.9, 31.35],
        ],
        parts: [
          part(1159112733, 0),
          part(1159112733, 1),
          part(1159113509, 0),
          part(1159113509, 1),
          part(1159113707, 1),
          part(1159113707, 2),
        ],
      },
    ],
    supplementalSourceIds: ['china-river-source-review'],
    supplementKind: 'reviewed-gap',
    controlPoints: [
      [106.55, 29.56],
      [114.3, 30.59],
      [118.8, 32.05],
    ],
  },
  {
    id: 'yellow-river-system',
    stems: [
      {
        sourceAnchor: [96.16, 35.13],
        mouthAnchor: [119.23, 37.78],
        parts: [
          part(1159124959, 0),
          part(1159124959, 2),
          part(1159124959, 1),
          part(1159128895, 1),
          part(1159128895, 0),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
    controlPoints: [
      [106.5, 37.5],
      [111, 40.2],
      [114.8, 35.02],
    ],
  },
  {
    id: 'pearl-river-system',
    stems: [
      {
        sourceAnchor: [103.92, 25.88],
        mouthAnchor: [113.56, 22.58],
        parts: [
          part(1159112165),
          part(1159112463),
          part(1159112477),
          part(1159112491),
          part(1159128943, 3),
        ],
      },
    ],
    controlPoints: [
      [106.97, 25.24],
      [109.53, 23.8],
      [111.3, 23.48],
    ],
  },
  {
    id: 'mekong-system',
    stems: [
      {
        sourceAnchor: [94.7, 33.2],
        mouthAnchor: [106.12, 10.24],
        sourceSupplement: [
          [94.7, 33.2],
          [96.0, 32.7],
          [96.94131, 31.96552],
        ],
        parts: [
          part(1159119517),
          part(1159121023, 0),
          part(1159121023, 1),
          part(1159121023, 2),
          part(1159121023, 4),
        ],
      },
    ],
    supplementalSourceIds: ['mekong-source-review'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'ganges-brahmaputra-system',
    stems: [
      {
        sourceAnchor: [79.84072, 30.8885],
        mouthAnchor: [90.25, 22.15],
        mouthSupplement: [
          [89.74927, 23.84802],
          [90.25, 22.15],
        ],
        parts: [part(1159122643, 1)],
      },
      {
        sourceAnchor: [87.66016, 29.00417],
        mouthAnchor: [90.25, 22.15],
        mouthSupplement: [
          [90.2501, 23.46198],
          [90.25, 22.15],
        ],
        parts: [part(1159120261), part(1159121213), part(1159121927, 0)],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'indus-system',
    stems: [
      {
        sourceAnchor: [79.43726, 32.7381],
        mouthAnchor: [67.53, 24.02],
        parts: [part(1159122839, 5), part(1159122839, 6)],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'tigris-euphrates-system',
    stems: [
      {
        sourceAnchor: [39.1731, 38.42443],
        mouthAnchor: [47.43398, 31.01882],
        parts: [part(1159112059), part(1159112275, 1), part(1159112275, 0)],
      },
      {
        sourceAnchor: [41.45547, 40.18019],
        mouthAnchor: [47.46851, 30.96845],
        parts: [
          part(1159124669, 0),
          part(1159124669, 3),
          part(1159124669, 2),
          part(1159124669, 1),
          part(1159125949, 0),
          part(1159125949, 1),
          part(1159123947, 0),
          part(1159123947, 1),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'ob-irtysh-system',
    stems: [
      {
        sourceAnchor: [85.05615, 52.43361],
        mouthAnchor: [68.96494, 66.80959],
        parts: [part(1159111937, 1), part(1159111937, 0), part(1159114911, 1)],
      },
      {
        sourceAnchor: [90.32529, 47.65017],
        mouthAnchor: [68.86133, 61.12446],
        parts: [
          part(1159116855),
          part(1159116609, 0),
          part(1159116609, 1),
          part(1159120669, 0),
          part(1159120669, 1),
          part(1159120669, 2),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'yenisei-angara-system',
    stems: [
      {
        sourceAnchor: [94.46475, 51.73371],
        mouthAnchor: [83.17676, 70.08308],
        parts: [part(1159112435, 0), part(1159112435, 1), part(1159111765)],
      },
      {
        sourceAnchor: [104.86694, 51.87018],
        mouthAnchor: [92.99063, 58.09328],
        parts: [
          part(1159116373),
          part(1159116353, 1),
          part(1159117269, 1),
          part(1159117253),
          part(1159117269, 2),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'lena-system',
    stems: [
      {
        sourceAnchor: [107.98008, 54.00417],
        mouthAnchor: [126.6897, 72.29438],
        parts: [part(1159112191, 0), part(1159112191, 1)],
      },
    ],
  },
  {
    id: 'amur-system',
    stems: [
      {
        sourceAnchor: [121.40537, 53.31708],
        mouthAnchor: [140.70664, 53.11103],
        parts: [
          part(1159128755),
          part(1159126543, 0),
          part(1159126543, 1),
          part(1159126543, 2),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'volga-system',
    stems: [
      {
        sourceAnchor: [32.59824, 57.25036],
        mouthAnchor: [47.55576, 45.76606],
        bridgeVias: {
          0: [
            [38.0, 56.2],
            [42.2, 53.4],
            [45.66357, 50.22228],
          ],
        },
        parts: [part(1159125629, 0), part(1159125629, 7)],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'danube-system',
    stems: [
      {
        sourceAnchor: [8.1792, 48.09352],
        mouthAnchor: [28.74697, 45.23073],
        parts: [part(1159118769, 0), part(1159118769, 1), part(1159115307)],
      },
    ],
  },
  {
    id: 'rhine-system',
    stems: [
      {
        sourceAnchor: [8.71021, 46.62267],
        mouthAnchor: [4.98535, 51.82368],
        parts: [
          part(1159110403, 0),
          part(1159110403, 1),
          part(1159112359),
          part(1159112519),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'nile-system',
    stems: [
      {
        sourceAnchor: [31.76758, -0.93572],
        mouthAnchor: [31.23691, 30.12385],
        parts: [
          part(1159123321, 2),
          part(1159123335, 0),
          part(1159123321, 0),
          part(1159123321, 1),
          part(1159123335, 2),
          part(1159129205),
          part(1159129211),
          part(1159112505),
          part(1159113063),
          part(1159113335),
          part(1159121589, 1),
          part(1159121589, 2),
        ],
      },
      {
        sourceAnchor: [37.17896, 11.03576],
        mouthAnchor: [32.48887, 15.63259],
        parts: [
          part(1159125333),
          part(1159128181),
          part(1159126701, 0),
          part(1159126685),
          part(1159126701, 1),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'congo-system',
    stems: [
      {
        sourceAnchor: [26.44131, -8.272],
        mouthAnchor: [13.18433, -5.85628],
        parts: [
          part(1159119889),
          part(1159120477, 0),
          part(1159120477, 1),
          part(1159120849),
        ],
      },
    ],
  },
  {
    id: 'niger-system',
    stems: [
      {
        sourceAnchor: [-10.73203, 9.08991],
        mouthAnchor: [5.49585, 5.14235],
        parts: [
          part(1159123305, 3),
          part(1159123305, 0),
          part(1159123305, 4),
          part(1159123305, 6),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'zambezi-system',
    stems: [
      {
        sourceAnchor: [24.26553, -11.37923],
        mouthAnchor: [36.13438, -18.80755],
        parts: [part(1159126215, 0), part(1159126215, 3), part(1159126215, 4)],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'orange-system',
    stems: [
      {
        sourceAnchor: [29.05752, -29.08187],
        mouthAnchor: [16.48706, -28.57293],
        parts: [
          part(1159114147, 0),
          part(1159114147, 1),
          part(1159114147, 2),
          part(1159114147, 3),
          part(1159129067),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'mississippi-missouri-system',
    stems: [
      {
        sourceAnchor: [-94.09409, 47.43281],
        mouthAnchor: [-89.26099, 29.15515],
        parts: [part(1159112621, 1), part(1159119147, 2), part(1159119147, 4)],
      },
      {
        sourceAnchor: [-111.69878, 46.66267],
        mouthAnchor: [-90.13311, 38.81904],
        parts: [
          part(1159128481, 0),
          part(1159128481, 1),
          part(1159128481, 2),
          part(1159128481, 4),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'mackenzie-system',
    stems: [
      {
        sourceAnchor: [-127.23535, 56.81457],
        mouthAnchor: [-134.31304, 69.15392],
        parts: [
          part(1159117141),
          part(1159117465, 0),
          part(1159117465, 1),
          part(1159119121),
          part(1159117661, 0),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'saint-lawrence-great-lakes-system',
    stems: [
      {
        sourceAnchor: [-92.1, 47.9],
        mouthAnchor: [-64.2, 49.2],
        sourceSupplement: [
          [-92.1, 47.9],
          [-87.0, 46.7],
          [-84.6, 46.0],
          [-83.0, 42.3],
          [-79.0, 43.4],
          [-75.79199, 44.49702],
        ],
        mouthSupplement: [
          [-74.71294, 44.99929],
          [-73.3, 45.6],
          [-69.0, 47.0],
          [-64.2, 49.2],
        ],
        parts: [part(1159114637)],
      },
    ],
    supplementalSourceIds: ['canadian-hydrographic-network'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'colorado-system',
    stems: [
      {
        sourceAnchor: [-105.84556, 40.40412],
        mouthAnchor: [-115.03521, 31.96608],
        parts: [
          part(1159112855, 0),
          part(1159112855, 1),
          part(1159112855, 2),
          part(1159112855, 3),
          part(1159112855, 5),
          part(1159112855, 7),
          part(1159112855, 6),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'rio-grande-system',
    stems: [
      {
        sourceAnchor: [-107.42656, 37.77595],
        mouthAnchor: [-97.13926, 25.96584],
        parts: [
          part(1159111317, 0),
          part(1159111317, 1),
          part(1159111317, 2),
          part(1159111317, 3),
          part(1159111317, 4),
          part(1159111317, 5),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'yukon-system',
    stems: [
      {
        sourceAnchor: [-134.91553, 61.56789],
        mouthAnchor: [-164.76636, 61.62873],
        parts: [
          part(1159122327, 1),
          part(1159122327, 2),
          part(1159122327, 3),
          part(1159122327, 4),
          part(1159122327, 0),
        ],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'amazon-system',
    stems: [
      {
        sourceAnchor: [-76.7, -15.5],
        mouthAnchor: [-50.0, 0.0],
        sourceSupplement: [
          [-76.7, -15.5],
          [-74.2, -15.2],
          [-71.66875, -15.33636],
        ],
        mouthSupplement: [
          [-52.71177, -1.58382],
          [-50.0, 0.0],
        ],
        parts: [part(1159111139), part(1159116655, 1)],
      },
    ],
    supplementalSourceIds: ['peru-ana-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'parana-paraguay-system',
    stems: [
      {
        sourceAnchor: [-55.07529, -14.31937],
        mouthAnchor: [-58.35, -34.6],
        mouthSupplement: [
          [-58.44687, -34.00701],
          [-58.35, -34.6],
        ],
        parts: [part(1159118169, 0), part(1159118169, 1)],
      },
      {
        sourceAnchor: [-56.4, -16.2],
        mouthAnchor: [-58.60498, -27.31624],
        sourceSupplement: [
          [-56.4, -16.2],
          [-57.3, -19.0],
          [-57.8, -22.5],
          [-57.5, -25.0],
          [-58.60498, -27.31624],
        ],
        parts: [],
      },
    ],
    supplementalSourceIds: ['brazil-ana-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'orinoco-system',
    stems: [
      {
        sourceAnchor: [-63.43596, 2.37409],
        mouthAnchor: [-60.5, 8.7],
        mouthSupplement: [
          [-62.32568, 9.72053],
          [-60.5, 8.7],
        ],
        parts: [part(1159127013, 0)],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'sao-francisco-system',
    stems: [
      {
        sourceAnchor: [-45.26221, -18.20428],
        mouthAnchor: [-36.40806, -10.49593],
        parts: [part(1159110245, 0), part(1159110245, 1)],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
  {
    id: 'murray-darling-system',
    stems: [
      {
        sourceAnchor: [147.04453, -36.10763],
        mouthAnchor: [138.88, -35.56],
        mouthSupplement: [
          [139.36286, -35.37692],
          [138.88, -35.56],
        ],
        parts: [part(1159128985), part(1159122485)],
      },
      {
        sourceAnchor: [147.41459, -30.12457],
        mouthAnchor: [141.9262, -34.11685],
        parts: [part(1159128253)],
      },
    ],
    supplementalSourceIds: ['natural-earth-rivers'],
    supplementKind: 'reviewed-gap',
  },
]
