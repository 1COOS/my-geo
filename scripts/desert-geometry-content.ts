export type DesertGeometryDefinition = {
  id: string
  naturalEarthNeId: number
  lowDetailMaximumPoints: number
}

export const NATURAL_EARTH_DESERT_ARCHIVE_URL =
  'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_geography_regions_polys.zip'

export const NATURAL_EARTH_DESERT_ARCHIVE_VERSION = '5.0.0'

export const NATURAL_EARTH_DESERT_ARCHIVE_SHA256 =
  'cb7b9db200284ed1551f20eacc7f3333e9b5f311c19f7cb2670694529f688682'

const desert = (
  id: string,
  naturalEarthNeId: number,
  lowDetailMaximumPoints = 180,
): DesertGeometryDefinition => ({
  id,
  naturalEarthNeId,
  lowDetailMaximumPoints,
})

// These ids are reviewed against the pinned Natural Earth archive. Runtime
// code never guesses records from translated or source names.
export const desertGeometryDefinitions: DesertGeometryDefinition[] = [
  desert('sahara', 1159104337, 260),
  desert('gobi', 1159104335, 220),
  desert('rub-al-khali', 1159104247),
  desert('kalahari', 1159104253, 220),
  desert('namib', 1159104059),
  desert('atacama', 1159104081),
  desert('taklamakan', 1159103651),
  desert('thar', 1159104073),
  desert('great-victoria', 1159104071),
  desert('great-sandy', 1159104065),
  desert('simpson', 1159103279),
  desert('sonoran', 1159103643),
  desert('chihuahuan', 1159103641),
  desert('karakum', 1159104077),
  desert('kyzylkum', 1159104079),
  desert('syrian', 1159104075),
  desert('lut', 1159103653),
  desert('negev', 1159103261),
  desert('danakil', 1159103257),
  desert('betpak-dala', 1159104243),
]
