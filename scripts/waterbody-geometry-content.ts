export type WaterbodyPosition = [number, number]

type SurfaceWaterbodyKind = 'ocean' | 'sea' | 'gulf' | 'bay' | 'lake' | 'strait'

export type NaturalEarthWaterbodyDataset = 'marine' | 'lakes'

type ReviewedOutline = {
  type: 'Polygon'
  coordinates: WaterbodyPosition[][]
  sourceIds: string[]
}

export type WaterbodyGeometryDefinition = {
  id: string
  kind: SurfaceWaterbodyKind
  dataset: NaturalEarthWaterbodyDataset
  naturalEarthNeIds: number[]
  lowDetailMaximumPoints: number
  reviewedOutline?: ReviewedOutline
}

export const NATURAL_EARTH_MARINE_ARCHIVE_URL =
  'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_geography_marine_polys.zip'

export const NATURAL_EARTH_MARINE_ARCHIVE_SHA256 =
  'a2d3395904c41e718e02c3ec5bc988712164c524c236fad32d95d282ca303b2a'

export const NATURAL_EARTH_LAKES_ARCHIVE_URL =
  'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_lakes.zip'

export const NATURAL_EARTH_LAKES_ARCHIVE_SHA256 =
  '0803a06f9c3cb4671d89b68c48b142aad9366ba40f665245e12a913fbc61722a'

const maximumPoints = (kind: SurfaceWaterbodyKind) =>
  kind === 'ocean' ? 600 : kind === 'strait' ? 100 : kind === 'lake' ? 120 : 300

const naturalEarth = (
  id: string,
  kind: SurfaceWaterbodyKind,
  ...naturalEarthNeIds: number[]
): WaterbodyGeometryDefinition => ({
  id,
  kind,
  dataset: 'marine',
  naturalEarthNeIds,
  lowDetailMaximumPoints: maximumPoints(kind),
})

const naturalEarthLake = (
  id: string,
  ...naturalEarthNeIds: number[]
): WaterbodyGeometryDefinition => ({
  id,
  kind: 'lake',
  dataset: 'lakes',
  naturalEarthNeIds,
  lowDetailMaximumPoints: maximumPoints('lake'),
})

const reviewed = (
  id: string,
  coordinates: WaterbodyPosition[],
): WaterbodyGeometryDefinition => ({
  id,
  kind: 'strait',
  dataset: 'marine',
  naturalEarthNeIds: [],
  lowDetailMaximumPoints: maximumPoints('strait'),
  reviewedOutline: {
    type: 'Polygon',
    coordinates: [coordinates],
    sourceIds: ['marine-regions', 'iho-oceans-seas'],
  },
})

