import { describe, expect, it } from 'vitest'

import {
  getInternationalAffiliationsForCountry,
  internationalAffiliations,
} from './internationalOrganizations'

function affiliation(id: string) {
  const value = internationalAffiliations.find((item) => item.id === id)
  expect(value).toBeDefined()
  return value!
}

describe('international organization catalogue', () => {
  it('contains the seven reviewed affiliations with current official totals', () => {
    expect(internationalAffiliations).toHaveLength(7)
    expect(
      internationalAffiliations.map((item) => [
        item.abbreviation,
        item.officialMemberCount,
      ]),
    ).toEqual([
      ['安理会常任理事国', 5],
      ['欧盟', 27],
      ['东盟', 11],
      ['非盟', 55],
      ['OPEC', 12],
      ['WTO', 166],
      ['北约', 32],
    ])
  })

  it('separates official totals from country-card coverage', () => {
    expect(affiliation('african-union').memberCountryCodes).toHaveLength(54)
    expect(
      affiliation('world-trade-organization').memberCountryCodes,
    ).toHaveLength(162)
  })

  it('uses current formal membership at reviewed boundaries', () => {
    expect(
      getInternationalAffiliationsForCountry('TL').map((item) => item.id),
    ).toEqual(
      expect.arrayContaining([
        'association-of-southeast-asian-nations',
        'world-trade-organization',
      ]),
    )
    expect(
      getInternationalAffiliationsForCountry('AO').map((item) => item.id),
    ).not.toContain('organization-of-the-petroleum-exporting-countries')
    expect(
      getInternationalAffiliationsForCountry('SE').map((item) => item.id),
    ).toEqual(
      expect.arrayContaining([
        'european-union',
        'world-trade-organization',
        'north-atlantic-treaty-organization',
      ]),
    )
  })

  it('does not treat observers or unrepresented relationships as membership', () => {
    expect(
      getInternationalAffiliationsForCountry('DZ').map((item) => item.id),
    ).not.toContain('world-trade-organization')
    expect(getInternationalAffiliationsForCountry('VA')).toEqual([])
    expect(getInternationalAffiliationsForCountry('PS')).toEqual([])
  })
})
