import { describe, expect, it } from 'vitest'

import { countries, countryBoundaries, countrySourcesById } from './countries'

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
  })
})
