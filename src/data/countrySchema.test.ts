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
      if (country.flagDetails) {
        expect(country.flagDetails.sourceIds).toEqual(['cia-world-factbook'])
        for (const value of [
          country.flagDetails.description,
          country.flagDetails.meaning,
          country.flagDetails.history,
        ]) {
          if (value) expect(value).toMatch(/\p{Script=Han}/u)
        }
      }

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

  it('ships complete translated Factbook flag sections', () => {
    expect(
      countries.filter((country) => country.flagDetails?.description),
    ).toHaveLength(194)
    expect(
      countries.filter((country) => country.flagDetails?.meaning),
    ).toHaveLength(171)
    expect(
      countries.filter((country) => country.flagDetails?.history),
    ).toHaveLength(56)

    const china = countries.find((country) => country.code === 'CN')!
    expect(china.flagDetails?.meaning).toContain('四个社会阶级')
    expect(china.flagDetails?.meaning).toContain('城市小资产阶级')

    const brazil = countries.find((country) => country.code === 'BR')!
    expect(brazil.flagDetails?.meaning).toContain('27 颗')
    expect(brazil.flagDetails?.history).toContain('巴西帝国旧国旗')

    const antigua = countries.find((country) => country.code === 'AG')!
    expect(antigua.flagDetails?.meaning).toContain('阳光、大海和沙滩')

    const japan = countries.find((country) => country.code === 'JP')!
    expect(japan.flagDetails?.description).toContain('红色大圆盘')
    expect(japan.flagDetails?.meaning).toBeNull()
    expect(japan.flagDetails?.history).toContain('1854')

    const palestine = countries.find((country) => country.code === 'PS')!
    expect(palestine.flagDetails).toBeNull()
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

  it('provides sourced profiles with optional reviewed signatures', () => {
    const signatureCountries = countries.filter(
      (country) => country.profile.signature,
    )
    expect(signatureCountries.length).toBeGreaterThan(0)

    for (const country of countries) {
      const sourceIds = [
        ...country.profile.resources.sourceIds,
        ...country.profile.people.sourceIds,
        ...country.profile.economy.sourceIds,
        ...(country.profile.signature?.flatMap((item) => item.sourceIds) ?? []),
      ]
      expect(
        sourceIds.every((sourceId) => countrySourcesById.has(sourceId)),
      ).toBe(true)

      if (country.profile.signature) {
        expect(country.profile.signature.length).toBeGreaterThanOrEqual(1)
        expect(
          new Set(country.profile.signature.map((item) => item.title)).size,
        ).toBe(country.profile.signature.length)
      }
    }
  })

  it('repairs known profile defects and uses concrete signature titles', () => {
    const afghanistan = countries.find((country) => country.code === 'AF')!
    expect(
      afghanistan.profile.people.religions.map((item) => item.name),
    ).toEqual(['伊斯兰教', '什叶派'])

    const russia = countries.find((country) => country.code === 'RU')!
    expect(russia.profile.people.religions.map((item) => item.name)).toEqual([
      '俄罗斯东正教',
      '伊斯兰教',
    ])

    const algeria = countries.find((country) => country.code === 'DZ')!
    expect(
      algeria.profile.people.ethnicGroups.map((item) => item.name),
    ).toEqual(['阿拉伯人', '阿马齐格人'])
    expect(algeria.profile.people.religions.map((item) => item.name)).toEqual([
      '伊斯兰教',
    ])

    const mali = countries.find((country) => country.code === 'ML')!
    expect(mali.profile.people.religions.map((item) => item.name)).toEqual([
      '伊斯兰教',
      '基督教',
    ])
    const guinea = countries.find((country) => country.code === 'GN')!
    expect(guinea.profile.people.religions.map((item) => item.name)).toEqual([
      '伊斯兰教',
      '基督教',
    ])
    const cameroon = countries.find((country) => country.code === 'CM')!
    expect(
      cameroon.profile.people.religions.map((item) => item.name),
    ).toContain('泛灵信仰')

    const demographicNames = countries.flatMap((country) => [
      ...country.profile.people.ethnicGroups.map((item) => item.name),
      ...country.profile.people.religions.map((item) => item.name),
    ])
    expect(demographicNames.join('\n')).not.toMatch(
      /动画家|动画主义|不到|未具体说明|未表示|未指明|未归属|无神论者|不可知论者|拒绝回答/,
    )

    const australia = countries.find((country) => country.code === 'AU')!
    expect(australia.profile.signature?.map((item) => item.title)).toEqual(
      expect.arrayContaining(['袋鼠', '考拉', '鸭嘴兽', '大堡礁']),
    )

    const allSignatureTitles = countries.flatMap(
      (country) => country.profile.signature?.map((item) => item.title) ?? [],
    )
    expect(allSignatureTitles).not.toContain('地理名片')
    expect(allSignatureTitles).not.toContain('大陆国家')
    expect(allSignatureTitles).not.toContain('独特动物')
  })

  it('rebuilds complete critical resources from the pinned source', () => {
    const resources = (code: string) =>
      countries
        .find((country) => country.code === code)!
        .profile.resources.groups.flatMap((group) => group.items)

    expect(resources('RU')).toEqual(
      expect.arrayContaining([
        '石油',
        '天然气',
        '煤',
        '铝土矿',
        '稀土',
        '木材',
      ]),
    )
    expect(resources('US')).toEqual(
      expect.arrayContaining(['石油', '天然气', '煤', '铀', '木材', '耕地']),
    )
    expect(resources('CA')).toEqual(
      expect.arrayContaining([
        '石油',
        '天然气',
        '煤',
        '水电',
        '铀',
        '木材',
        '渔业资源',
      ]),
    )
    expect(resources('CN')).toEqual(
      expect.arrayContaining(['石油', '天然气', '煤', '铀', '水电', '耕地']),
    )
    expect(resources('JP')).toEqual(['渔业资源'])
    expect(resources('KH')).toEqual(expect.arrayContaining(['石油', '天然气']))
    expect(resources('VN')).toEqual(expect.arrayContaining(['石油', '天然气']))
    expect(resources('TJ')).toContain('褐煤')
    expect(resources('TJ')).not.toContain('煤')
    expect(resources('AD')).toContain('矿泉水')
    expect(resources('AD')).not.toContain('水资源')
    expect(resources('KI')).not.toContain('磷酸盐')
    expect(resources('LU')).not.toContain('铁矿石')
    expect(resources('PW')).toEqual(
      expect.arrayContaining(['黄金', '深海矿产']),
    )

    const chinaMinerals = countries
      .find((country) => country.code === 'CN')!
      .profile.resources.groups.find((group) => group.label === '矿产')!.items
    expect(chinaMinerals.length).toBeGreaterThan(5)
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

  it('keeps Antarctica as a validated non-country landmass', () => {
    expect(countryBoundaries.landmasses).toHaveLength(1)
    const [antarctica] = countryBoundaries.landmasses

    expect(antarctica.properties).toEqual({
      id: 'antarctica',
      nameZh: '南极洲',
      nameEn: 'Antarctica',
    })
    expect(geoContains(antarctica as never, [0, -85])).toBe(true)
    expect(countries.some((country) => country.code === 'AQ')).toBe(false)
    expect(
      countryBoundaries.features.some(
        (feature) => feature.properties.code === 'AQ',
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
