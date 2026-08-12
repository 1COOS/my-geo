import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import prettier from 'prettier'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import countriesSource from 'world-countries'

import {
  adjacentRegionNames,
  capitalChineseNames,
  capitalCoordinateOverrides,
  capitalNameAliases,
  countryCurrencyOverrides,
  currencyOverrides,
  featuredCountryContent,
  FEATURED_COUNTRY_CODES,
  languageChineseNameOverrides,
  subregionChineseNames,
} from './country-content'
import { countrySources } from './country-sources'
import {
  countryBoundariesSchema,
  countryCatalogSchema,
  countrySourceRegistrySchema,
  type Country,
} from '../src/data/countrySchema'

type CitySource = {
  city: string
  city_ascii: string
  lat: string
  lng: string
  iso2: string
  capital: string
}

type SourceFeature = {
  type: 'Feature'
  id?: string | number
  properties: Record<string, unknown>
  geometry: {
    type: string
    coordinates: unknown[]
  } | null
}

const projectRoot = path.resolve(import.meta.dirname, '..')
const generatedDirectory = path.join(projectRoot, 'src/data/generated')
const flagsDirectory = path.join(projectRoot, 'public/flags')

const continentNames: Record<string, { zh: string; en: string }> = {
  Africa: { zh: '非洲', en: 'Africa' },
  Americas: { zh: '美洲', en: 'Americas' },
  Asia: { zh: '亚洲', en: 'Asia' },
  Europe: { zh: '欧洲', en: 'Europe' },
  Oceania: { zh: '大洋洲', en: 'Oceania' },
}

const languageDisplayNames = new Intl.DisplayNames(['zh-CN'], {
  type: 'language',
})
const currencyDisplayNames = new Intl.DisplayNames(['zh-CN'], {
  type: 'currency',
})

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

async function writeFormattedJson(filePath: string, value: unknown) {
  const formatted = await prettier.format(JSON.stringify(value), {
    parser: 'json',
  })
  await writeFile(filePath, formatted)
}

const citySource = await readJson<CitySource[]>(
  path.join(projectRoot, 'node_modules/world-cities-json/data/cities.json'),
)

const topology = await readJson<
  Topology<{ countries: GeometryCollection<Record<string, unknown>> }>
>(path.join(projectRoot, 'node_modules/world-atlas/countries-110m.json'))

const rawFeatureCollection = feature(
  topology,
  topology.objects.countries,
) as unknown as { type: 'FeatureCollection'; features: SourceFeature[] }

const sourceCountries = countriesSource
  .filter((country) => country.unMember || country.cca2 === 'PS')
  .sort((left, right) => left.cca2.localeCompare(right.cca2))

const targetNumericCodes = new Set(
  sourceCountries.map((country) => country.ccn3.padStart(3, '0')),
)

const availableGeometryCodes = new Set(
  rawFeatureCollection.features
    .map((countryFeature) => String(countryFeature.id).padStart(3, '0'))
    .filter((numericCode) => targetNumericCodes.has(numericCode)),
)

function findCapital(
  countryCode: string,
  capitalName: string,
): { latitude: number; longitude: number } {
  const coordinateOverride =
    capitalCoordinateOverrides[`${countryCode}:${capitalName}`]
  if (coordinateOverride) return coordinateOverride

  const alias =
    capitalNameAliases[`${countryCode}:${capitalName}`] ?? capitalName
  const normalizedAlias = normalizeName(alias)
  const matchingCity = citySource.find(
    (city) =>
      city.iso2 === countryCode &&
      (normalizeName(city.city) === normalizedAlias ||
        normalizeName(city.city_ascii) === normalizedAlias),
  )

  if (!matchingCity) {
    throw new Error(
      `Missing capital coordinates for ${countryCode}:${capitalName}`,
    )
  }

  return {
    latitude: Number(matchingCity.lat),
    longitude: Number(matchingCity.lng),
  }
}

function getChineseDisplayName(
  type: 'language' | 'currency',
  code: string,
  overrides: Record<string, string>,
) {
  const overridden = overrides[code]
  if (overridden) return overridden
  const displayNames =
    type === 'language' ? languageDisplayNames : currencyDisplayNames
  const displayed = displayNames.of(code)
  if (!displayed || displayed === code) {
    throw new Error(`Missing Chinese ${type} name for ${code}`)
  }
  return displayed
}

function generatedHighlight(
  countryName: string,
  area: number,
  landlocked: boolean,
  borderCount: number,
) {
  if (landlocked) {
    return `${countryName}是一个内陆国家，不直接濒临海洋，并与${borderCount}个主权国家接壤。`
  }
  if (borderCount === 0) {
    return `${countryName}没有陆地国界，国土面积约为${Math.round(area).toLocaleString('zh-CN')}平方千米。`
  }
  return `${countryName}拥有海岸线，并与${borderCount}个主权国家接壤，国土面积约为${Math.round(area).toLocaleString('zh-CN')}平方千米。`
}

const featuredCodes = new Set<string>(FEATURED_COUNTRY_CODES)
const sovereignCountryCodesByAlpha3 = new Map(
  sourceCountries.map((country) => [country.cca3, country.cca2]),
)

