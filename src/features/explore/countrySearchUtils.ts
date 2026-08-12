import type { Country } from '../../data/countrySchema'

export function normalizeCountrySearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export function searchCountries(
  countries: Country[],
  query: string,
  limit = 8,
) {
  const normalizedQuery = normalizeCountrySearch(query)

  return countries
    .map((country) => {
      const normalizedCode = country.code.toLowerCase()
      const normalizedZh = normalizeCountrySearch(country.name.zh)
      const normalizedEn = normalizeCountrySearch(country.name.en)

      let score = 10
      if (!normalizedQuery) score = country.featured ? 0 : 5
      else if (normalizedCode === normalizedQuery) score = 0
      else if (
        normalizedZh === normalizedQuery ||
        normalizedEn === normalizedQuery
      )
        score = 1
      else if (
        normalizedZh.startsWith(normalizedQuery) ||
        normalizedEn.startsWith(normalizedQuery)
      )
        score = 2
      else if (
        normalizedZh.includes(normalizedQuery) ||
        normalizedEn.includes(normalizedQuery)
      )
        score = 3

      return { country, score }
    })
    .filter(({ score }) => score < 10)
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.country.name.zh.localeCompare(right.country.name.zh, 'zh-CN'),
    )
    .slice(0, limit)
    .map(({ country }) => country)
}