// Every Natural Earth record below is repository-reviewed. Names are never
// used to resolve geometry at generation time because upstream labels can
// change independently of the stable Natural Earth identifiers.
export const waterbodyGeometryDefinitions: WaterbodyGeometryDefinition[] = [
  naturalEarth('pacific-ocean', 'ocean', 1159115079, 1159115099),
  naturalEarth('atlantic-ocean', 'ocean', 1159115057, 1159115149),
  naturalEarth('indian-ocean', 'ocean', 1159115123),
  naturalEarth('arctic-ocean', 'ocean', 1159115017),
  naturalEarth('southern-ocean', 'ocean', 1159115037),
  naturalEarth('mediterranean-sea', 'sea', 1159115321),
  naturalEarth('caribbean-sea', 'sea', 1159115379),
  naturalEarth('south-china-sea', 'sea', 1159115273),
  naturalEarth('east-china-sea', 'sea', 1159116027),
  naturalEarth('yellow-sea', 'sea', 1159115999),
  naturalEarth('bohai-sea', 'sea', 1159117171),
  naturalEarth('sea-of-japan', 'sea', 1159115305),
  naturalEarth('philippine-sea', 'sea', 1159115197),
  naturalEarth('bering-sea', 'sea', 1159117319),
  naturalEarth('sea-of-okhotsk', 'sea', 1159115541),
  naturalEarth('coral-sea', 'sea', 1159115219),
  naturalEarth('tasman-sea', 'sea', 1159115233),
  naturalEarth('arabian-sea', 'sea', 1159115343),
  naturalEarth('red-sea', 'sea', 1159115521),
  naturalEarth('black-sea', 'sea', 1159115171),
  naturalEarth('baltic-sea', 'sea', 1159115831),
  naturalEarth('north-sea', 'sea', 1159115879),
  naturalEarth('norwegian-sea', 'sea', 1159115675),
  naturalEarth('barents-sea', 'sea', 1159115861),
  naturalEarth('greenland-sea', 'sea', 1159115695),
  naturalEarth('labrador-sea', 'sea', 1159115419),
  naturalEarth('andaman-sea', 'sea', 1159115987),
  naturalEarth('java-sea', 'sea', 1159115959),
  naturalEarth('aegean-sea', 'sea', 1159117123),
  naturalEarth('adriatic-sea', 'sea', 1159116607),
  naturalEarth('caspian-sea', 'sea', 1159115461),
  naturalEarth('gulf-of-mexico', 'gulf', 1159115399),
  naturalEarth('persian-gulf', 'gulf', 1159115597),
  naturalEarth('bay-of-bengal', 'bay', 1159115253),
  naturalEarth('gulf-of-guinea', 'gulf', 1159115791),
  naturalEarth('gulf-of-alaska', 'gulf', 1159115503),
  naturalEarth('hudson-bay', 'bay', 1159115441),
  naturalEarth('strait-of-malacca', 'strait', 1159116835),
  naturalEarth('strait-of-gibraltar', 'strait', 1159117067),
  reviewed('bering-strait', [
    [-171.3, 65.35],
    [-170.25, 65.15],
    [-168.35, 65.55],
    [-167.15, 66.25],
    [-167.35, 67.15],
    [-169.15, 67.8],
    [-170.8, 67.3],
    [-171.3, 65.35],
  ]),
  reviewed('strait-of-hormuz', [
    [55.35, 26.15],
    [55.8, 25.65],
    [56.45, 25.55],
    [57.15, 26.1],
    [57.05, 26.55],
    [56.35, 26.95],
    [55.65, 26.75],
    [55.35, 26.15],
  ]),
  naturalEarth('bosporus', 'strait', 1159118835),
  naturalEarth('bab-el-mandeb', 'strait', 1159118853),
  naturalEarth('taiwan-strait', 'strait', 1159116947),
  naturalEarth('korea-strait', 'strait', 1159116907),
  naturalEarth('english-channel', 'strait', 1159116535),
  naturalEarth('strait-of-magellan', 'strait', 1159118553),
  naturalEarthLake('lake-superior', 1159112991),
  naturalEarthLake('lake-michigan', 1159113005),
  naturalEarthLake('lake-huron', 1159113021),
  naturalEarthLake('lake-erie', 1159106757),
  naturalEarthLake('lake-ontario', 1159106765),
  naturalEarthLake('great-bear-lake', 1159106721),
  naturalEarthLake('great-slave-lake', 1159106729),
  naturalEarthLake('lake-victoria', 1159113191),
  naturalEarthLake('lake-tanganyika', 1159113185),
  naturalEarthLake('lake-malawi', 1159113163),
  naturalEarthLake('lake-chad', 1159113219),
  naturalEarthLake('lake-turkana', 1159126669),
  naturalEarthLake('lake-baikal', 1159113127),
  naturalEarthLake('lake-balkhash', 1159113111),
  naturalEarthLake('qinghai-lake', 1159126725),
  naturalEarthLake('tonle-sap', 1159113439),
  naturalEarthLake('dead-sea', 1159126747),
  naturalEarthLake('lake-titicaca', 1159113279),
  naturalEarthLake('lake-ladoga', 1159113095),
  naturalEarthLake('lake-eyre', 1159126091, 1159126189),
]
