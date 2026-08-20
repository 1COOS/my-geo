import { describe, expect, it } from 'vitest'

import { advanceLabelLayoutFrame } from './globeFrameScheduling'

describe('globe label frame scheduling', () => {
  it('updates balanced labels at up to 60Hz', () => {
    expect(advanceLabelLayoutFrame(0, 1 / 120, 'balanced', true)).toMatchObject(
      {
        shouldLayout: false,
      },
    )
    expect(
      advanceLabelLayoutFrame(1 / 120, 1 / 120, 'balanced', true),
    ).toMatchObject({ shouldLayout: true })
  })

  it('updates low-quality labels at up to 30Hz and preserves idle time', () => {
    const idle = advanceLabelLayoutFrame(0, 1 / 60, 'low', false)
    expect(idle.shouldLayout).toBe(false)
    expect(
      advanceLabelLayoutFrame(idle.accumulatedSeconds, 1 / 60, 'low', true),
    ).toMatchObject({ shouldLayout: true })
  })
})
