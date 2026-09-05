import { describe, expect, it } from 'vitest'

import { parseFlagSections } from './country-flag-source-parser'

describe('Factbook flag source parser', () => {
  it('extracts all three complete labeled sections', () => {
    expect(
      parseFlagSections(
        '<strong>description:</strong> red &amp; white<br><br><strong>meaning:\u00a0</strong>unity &quot;together&quot;<br><br><strong>history: </strong>adopted in 1901',
      ),
    ).toEqual({
      description: 'red & white',
      meaning: 'unity "together"',
      history: 'adopted in 1901',
    })
  })

  it('keeps absent Factbook sections explicit', () => {
    expect(
      parseFlagSections('<strong>description:</strong> white field'),
    ).toEqual({
      description: 'white field',
      meaning: null,
      history: null,
    })
    expect(parseFlagSections('')).toEqual({
      description: null,
      meaning: null,
      history: null,
    })
  })
})
