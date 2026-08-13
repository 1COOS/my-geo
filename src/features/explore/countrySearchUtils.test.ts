import { describe, expect, it } from 'vitest'

import { cities, countries } from '../../data/countries'
import { waterbodies } from '../../data/waterbodies'
import { searchCountries, searchPlaces } from './countrySearchUtils'

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

  it('finds cities, waterbodies, aliases, and country ISO values', () => {
    expect(
      searchPlaces(countries, cities, waterbodies, '上海')[0],
    ).toMatchObject({
      type: 'city',
      city: { id: 'cn-shanghai' },
    })
    expect(
      searchPlaces(countries, cities, waterbodies, 'Pacific')[0],
    ).toMatchObject({
      type: 'waterbody',
      waterbody: { id: 'pacific-ocean' },
    })
    expect(
      searchPlaces(countries, cities, waterbodies, 'La Manche')[0],
    ).toMatchObject({
      type: 'waterbody',
      waterbody: { id: 'english-channel' },
    })
    expect(searchPlaces(countries, cities, waterbodies, 'CN')[0]).toMatchObject(
      {
        type: 'country',
        country: { code: 'CN' },
      },
    )
  })
})
