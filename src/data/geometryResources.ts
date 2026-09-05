import countryBoundariesUrl from './generated/country-boundaries.json?minified-url'
import desertGeometriesUrl from './generated/desert-geometries.json?minified-url'
import mountainGeometriesUrl from './generated/mountain-geometries.json?minified-url'
import riverGeometriesUrl from './generated/river-geometries.json?minified-url'
import territoryBoundariesUrl from './generated/territory-boundaries.json?minified-url'
import waterbodyGeometriesUrl from './generated/waterbody-geometries.json?minified-url'
import {
  countryBoundariesSchema,
  type CountryBoundaries,
} from './countrySchema'
import {
  desertGeometryCatalogSchema,
  type DesertGeometry,
} from './desertSchema'
import { getEmbeddedLinearFeatureGeometries } from './linearGeoFeatures'
import {
  linearGeoFeatureGeometryCatalogSchema,
  type LinearGeoFeatureGeometry,
} from './linearGeoFeatureSchema'
import {
  mountainRangeGeometryCatalogSchema,
  type MountainRangeGeometry,
} from './mountainRangeSchema'
import {
  territoryBoundaryCatalogSchema,
  type TerritoryBoundary,
} from './territorySchema'
import { getEmbeddedWaterbodyGeometries } from './waterbodies'
import {
  waterbodyGeometryCatalogSchema,
  type WaterbodyGeometry,
} from './waterbodySchema'

export type GeometryResourceKind =
  | 'country'
  | 'territory'
  | 'waterbody'
  | 'linearFeature'
  | 'mountain'
  | 'desert'

type Fetcher = typeof fetch

const geometryUrls: Record<GeometryResourceKind, string> = {
  country: countryBoundariesUrl,
  territory: territoryBoundariesUrl,
  waterbody: waterbodyGeometriesUrl,
  linearFeature: riverGeometriesUrl,
  mountain: mountainGeometriesUrl,
  desert: desertGeometriesUrl,
}

async function fetchJson(url: string, fetcher: Fetcher) {
  const response = await fetcher(url)
  if (!response.ok) {
    throw new Error(`Geometry request failed with ${response.status}: ${url}`)
  }
  return response.json() as Promise<unknown>
}

function createCachedLoader<T>(load: (fetcher: Fetcher) => Promise<T>) {
  let cached: Promise<T> | null = null
  return {
    load(fetcher: Fetcher = fetch) {
      cached ??= load(fetcher).catch((error: unknown) => {
        cached = null
        throw error
      })
      return cached
    },
    reset() {
      cached = null
    },
  }
}

const countryLoader = createCachedLoader(async (fetcher) =>
  countryBoundariesSchema.parse(await fetchJson(countryBoundariesUrl, fetcher)),
)

const territoryLoader = createCachedLoader(async (fetcher) =>
  territoryBoundaryCatalogSchema.parse(
    await fetchJson(territoryBoundariesUrl, fetcher),
  ),
)

const waterbodyLoader = createCachedLoader(async (fetcher) =>
  waterbodyGeometryCatalogSchema.parse([
    ...((await fetchJson(waterbodyGeometriesUrl, fetcher)) as unknown[]),
    ...getEmbeddedWaterbodyGeometries(),
  ]),
)

const linearFeatureLoader = createCachedLoader(async (fetcher) =>
  linearGeoFeatureGeometryCatalogSchema.parse([
    ...((await fetchJson(riverGeometriesUrl, fetcher)) as unknown[]),
    ...getEmbeddedLinearFeatureGeometries(),
  ]),
)

const mountainLoader = createCachedLoader(async (fetcher) =>
  mountainRangeGeometryCatalogSchema.parse(
    await fetchJson(mountainGeometriesUrl, fetcher),
  ),
)

const desertLoader = createCachedLoader(async (fetcher) =>
  desertGeometryCatalogSchema.parse(
    await fetchJson(desertGeometriesUrl, fetcher),
  ),
)

export function loadCountryBoundaries(fetcher?: Fetcher) {
  return countryLoader.load(fetcher)
}

export function loadTerritoryBoundaries(fetcher?: Fetcher) {
  return territoryLoader.load(fetcher)
}

export function loadWaterbodyGeometries(fetcher?: Fetcher) {
  return waterbodyLoader.load(fetcher)
}

export function loadLinearFeatureGeometries(fetcher?: Fetcher) {
  return linearFeatureLoader.load(fetcher)
}

export function loadMountainGeometries(fetcher?: Fetcher) {
  return mountainLoader.load(fetcher)
}

export function loadDesertGeometries(fetcher?: Fetcher) {
  return desertLoader.load(fetcher)
}

export async function prefetchGeometryAssets(
  kinds: readonly GeometryResourceKind[] = [
    'country',
    'waterbody',
    'linearFeature',
    'mountain',
    'desert',
  ],
  fetcher: Fetcher = fetch,
) {
  await Promise.allSettled(
    kinds.map(async (kind) => {
      const response = await fetcher(geometryUrls[kind])
      if (!response.ok) return
      await response.arrayBuffer()
    }),
  )
}

export type LoadedGeometryResources = {
  countryBoundaries: CountryBoundaries | null
  territoryBoundaries: TerritoryBoundary[] | null
  waterbodyGeometries: WaterbodyGeometry[] | null
  linearFeatureGeometries: LinearGeoFeatureGeometry[] | null
  mountainGeometries: MountainRangeGeometry[] | null
  desertGeometries: DesertGeometry[] | null
}

export function resetGeometryResourceCachesForTests() {
  countryLoader.reset()
  territoryLoader.reset()
  waterbodyLoader.reset()
  linearFeatureLoader.reset()
  mountainLoader.reset()
  desertLoader.reset()
}
