import boundariesJson from './generated/country-boundaries.json'
import countrySourcesJson from './generated/country-sources.json'
import countriesJson from './generated/countries.json'
import {
  countryBoundariesSchema,
  countryCatalogSchema,
  countrySourceRegistrySchema,
  type Country,
} from './countrySchema'

export const countries = countryCatalogSchema.parse(countriesJson)
export const countryBoundaries = countryBoundariesSchema.parse(boundariesJson)
export const countrySources =
  countrySourceRegistrySchema.parse(countrySourcesJson)

export const countriesByCode = new Map(
  countries.map((country) => [country.code, country]),
)
export const countrySourcesById = new Map(
  countrySources.map((source) => [source.id, source]),
)

export function getCountry(
  code: string | null | undefined,
): Country | undefined {
  return code ? countriesByCode.get(code) : undefined
}

export function getCountrySource(id: string) {
  return countrySourcesById.get(id)
}
