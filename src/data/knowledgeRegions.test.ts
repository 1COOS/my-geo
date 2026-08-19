import { describe, expect, it } from 'vitest'

import { countries } from './countries'
import {
  getCountriesForKnowledgeRegion,
  knowledgeRegionByCountryCode,
  knowledgeRegions,
} from './knowledgeRegions'

describe('knowledge regions', () => {
  it('covers every country exactly once across 23 stable regions', () => {
    const assignedCodes = knowledgeRegions.flatMap(
      (region) => region.countryCodes,
    )

    expect(knowledgeRegions).toHaveLength(23)
    expect(assignedCodes).toHaveLength(195)
    expect(new Set(assignedCodes).size).toBe(195)
    expect(new Set(assignedCodes)).toEqual(
      new Set(countries.map((country) => country.code)),
    )
  })

  it('merges south-eastern Europe into the south Europe learning region', () => {
    const southEurope = getCountriesForKnowledgeRegion('south-europe')
    const sourceSubregions = new Set(
      southEurope.map((country) => country.subregion.zh),
    )

    expect(sourceSubregions).toEqual(new Set(['南欧', '东南欧']))
    expect(knowledgeRegionByCountryCode.get('RS')?.id).toBe('south-europe')
  })

  it('keeps East Asia as the five-country introductory region', () => {
    expect(
      getCountriesForKnowledgeRegion('east-asia').map(
        (country) => country.code,
      ),
    ).toEqual(['CN', 'JP', 'KP', 'KR', 'MN'])
  })
})
