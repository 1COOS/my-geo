import { describe, expect, it } from 'vitest'

import { advanceGlobeLabelFrame } from './globeFrameScheduling'

describe('globe label frame scheduling', () => {
  it.each(['balanced', 'low'] as const)(
    'tracks %s label positions on every camera-changed frame',
    (quality) => {
      expect(advanceGlobeLabelFrame(0, 1 / 120, quality, true)).toMatchObject({
        shouldTrackPositions: true,
        shouldReconcileLayout: false,
      })
    },
  )

  it('reconciles balanced collisions at 15Hz', () => {
    expect(
      advanceGlobeLabelFrame(1 / 20, 1 / 60, 'balanced', true),
    ).toMatchObject({
      shouldTrackPositions: true,
      shouldReconcileLayout: true,
    })
  })

  it('reconciles low-quality collisions at 10Hz', () => {
    expect(advanceGlobeLabelFrame(1 / 12, 1 / 60, 'low', true)).toMatchObject({
      shouldTrackPositions: true,
      shouldReconcileLayout: true,
    })
  })

  it('skips idle work and resets the collision accumulator', () => {
    expect(advanceGlobeLabelFrame(0.08, 1 / 60, 'balanced', false)).toEqual({
      shouldTrackPositions: false,
      shouldReconcileLayout: false,
      accumulatedSeconds: 0,
    })
  })
})