const countries: Country[] = sourceCountries.map((country) => {
  const featuredContent = featuredCodes.has(country.cca2)
    ? featuredCountryContent[
        country.cca2 as (typeof FEATURED_COUNTRY_CODES)[number]
      ]
    : undefined

  const subregionZh = subregionChineseNames[country.subregion]
  if (!subregionZh) {
    throw new Error(`Missing Chinese subregion name for ${country.subregion}`)
  }

  const borderCountryCodes = country.borders.flatMap((borderCode) => {
    const countryCode = sovereignCountryCodesByAlpha3.get(borderCode)
    return countryCode ? [countryCode] : []
  })
  const adjacentRegions = country.borders.flatMap((borderCode) => {
    const name =
      adjacentRegionNames[borderCode as keyof typeof adjacentRegionNames]
    return name
      ? [
          {
            code: borderCode as keyof typeof adjacentRegionNames,
            kind: 'region' as const,
            name,
          },
        ]
      : []
  })
  const unresolvedBorders = country.borders.filter(
    (borderCode) =>
      !sovereignCountryCodesByAlpha3.has(borderCode) &&
      !(borderCode in adjacentRegionNames),
  )
  if (unresolvedBorders.length) {
    throw new Error(
      `Unresolved border codes for ${country.cca2}: ${unresolvedBorders.join(', ')}`,
    )
  }

  const sourceCurrencies =
    Object.keys(country.currencies).length > 0
      ? country.currencies
      : countryCurrencyOverrides[country.cca2]
  if (!sourceCurrencies || Object.keys(sourceCurrencies).length === 0) {
    throw new Error(`Missing currencies for ${country.cca2}`)
  }

  const baseCountry = {
    code: country.cca2,
    alpha3Code: country.cca3,
    numericCode: country.ccn3.padStart(3, '0'),
    name: {
      zh: country.translations.zho.common,
      en: country.name.common,
    },
    officialName: {
      zh: country.translations.zho.official,
      en: country.name.official,
    },
    continent: continentNames[country.region],
    subregion: { zh: subregionZh, en: country.subregion },
    center: {
      latitude: country.latlng[0],
      longitude: country.latlng[1],
    },
    capitals: country.capital.map((capitalName) => ({
      name: {
        zh: capitalChineseNames[`${country.cca2}:${capitalName}`],
        en: capitalName,
      },
      ...findCapital(country.cca2, capitalName),
    })),
    languages: Object.entries(country.languages).map(([code, name]) => ({
      code,
      name: {
        zh: getChineseDisplayName(
          'language',
          code,
          languageChineseNameOverrides,
        ),
        en: name,
      },
    })),
    currencies: Object.entries(sourceCurrencies).map(([code, currency]) => {
      const override = currencyOverrides[code]
      return {
        code,
        symbol: override?.symbol ?? currency.symbol,
        name: override?.name ?? {
          zh: getChineseDisplayName('currency', code, {}),
          en: currency.name,
        },
      }
    }),
    areaSquareKilometers: country.area,
    landlocked: country.landlocked,
    borderCountryCodes,
    adjacentRegions,
    flagAsset: `/flags/${country.cca2.toLowerCase()}.svg`,
    hasGeometry: availableGeometryCodes.has(country.ccn3.padStart(3, '0')),
  }

  for (const capital of baseCountry.capitals) {
    if (!capital.name.zh) {
      throw new Error(
        `Missing Chinese capital name for ${country.cca2}:${capital.name.en}`,
      )
    }
  }

  return featuredContent
    ? { ...baseCountry, featured: true as const, ...featuredContent }
    : {
        ...baseCountry,
        featured: false as const,
        highlights: [
          {
            text: generatedHighlight(
              country.translations.zho.common,
              country.area,
              country.landlocked,
              borderCountryCodes.length,
            ),
            sourceIds: ['world-countries'],
          },
        ] as const,
      }
})

const countriesByNumericCode = new Map(
  countries.map((country) => [country.numericCode, country]),
)

const boundaries = {
  type: 'FeatureCollection' as const,
  features: rawFeatureCollection.features.flatMap((sourceFeature) => {
    const numericCode = String(sourceFeature.id).padStart(3, '0')
    const country = countriesByNumericCode.get(numericCode)
    if (!country || !sourceFeature.geometry) return []
    if (
      sourceFeature.geometry.type !== 'Polygon' &&
      sourceFeature.geometry.type !== 'MultiPolygon'
    ) {
      return []
    }

    return [
      {
        type: 'Feature' as const,
        properties: {
          code: country.code,
          nameZh: country.name.zh,
          nameEn: country.name.en,
        },
        geometry: {
          type: sourceFeature.geometry.type,
          coordinates: sourceFeature.geometry.coordinates,
        },
      },
    ]
  }),
}

countryCatalogSchema.parse(countries)
countryBoundariesSchema.parse(boundaries)
countrySourceRegistrySchema.parse(countrySources)

await mkdir(generatedDirectory, { recursive: true })
await rm(flagsDirectory, { recursive: true, force: true })
await mkdir(flagsDirectory, { recursive: true })

await writeFormattedJson(
  path.join(generatedDirectory, 'countries.json'),
  countries,
)
await writeFormattedJson(
  path.join(generatedDirectory, 'country-sources.json'),
  countrySources,
)
await writeFormattedJson(
  path.join(generatedDirectory, 'country-boundaries.json'),
  boundaries,
)

await Promise.all(
  countries.map((country) =>
    cp(
      path.join(
        projectRoot,
        `node_modules/flag-icons/flags/4x3/${country.code.toLowerCase()}.svg`,
      ),
      path.join(flagsDirectory, `${country.code.toLowerCase()}.svg`),
    ),
  ),
)

console.log(
  `Generated ${countries.length} countries, ${boundaries.features.length} boundaries, and ${countries.length} local flags.`,
)
