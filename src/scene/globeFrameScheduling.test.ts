import { describe, expect, it } from 'vitest'

import { shouldLayoutGlobeLabelsThisFrame } from './globeFrameScheduling'

describe('globe label frame scheduling', () => {
  it.each(['balanced', 'low'] as const)(
    'updates %s labels on every frame where the camera changes',
    (quality) => {
      expect(shouldLayoutGlobeLabelsThisFrame(quality, true)).toBe(true)
    },
  )

  it.each(['balanced', 'low'] as const)(
    'skips %s label layout while the camera is idle',
    (quality) => {
      expect(shouldLayoutGlobeLabelsThisFrame(quality, false)).toBe(false)
    },
  )
})
