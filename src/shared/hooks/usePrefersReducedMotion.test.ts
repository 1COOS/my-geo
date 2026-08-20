import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePrefersReducedMotion } from './usePrefersReducedMotion'

describe('usePrefersReducedMotion', () => {
  it('tracks media-query changes', () => {
    let listener: (() => void) | undefined
    const mediaQuery = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, next: () => void) => {
        listener = next
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    window.matchMedia = vi.fn(() => mediaQuery)

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    mediaQuery.matches = true
    act(() => listener?.())
    expect(result.current).toBe(true)
  })
})
