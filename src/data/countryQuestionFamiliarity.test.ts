import { describe, expect, it } from 'vitest'

import { countries } from './countries'
import {
  countryQuestionFamiliarity,
  getQuestionPoolCountries,
  questionDifficultySchema,
} from './countryQuestionFamiliarity'

describe('country question familiarity', () => {
  it('assigns every country to exactly one continent difficulty', () => {
    const assignedCodes = countryQuestionFamiliarity.flatMap((definition) =>
      questionDifficultySchema.options.flatMap(
        (difficulty) => definition.difficulties[difficulty],
      ),
    )

    expect(assignedCodes).toHaveLength(195)
    expect(new Set(assignedCodes).size).toBe(195)
    expect(new Set(assignedCodes)).toEqual(
      new Set(countries.map((country) => country.code)),
    )
  })

  it('keeps familiar anchor countries in the easy pools', () => {
    expect(
      getQuestionPoolCountries('asia', 'easy').map((country) => country.code),
    ).toEqual(expect.arrayContaining(['CN', 'JP', 'IN', 'KR']))
    expect(
      getQuestionPoolCountries('europe', 'easy').map((country) => country.code),
    ).toEqual(expect.arrayContaining(['GB', 'FR', 'DE', 'IT']))
    expect(
      getQuestionPoolCountries('africa', 'easy').map((country) => country.code),
    ).toEqual(expect.arrayContaining(['EG', 'ZA', 'NG', 'KE']))
    expect(
      getQuestionPoolCountries('americas', 'easy').map(
        (country) => country.code,
      ),
    ).toEqual(expect.arrayContaining(['US', 'CA', 'BR', 'MX']))
    expect(
      getQuestionPoolCountries('oceania', 'easy').map(
        (country) => country.code,
      ),
    ).toEqual(['AU', 'NZ', 'FJ', 'PG'])
  })
})
