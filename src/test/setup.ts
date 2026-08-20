import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

import countryBoundaries from '../data/generated/country-boundaries.json'
import desertGeometries from '../data/generated/desert-geometries.json'
import mountainGeometries from '../data/generated/mountain-geometries.json'
import riverGeometries from '../data/generated/river-geometries.json'
import waterbodyGeometries from '../data/generated/waterbody-geometries.json'

class ResizeObserverMock implements ResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

globalThis.ResizeObserver = ResizeObserverMock

const geometryFixtures = new Map<string, unknown>([
  ['country-boundaries.json', countryBoundaries],
  ['waterbody-geometries.json', waterbodyGeometries],
  ['river-geometries.json', riverGeometries],
  ['mountain-geometries.json', mountainGeometries],
  ['desert-geometries.json', desertGeometries],
])

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url =
        input instanceof Request
          ? input.url
          : input instanceof URL
            ? input.href
            : input
      for (const [filename, fixture] of geometryFixtures) {
        if (url.includes(filename)) {
          return Promise.resolve(
            new Response(JSON.stringify(fixture), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          )
        }
      }
      return Promise.resolve(new Response(null, { status: 404 }))
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
