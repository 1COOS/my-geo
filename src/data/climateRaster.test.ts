import { describe, expect, it, vi } from 'vitest'

import { climateOceanRgb, climateTypeIds } from './climateLearningSchema'
import {
  climateLayerManifest,
  getClimateBoundaryRasterAsset,
  getClimateDisplayRasterAsset,
  getClimateRasterAsset,
  getClimateRasterPixel,
  getClimateTypeIdFromPixel,
  loadClimateDisplayAssets,
  loadClimateDisplayRasterAsset,
  normalizeClimatePosition,
} from './climateRaster'

describe('climate raster contract', () => {
  it('normalizes the antimeridian and clamps polar coordinates', () => {
    expect(normalizeClimatePosition({ latitude: 95, longitude: 180 })).toEqual({
      latitude: 90,
      longitude: -180,
    })
    expect(normalizeClimatePosition({ latitude: -95, longitude: 540 })).toEqual(
      { latitude: -90, longitude: -180 },
    )
  })

  it('maps coordinates into in-range equirectangular pixels', () => {
    expect(
      getClimateRasterPixel({ latitude: 90, longitude: -180 }, 360, 180),
    ).toEqual({
      x: 0,
      y: 0,
    })
    expect(
      getClimateRasterPixel({ latitude: -90, longitude: 179.9 }, 360, 180),
    ).toEqual({
      x: 359,
      y: 179,
    })
  })

  it('decodes exact palette colors and treats opaque ocean pixels as unclassified', () => {
    const rainforest = climateLayerManifest.palette.find(
      (item) => item.id === 'tropical-rainforest',
    )!
    expect(
      getClimateTypeIdFromPixel([...rainforest.rgb, 255], 1, 1, {
        latitude: 0,
        longitude: 0,
      }),
    ).toBe('tropical-rainforest')
    expect(
      getClimateTypeIdFromPixel([...climateOceanRgb, 255], 1, 1, {
        latitude: 0,
        longitude: 0,
      }),
    ).toBeNull()
  })

  it('ships both quality assets below the PWA cache limit', () => {
    expect(getClimateRasterAsset('balanced').width).toBe(2048)
    expect(getClimateRasterAsset('low').width).toBe(1024)
    for (const asset of Object.values(climateLayerManifest.assets)) {
      expect(asset.bytes).toBeLessThan(4 * 1024 * 1024)
      expect(asset.sha256).toHaveLength(64)
    }
    for (const quality of ['balanced', 'low'] as const) {
      const assets = climateLayerManifest.highlightAssets[quality]
      const boundaryAssets =
        climateLayerManifest.highlightBoundaryAssets[quality]
      expect(Object.keys(assets)).toHaveLength(climateTypeIds.length)
      expect(Object.keys(boundaryAssets)).toHaveLength(climateTypeIds.length)
      for (const climateTypeId of climateTypeIds) {
        for (const asset of [
          assets[climateTypeId],
          boundaryAssets[climateTypeId],
        ]) {
          expect(asset.bytes).toBeLessThan(4 * 1024 * 1024)
          expect(asset.sha256).toHaveLength(64)
        }
      }
    }
  })

  it('resolves synchronized base and highlighted display assets', () => {
    expect(getClimateDisplayRasterAsset('balanced', null)).toEqual(
      getClimateRasterAsset('balanced'),
    )
    expect(
      getClimateDisplayRasterAsset('balanced', 'tropical-rainforest').url,
    ).toBe('/climate/highlights/balanced/tropical-rainforest.png')
    expect(getClimateDisplayRasterAsset('low', 'temperate-monsoon').url).toBe(
      '/climate/highlights/low/temperate-monsoon.png',
    )
    expect(
      getClimateBoundaryRasterAsset('balanced', 'tropical-rainforest')?.url,
    ).toBe('/climate/highlight-boundaries/balanced/tropical-rainforest.png')
    expect(getClimateBoundaryRasterAsset('low', null)).toBeNull()
  })

  it('falls back to the base raster when a highlight fails to load', async () => {
    class FailingImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(_value: string) {
        this.onerror?.()
      }
    }
    vi.stubGlobal('Image', FailingImage)
    try {
      await expect(
        loadClimateDisplayRasterAsset('low', 'ice-cap'),
      ).resolves.toEqual(getClimateRasterAsset('low'))
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('loads a synchronized highlighted raster and boundary bundle', async () => {
    class SuccessfulImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(_value: string) {
        this.onload?.()
      }
    }
    vi.stubGlobal('Image', SuccessfulImage)
    try {
      await expect(
        loadClimateDisplayAssets('balanced', 'tundra'),
      ).resolves.toMatchObject({
        raster: { url: '/climate/highlights/balanced/tundra.png' },
        boundary: {
          url: '/climate/highlight-boundaries/balanced/tundra.png',
        },
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('keeps the highlighted raster when only its boundary fails', async () => {
    class BoundaryFailingImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(value: string) {
        if (value.includes('highlight-boundaries')) this.onerror?.()
        else this.onload?.()
      }
    }
    vi.stubGlobal('Image', BoundaryFailingImage)
    try {
      await expect(
        loadClimateDisplayAssets('low', 'temperate-oceanic'),
      ).resolves.toMatchObject({
        raster: { url: '/climate/highlights/low/temperate-oceanic.png' },
        boundary: null,
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
