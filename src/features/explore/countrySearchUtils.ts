import type { City } from '../../data/citySchema'
import type { Country } from '../../data/countrySchema'
import type { Waterbody } from '../../data/waterbodySchema'

export type PlaceSearchResult =
  | { type: 'country'; country: Country }
  | { type: 'city'; city: City; country: Country }
  | { type: 'waterbody'; waterbody: Waterbody }

export function normalizeCountrySearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

function matchScore(values: string[], query: string) {
  const normalizedValues = values.map(normalizeCountrySearch)
  if (normalizedValues.some((value) => value === query)) return 0
  if (normalizedValues.some((value) => value.startsWith(query))) return 1
  if (normalizedValues.some((value) => value.includes(query))) return 2
  return 10
}

export function searchPlaces(
  countries: Country[],
  cities: City[],
  waterbodies: Waterbody[],
  query: string,
  limit = 8,
): PlaceSearchResult[] {
  const normalizedQuery = normalizeCountrySearch(query)
  if (!normalizedQuery) {
    return countries
      .filter((country) => country.featured)
      .slice(0, limit)
      .map((country) => ({ type: 'country', country }))
  }

  const countriesByCode = new Map(
    countries.map((country) => [country.code, country]),
  )
  const scored: { result: PlaceSearchResult; score: number; name: string }[] =
    []

  for (const country of countries) {
    const score = matchScore(
      [country.code, country.alpha3Code, country.name.zh, country.name.en],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'country', country },
        score,
        name: country.name.zh,
      })
    }
  }

  for (const city of cities) {
    const country = countriesByCode.get(city.countryCode)
    if (!country) continue
    const score = matchScore(
      [
        city.name.zh,
        city.name.en,
        country.code,
        country.name.zh,
        country.name.en,
      ],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'city', city, country },
        score: score + 0.2,
        name: city.name.zh,
      })
    }
  }

  for (const waterbody of waterbodies) {
    const score = matchScore(
      [waterbody.name.zh, waterbody.name.en, ...waterbody.aliases],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'waterbody', waterbody },
        score: score + 0.1,
        name: waterbody.name.zh,
      })
    }
  }

  return scored
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.name.localeCompare(right.name, 'zh-CN'),
    )
    .slice(0, limit)
    .map(({ result }) => result)
}

export function searchCountries(
  countries: Country[],
  query: string,
  limit = 8,
) {
  return searchPlaces(countries, [], [], query, limit).flatMap((result) =>
    result.type === 'country' ? [result.country] : [],
  )
}
