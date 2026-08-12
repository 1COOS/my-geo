import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import './i18n'
import { LandscapeGuard } from './LandscapeGuard'
import { readLandscapeState, tryLockLandscape } from './landscapePlatform'

interface MediaQueryHarness {
  listeners: Map<string, Set<(event: MediaQueryListEvent) => void>>
  matchMedia: (query: string) => MediaQueryList
  setMatch: (query: string, matches: boolean) => void
}

function createMediaQueryHarness(
  initialMatches: Record<string, boolean>,
): MediaQueryHarness {
  const matches = new Map(Object.entries(initialMatches))
  const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>()

  return {
    listeners,
    matchMedia: (query: string) => ({
      matches: matches.get(query) ?? false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        const queryListeners = listeners.get(query) ?? new Set()
        queryListeners.add(listener as (event: MediaQueryListEvent) => void)
        listeners.set(query, queryListeners)
      },
      removeEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        listeners
          .get(query)
          ?.delete(listener as (event: MediaQueryListEvent) => void)
      },
      dispatchEvent: vi.fn(),
    }),
    setMatch: (query: string, nextMatches: boolean) => {
      matches.set(query, nextMatches)
      const event = {
        matches: nextMatches,
        media: query,
      } as MediaQueryListEvent
      listeners.get(query)?.forEach((listener) => listener(event))
    },
  }
}

function setTouchPoints(maxTouchPoints: number) {
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    configurable: true,
    value: maxTouchPoints,
  })
}

describe('LandscapeGuard', () => {
  beforeEach(() => {
    setTouchPoints(0)
  })

  it('blocks the initial app mount on a touch device in portrait', () => {
    const media = createMediaQueryHarness({
      '(orientation: portrait)': true,
      '(pointer: coarse)': true,
    })
    vi.stubGlobal('matchMedia', media.matchMedia)
    setTouchPoints(5)

    render(
      <LandscapeGuard>
        <div data-testid="guarded-app">App</div>
      </LandscapeGuard>,
    )

    expect(screen.getByTestId('landscape-prompt')).toBeInTheDocument()
    expect(screen.queryByTestId('guarded-app')).not.toBeInTheDocument()
  })

  it('mounts in landscape and preserves the app behind the prompt after rotating back', () => {
    const media = createMediaQueryHarness({
      '(orientation: portrait)': true,
      '(pointer: coarse)': true,
    })
    vi.stubGlobal('matchMedia', media.matchMedia)
    setTouchPoints(5)

    render(
      <LandscapeGuard>
        <div data-testid="guarded-app">App</div>
      </LandscapeGuard>,
    )

    act(() => media.setMatch('(orientation: portrait)', false))
    expect(screen.getByTestId('guarded-app')).toBeInTheDocument()
    expect(screen.queryByTestId('landscape-prompt')).not.toBeInTheDocument()

    act(() => media.setMatch('(orientation: portrait)', true))
    expect(screen.getByTestId('guarded-app')).toBeInTheDocument()
    expect(screen.getByTestId('landscape-prompt')).toBeInTheDocument()
    expect(screen.getByTestId('guarded-app').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('does not block a portrait desktop viewport', () => {
    const media = createMediaQueryHarness({
      '(orientation: portrait)': true,
      '(pointer: coarse)': false,
    })
    vi.stubGlobal('matchMedia', media.matchMedia)

    render(
      <LandscapeGuard>
        <div data-testid="guarded-app">App</div>
      </LandscapeGuard>,
    )

    expect(screen.getByTestId('guarded-app')).toBeInTheDocument()
    expect(screen.queryByTestId('landscape-prompt')).not.toBeInTheDocument()
  })
})

describe('landscape platform helpers', () => {
  it('detects iPads using a desktop-class user agent', () => {
    const windowRef = {
      matchMedia: () => ({ matches: true }),
      navigator: {
        maxTouchPoints: 5,
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 Macintosh',
      },
    } as unknown as Window

    expect(readLandscapeState(windowRef)).toEqual({
      isPortrait: true,
      isTouchDevice: true,
    })
  })

  it('does not treat a fine-pointer touchscreen laptop as a tablet', () => {
    const windowRef = {
      matchMedia: (query: string) => ({
        matches: query === '(orientation: portrait)',
      }),
      navigator: {
        maxTouchPoints: 10,
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 Windows NT 10.0',
      },
    } as unknown as Window

    expect(readLandscapeState(windowRef)).toEqual({
      isPortrait: true,
      isTouchDevice: false,
    })
  })

  it('returns false when orientation locking is unsupported', async () => {
    const windowRef = {
      matchMedia: (query: string) => ({
        matches:
          query === '(display-mode: standalone)' ||
          query === '(pointer: coarse)',
      }),
      navigator: { maxTouchPoints: 1 },
      screen: { orientation: {} },
    } as unknown as Window

    await expect(tryLockLandscape(windowRef)).resolves.toBe(false)
  })

  it('silently falls back when the browser rejects orientation locking', async () => {
    const lock = vi.fn().mockRejectedValue(new DOMException('Not allowed'))
    const windowRef = {
      matchMedia: (query: string) => ({
        matches:
          query === '(display-mode: standalone)' ||
          query === '(pointer: coarse)',
      }),
      navigator: { maxTouchPoints: 1 },
      screen: { orientation: { lock } },
    } as unknown as Window

    await expect(tryLockLandscape(windowRef)).resolves.toBe(false)
    expect(lock).toHaveBeenCalledWith('landscape')
  })
})
