import { describe, expect, it } from 'vitest'

import {
  getGeographyReferencePaths,
  getReferenceLineIdForLayer,
} from './geographyLearningScene'

describe('geography learning scene paths', () => {
  it('builds all reference paths with selected and low-quality styles', () => {
    const balanced = getGeographyReferencePaths('balanced', 'equator')
    const low = getGeographyReferencePaths('low', null)

    expect(balanced).toHaveLength(13)
    expect(
      balanced.find((path) => path.referenceLineId === 'equator'),
    ).toMatchObject({ color: '#ffffff', stroke: 1.1 })
    expect(
      balanced.find(
        (path) => path.referenceLineId === 'western-hemisphere-boundary',
      ),
    ).toMatchObject({ dashLength: 0.08, dashGap: 0.055 })
    expect(low.every((path) => path.points.length > 80)).toBe(true)
  })

  it('only extracts reference ids from the path layer', () => {
    expect(
      getReferenceLineIdForLayer('path', { referenceLineId: 'equator' }),
    ).toBe('equator')
    expect(
      getReferenceLineIdForLayer('polygon', { referenceLineId: 'equator' }),
    ).toBeNull()
  })
})
