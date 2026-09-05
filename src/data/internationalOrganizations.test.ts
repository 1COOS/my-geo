import { describe, expect, it } from 'vitest'

import { countriesByCode } from './countries'
import {
  getInternationalAffiliationsForCountry,
  internationalAffiliations,
} from './internationalOrganizations'

function affiliation(id: string) {
  const value = internationalAffiliations.find((item) => item.id === id)
  expect(value).toBeDefined()
  return value!
}

function affiliationIds(countryCode: string) {
  return getInternationalAffiliationsForCountry(countryCode).map(
    (item) => item.id,
  )
}

describe('international organization catalogue', () => {
  it('contains the 18 selected identities in display priority order', () => {
    expect(
      internationalAffiliations.map((item) => [
        item.monogram,
        item.officialMemberCount,
      ]),
    ).toEqual([
      ['P5', 5],
      ['G7', 7],
      ['G20', 21],
      ['BRICS', 10],
      ['CW', 56],
      ['EU', 27],
      ['ASEAN', 11],
      ['AU', 55],
      ['LAS', 22],
      ['GCC', 6],
      ['MERCOSUR', 5],
      ['CARICOM', 15],
      ['NATO', 32],
      ['SCO', 10],
      ['QUAD', 4],
      ['AUKUS', 3],
      ['OPEC', 12],
      ['OECD', 38],
    ])
  })

  it('keeps global identities below half of the country catalogue', () => {
    const globalLimit = Math.floor(countriesByCode.size / 2)
    for (const item of internationalAffiliations.filter(
      ({ category }) => category === 'global',
    )) {
      expect(item.memberCountryCodes.length).toBeLessThanOrEqual(globalLimit)
    }
    expect(
      internationalAffiliations.some(
        (item) => item.id === 'world-trade-organization',
      ),
    ).toBe(false)
  })

  it('separates project country cards from other formal members', () => {
    const g20 = affiliation('group-of-twenty')
    expect(g20.memberCountryCodes).toHaveLength(19)
    expect(g20.otherMembers.map((member) => member.name.zh)).toEqual([
      '欧洲联盟',
      '非洲联盟',
    ])

    const africanUnion = affiliation('african-union')
    expect(africanUnion.memberCountryCodes).toHaveLength(54)
    expect(africanUnion.otherMembers[0]?.name.zh).toBe('撒哈拉阿拉伯民主共和国')

    const caricom = affiliation('caribbean-community')
    expect(caricom.memberCountryCodes).toHaveLength(14)
    expect(caricom.otherMembers[0]?.name.zh).toBe('蒙特塞拉特')
  })

  it('maps representative countries to their direct formal identities', () => {
    expect(affiliationIds('CN')).toEqual([
      'un-security-council-permanent-member',
      'group-of-twenty',
      'brics',
      'shanghai-cooperation-organisation',
    ])
    expect(affiliationIds('US')).toEqual([
      'un-security-council-permanent-member',
      'group-of-seven',
      'group-of-twenty',
      'north-atlantic-treaty-organization',
      'quadrilateral-security-dialogue',
      'aukus',
      'organisation-for-economic-co-operation-and-development',
    ])
    expect(affiliationIds('IN')).toEqual([
      'group-of-twenty',
      'brics',
      'commonwealth-of-nations',
      'shanghai-cooperation-organisation',
      'quadrilateral-security-dialogue',
    ])
    expect(affiliationIds('SA')).toEqual([
      'group-of-twenty',
      'league-of-arab-states',
      'gulf-cooperation-council',
      'organization-of-the-petroleum-exporting-countries',
    ])
  })

  it('excludes disputed, partner, observer and suspended relationships', () => {
    expect(affiliationIds('SA')).not.toContain('brics')
    expect(affiliationIds('VE')).not.toContain('southern-common-market')
    expect(affiliationIds('VE')).toContain(
      'organization-of-the-petroleum-exporting-countries',
    )
    expect(affiliationIds('AO')).not.toContain(
      'organization-of-the-petroleum-exporting-countries',
    )
    expect(affiliationIds('MN')).not.toContain(
      'shanghai-cooperation-organisation',
    )
  })
})
