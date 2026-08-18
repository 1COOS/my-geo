import { describe, expect, it } from 'vitest'

import { cities, countries } from '../../data/countries'
import { climateLearningTopic, climateTypes } from '../../data/climateLearning'
import { deserts } from '../../data/deserts'
import { linearGeoFeatures } from '../../data/linearGeoFeatures'
import { landmarks } from '../../data/landmarks'
import { mountainRanges } from '../../data/mountainRanges'
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
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        '上海',
      )[0],
    ).toMatchObject({
      type: 'city',
      city: { id: 'cn-shanghai' },
    })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        'Pacific',
      )[0],
    ).toMatchObject({
      type: 'waterbody',
      waterbody: { id: 'pacific-ocean' },
    })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        '渤海',
      )[0],
    ).toMatchObject({
      type: 'waterbody',
      waterbody: { id: 'bohai-sea' },
    })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        'La Manche',
      )[0],
    ).toMatchObject({
      type: 'waterbody',
      waterbody: { id: 'english-channel' },
    })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        'Baikal',
      )[0],
    ).toMatchObject({
      type: 'waterbody',
      waterbody: { id: 'lake-baikal', layer: 'lake' },
    })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        'CN',
      )[0],
    ).toMatchObject({
      type: 'country',
      country: { code: 'CN' },
    })
  })

  it('finds river systems and canals by names and traversed countries', () => {
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        '长江',
      )[0],
    ).toMatchObject({
      type: 'linearFeature',
      feature: { id: 'yangtze-system', kind: 'river' },
    })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        'Suez',
      )[0],
    ).toMatchObject({
      type: 'linearFeature',
      feature: { id: 'suez-canal', kind: 'canal' },
    })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        '中国大运河',
      )[0],
    ).toMatchObject({
      type: 'linearFeature',
      feature: {
        id: 'grand-canal-china',
        name: { zh: '京杭大运河' },
      },
    })
  })

  it('finds mountain ranges by range names, peaks, and countries', () => {
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        '喜马拉雅',
      )[0],
    ).toMatchObject({ type: 'mountainRange', range: { id: 'himalayas' } })
    expect(
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        'Everest',
      )[0],
    ).toMatchObject({ type: 'mountainRange', range: { id: 'himalayas' } })
  })

  it('finds deserts by Chinese, English, alias, and landscape names', () => {
    for (const [query, id] of [
      ['撒哈拉', 'sahara'],
      ['Gobi', 'gobi'],
      ['Empty Quarter', 'rub-al-khali'],
      ['雅丹', 'lut'],
    ] as const) {
      expect(
        searchPlaces(
          countries,
          cities,
          waterbodies,
          linearGeoFeatures,
          mountainRanges,
          query,
          8,
          deserts,
        )[0],
      ).toMatchObject({ type: 'desert', desert: { id } })
    }
  })

  it('finds landmarks by Chinese, English, alias, and location names', () => {
    for (const [query, id] of [
      ['长城', 'great-wall'],
      ['Taj Mahal', 'taj-mahal'],
      ['白鹭城', 'himeji-castle'],
      ['Wiltshire', 'stonehenge'],
    ] as const) {
      expect(
        searchPlaces(
          countries,
          cities,
          waterbodies,
          linearGeoFeatures,
          mountainRanges,
          query,
          8,
          deserts,
          landmarks,
        )[0],
      ).toMatchObject({ type: 'landmark', landmark: { id } })
    }

    const countryResults = searchPlaces(
      countries,
      cities,
      waterbodies,
      linearGeoFeatures,
      mountainRanges,
      '柬埔寨',
      8,
      deserts,
      landmarks,
    )
    expect(
      countryResults.some(
        (result) =>
          result.type === 'landmark' && result.landmark.id === 'angkor-wat',
      ),
    ).toBe(true)
  })

  it('finds the climate overview and all 13 climate type cards', () => {
    const argumentsBeforeClimate = [
      countries,
      cities,
      waterbodies,
      linearGeoFeatures,
      mountainRanges,
    ] as const
    expect(
      searchPlaces(
        ...argumentsBeforeClimate,
        '世界气候类型',
        8,
        deserts,
        landmarks,
        [],
        [],
        climateLearningTopic,
        climateTypes,
      )[0],
    ).toMatchObject({ type: 'climateTopic' })
    expect(
      searchPlaces(
        ...argumentsBeforeClimate,
        '夏干冬雨',
        8,
        deserts,
        landmarks,
        [],
        [],
        climateLearningTopic,
        climateTypes,
      )[0],
    ).toMatchObject({
      type: 'climateType',
      climateType: { id: 'mediterranean' },
    })
  })
})
