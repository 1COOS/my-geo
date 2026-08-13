import { describe, expect, it } from 'vitest'

import { countriesByCode } from './countries'
import { waterbodies, waterbodyGeometries } from './waterbodies'

describe('waterbody catalogue', () => {
  it('contains the reviewed 50-item classification', () => {
    expect(waterbodies).toHaveLength(50)
    expect(
      Object.fromEntries(
        ['ocean', 'sea', 'gulf', 'bay', 'strait', 'trench'].map((kind) => [
          kind,
          waterbodies.filter((item) => item.kind === kind).length,
        ]),
      ),
    ).toEqual({
      ocean: 5,
      sea: 25,
      gulf: 4,
      bay: 2,
      strait: 10,
      trench: 4,
    })
  })

  it('has matching geometry and valid country references', () => {
    const geometryIds = new Set(
      waterbodyGeometries.map((geometry) => geometry.id),
    )
    expect(geometryIds.size).toBe(50)
    for (const waterbody of waterbodies) {
      expect(geometryIds.has(waterbody.id)).toBe(true)
      expect(waterbody.sourceIds.length).toBeGreaterThan(0)
      for (const code of waterbody.adjacentCountryCodes) {
        expect(countriesByCode.has(code)).toBe(true)
      }
    }
  })

  it('splits date-line crossing surfaces and limits trench vertices', () => {
    const pacific = waterbodyGeometries.find(
      (geometry) => geometry.id === 'pacific-ocean',
    )
    const mariana = waterbodyGeometries.find(
      (geometry) => geometry.id === 'mariana-trench',
    )
    expect(pacific?.kind === 'surface' && pacific.geometry.type).toBe(
      'MultiPolygon',
    )
    expect(
      mariana?.kind === 'trench' && mariana.points.length,
    ).toBeLessThanOrEqual(24)
  })
})
