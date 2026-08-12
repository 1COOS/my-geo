import { describe, expect, it } from 'vitest'

import { countries } from '../../data/countries'
import { searchCountries } from './countrySearchUtils'

describe('searchCountries', () => {
  it.each([
    ['中国', 'CN'],
    ['China', 'CN'],
    ['cn', 'CN'],
    ['Vatican', 'VA'],
    ['梵蒂冈', 'VA'],
  ])('finds %s as %s', (query, expectedCode) => {
    expect(searchCountries(countries, query)[0]?.code).toBe(expectedCode)
  })

  it('shows featured countries for an empty query', () => {
    expect(searchCountries(countries, '')).toHaveLength(8)
    expect(
      searchCountries(countries, '').every((country) => country.featured),
    ).toBe(true)
  })
})
