import citiesJson from './generated/cities.json'
import countrySourcesJson from './generated/country-sources.json'
import countriesJson from './generated/countries.json'
import {
  countryCatalogSchema,
  countrySourceRegistrySchema,
  type Country,
} from './countrySchema'
import { cityCatalogSchema } from './citySchema'

export const countries = countryCatalogSchema.parse(countriesJson)
export const cities = cityCatalogSchema.parse(citiesJson)
export const countrySources =
  countrySourceRegistrySchema.parse(countrySourcesJson)

export const countriesByCode = new Map(
  countries.map((country) => [country.code, country]),
)
export const citiesById = new Map(cities.map((city) => [city.id, city]))
export const citiesByCountryCode = new Map<string, (typeof cities)[number][]>()
for (const city of cities) {
  const countryCities = citiesByCountryCode.get(city.countryCode) ?? []
  countryCities.push(city)
  citiesByCountryCode.set(city.countryCode, countryCities)
}
export const capitalCities = cities.filter((city) => city.isCapital)
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

export function getCity(id: string | null | undefined) {
  return id ? citiesById.get(id) : undefined
}

export function getCitiesForCountry(countryCode: string | null | undefined) {
  return countryCode ? (citiesByCountryCode.get(countryCode) ?? []) : []
}
