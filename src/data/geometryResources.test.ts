import { beforeEach, describe, expect, it, vi } from 'vitest'

import countryBoundariesFixture from './generated/country-boundaries.json'
import {
  loadCountryBoundaries,
  prefetchGeometryAssets,
  resetGeometryResourceCachesForTests,
} from './geometryResources'

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('geometry resources', () => {
  beforeEach(() => resetGeometryResourceCachesForTests())

  it('shares one validated request between concurrent consumers', async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(jsonResponse(countryBoundariesFixture)),
    )
    const first = loadCountryBoundaries(fetcher)
    const second = loadCountryBoundaries(fetcher)

    expect(first).toBe(second)
    await expect(first).resolves.toMatchObject({ type: 'FeatureCollection' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed data and allows a later retry', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ type: 'invalid' }))
      .mockResolvedValueOnce(jsonResponse(countryBoundariesFixture))

    await expect(loadCountryBoundaries(fetcher)).rejects.toBeDefined()
    await expect(loadCountryBoundaries(fetcher)).resolves.toMatchObject({
      type: 'FeatureCollection',
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('clears a failed network request so retry can use the offline response', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('network unavailable'))
      .mockResolvedValueOnce(jsonResponse(countryBoundariesFixture))

    await expect(loadCountryBoundaries(fetcher)).rejects.toThrow(
      'network unavailable',
    )
    await expect(loadCountryBoundaries(fetcher)).resolves.toMatchObject({
      type: 'FeatureCollection',
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('prefetches resource bytes without parsing them', async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(new Uint8Array([1, 2, 3]))),
    )
    await prefetchGeometryAssets(
      ['country', 'waterbody', 'linearFeature'],
      fetcher,
    )

    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
