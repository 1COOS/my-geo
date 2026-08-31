import { describe, expect, it } from 'vitest'

import { resolveViewportProfile } from './useViewportProfile'

describe('resolveViewportProfile', () => {
  it.each([
    [{ width: 568, height: 320 }, 'compact-landscape'],
    [{ width: 844, height: 390 }, 'compact-landscape'],
    [{ width: 1024, height: 600 }, 'compact-landscape'],
    [{ width: 1194, height: 834 }, 'balanced'],
    [{ width: 1366, height: 768 }, 'wide'],
    [{ width: 2560, height: 1440 }, 'wide'],
    [{ width: 900, height: 1000 }, 'balanced'],
  ] as const)('classifies %o as %s', (size, expected) => {
    expect(resolveViewportProfile(size)).toBe(expected)
  })
})
