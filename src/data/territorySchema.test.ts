import { describe, expect, it } from 'vitest'
import { geoContains } from 'd3-geo'

import { countriesByCode } from './countries'
import territoryBoundariesJson from './generated/territory-boundaries.json'
import {
  getTerritoriesForCountry,
  territories,
  territorySources,
} from './territories'
import { territoryBoundaryCatalogSchema } from './territorySchema'

describe('reviewed territory catalogue', () => {
  it('contains the fixed nine representative overseas regions', () => {
    expect(territories).toHaveLength(9)
    expect(territories.map((item) => item.id)).toEqual([
      'greenland',
      'faroe-islands',
      'gibraltar',
      'bermuda',
      'puerto-rico',
      'guam',
      'french-guiana',
      'french-polynesia',
      'new-caledonia',
    ])
    expect(new Set(territories.map((item) => item.code)).size).toBe(9)
  })

  it('keeps every administering state and cited source valid', () => {
    const sourceIds = new Set(territorySources.map((source) => source.id))
    for (const territory of territories) {
      expect(countriesByCode.has(territory.administeringCountryCode)).toBe(true)
      expect(
        [
          ...territory.sourceIds,
          ...territory.geography.sourceIds,
          ...territory.people.sourceIds,
          ...territory.economy.sourceIds,
        ].every((sourceId) => sourceIds.has(sourceId)),
      ).toBe(true)
    }
    expect(getTerritoriesForCountry('FR')).toHaveLength(3)
    expect(getTerritoriesForCountry('DK')).toHaveLength(2)
    expect(getTerritoriesForCountry('US')).toHaveLength(2)
    expect(getTerritoriesForCountry('GB')).toHaveLength(2)
  })

  it('ships geometry only for the four polygon territories', () => {
    const boundaries = territoryBoundaryCatalogSchema.parse(
      territoryBoundariesJson,
    )
    expect(
      boundaries.map((item) => item.properties.territoryId).sort(),
    ).toEqual(['french-guiana', 'greenland', 'new-caledonia', 'puerto-rico'])
    const frenchGuiana = boundaries.find(
      (item) => item.properties.territoryId === 'french-guiana',
    )!
    expect(geoContains(frenchGuiana as never, [-53.13, 3.93])).toBe(true)
  })

  it('does not change the sovereign-country learning catalogue', () => {
    expect(
      territories.some((item) => ['TW', 'HK', 'MO'].includes(item.code)),
    ).toBe(false)
    expect(territories.some((item) => countriesByCode.has(item.code))).toBe(
      false,
    )
  })
})
