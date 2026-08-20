import { describe, expect, it } from 'vitest'
import { geoContains } from 'd3-geo'

import {
  capitalCities,
  cities,
  countries,
  countrySourcesById,
  getCitiesForCountry,
} from './countries'
import { countryBoundaries } from './geometryData'

const expectedFeaturedCodes = [
  'AU',
  'BR',
  'CN',
  'EG',
  'FR',
  'ID',
  'IN',
  'JP',
  'MX',
  'RU',
  'US',
  'ZA',
]
const allowedRegionCodes = ['ESH', 'GIB', 'GUF', 'HKG', 'MAC', 'UNK']

describe('generated country catalogue', () => {
  it('contains exactly 195 unique sovereign-country codes', () => {
    expect(countries).toHaveLength(195)
    expect(new Set(countries.map((country) => country.code)).size).toBe(195)
  })

  it('provides complete localized knowledge-card data for every country', () => {
    for (const country of countries) {
      expect(country.officialName.zh).not.toBe(country.officialName.en)
      expect(country.subregion.zh).toBeTruthy()
      expect(country.alpha3Code).toMatch(/^[A-Z]{3}$/)
      expect(country.areaSquareKilometers).toBeGreaterThan(0)
      expect(country.population).toBeGreaterThan(0)
      expect(country.populationYear).toBeGreaterThanOrEqual(2024)
      expect(countrySourcesById.has(country.populationSourceId)).toBe(true)
      expect(country.languages.length).toBeGreaterThan(0)
      expect(country.currencies.length).toBeGreaterThan(0)
      expect(country.flagAsset).toMatch(/^\/flags\/[a-z]{2}\.svg$/)

      for (const capital of country.capitals) {
        expect(capital.name.zh).toBeTruthy()
        expect(capital.name.zh).not.toBe(capital.name.en)
        expect(capital.latitude).toBeGreaterThanOrEqual(-90)
        expect(capital.latitude).toBeLessThanOrEqual(90)
        expect(capital.longitude).toBeGreaterThanOrEqual(-180)
        expect(capital.longitude).toBeLessThanOrEqual(180)
      }

      for (const language of country.languages) {
        expect(language.name.zh).not.toBe(language.code)
      }
      for (const currency of country.currencies) {
        expect(currency.name.zh).not.toBe(currency.code)
      }
    }
  })

  it('contains the fixed 12 featured countries with three sourced highlights', () => {
    const featuredCountries = countries.filter((country) => country.featured)

    expect(featuredCountries.map((country) => country.code).sort()).toEqual(
      expectedFeaturedCodes,
    )

    for (const country of countries) {
      expect(country.highlights).toHaveLength(country.featured ? 3 : 1)
      for (const highlight of country.highlights) {
        expect(highlight.sourceIds.length).toBeGreaterThan(0)
        for (const sourceId of highlight.sourceIds) {
          expect(countrySourcesById.has(sourceId)).toBe(true)
        }
      }
    }
  })

  it('separates sovereign borders from the approved adjacent regions', () => {
    const countryCodes = new Set(countries.map((country) => country.code))
    for (const country of countries) {
      expect(
        country.borderCountryCodes.every((code) => countryCodes.has(code)),
      ).toBe(true)
      expect(
        country.adjacentRegions.every((region) =>
          allowedRegionCodes.includes(region.code),
        ),
      ).toBe(true)
    }

    const china = countries.find((country) => country.code === 'CN')
    expect(china?.adjacentRegions.map((region) => region.name.zh)).toEqual([
      '中国香港',
      '中国澳门',
    ])
  })

  it('maps geometry availability to the generated Natural Earth features', () => {
    const boundaryCodes = new Set(
      countryBoundaries.features.map((feature) => feature.properties.code),
    )

    expect(countryBoundaries.features).toHaveLength(166)
    for (const country of countries) {
      expect(country.hasGeometry).toBe(boundaryCodes.has(country.code))
    }

    expect(
      countries.find((country) => country.code === 'VA')?.hasGeometry,
    ).toBe(false)
    const chinaBoundary = countryBoundaries.features.find(
      (feature) => feature.properties.code === 'CN',
    )
    expect(chinaBoundary?.geometry.type).toBe('MultiPolygon')
    expect(
      chinaBoundary?.geometry.type === 'MultiPolygon' &&
        chinaBoundary.geometry.coordinates.length,
    ).toBe(3)
    expect(geoContains(chinaBoundary as never, [121, 23.7])).toBe(true)
    expect(countries.some((country) => country.code === 'TW')).toBe(false)
    expect(
      countryBoundaries.features.some(
        (feature) => feature.properties.code === 'TW',
      ),
    ).toBe(false)
  })

  it('contains every authoritative capital and the reviewed priority-city allocation', () => {
    expect(capitalCities).toHaveLength(197)
    expect(cities).toHaveLength(338)
    expect(new Set(cities.map((city) => city.id)).size).toBe(cities.length)

    const expectedCounts = {
      CN: 5,
      IN: 5,
      US: 5,
      JP: 5,
      SG: 1,
      ZA: 4,
      NZ: 3,
    }
    for (const [countryCode, count] of Object.entries(expectedCounts)) {
      expect(getCitiesForCountry(countryCode)).toHaveLength(count)
    }

    expect(getCitiesForCountry('CN').map((city) => city.name.zh)).toEqual([
      '北京',
      '上海',
      '广州',
      '深圳',
      '成都',
    ])
    expect(getCitiesForCountry('VA')).toHaveLength(1)
    expect(getCitiesForCountry('VA')[0]?.isCapital).toBe(true)
  })

  it('keeps reviewed city sources, coordinates, reasons, and country orders valid', () => {
    for (const city of cities) {
      expect(city.latitude).toBeGreaterThanOrEqual(-90)
      expect(city.latitude).toBeLessThanOrEqual(90)
      expect(city.longitude).toBeGreaterThanOrEqual(-180)
      expect(city.longitude).toBeLessThanOrEqual(180)
      expect(city.name.zh).toBeTruthy()
      expect(city.name.en).toBeTruthy()
      expect(city.reasons.length).toBeGreaterThan(0)
      for (const sourceId of city.sourceIds) {
        expect(countrySourcesById.has(sourceId)).toBe(true)
      }
    }

    for (const country of countries) {
      expect(
        getCitiesForCountry(country.code).map((city) => city.order),
      ).toEqual(
        getCitiesForCountry(country.code).map((_city, index) => index + 1),
      )
    }
  })
})
