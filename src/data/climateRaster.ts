import manifestJson from './generated/climate-layer.json'
import {
  climateLayerManifestSchema,
  type ClimateClassification,
  type ClimateTypeId,
} from './climateLearningSchema'

export const climateLayerManifest =
  climateLayerManifestSchema.parse(manifestJson)

export type ClimateQuality = 'balanced' | 'low'

type LoadedClimateRaster = {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

export type ClimateRasterAsset = {
  url: string
  width: number
  height: number
  bytes: number
  sha256: string
}

const paletteByRgb = new Map(
  climateLayerManifest.palette.map((item) => [item.rgb.join(','), item.id]),
)
const rasterCache = new Map<ClimateQuality, Promise<LoadedClimateRaster>>()
const displayRasterCache = new Map<string, Promise<ClimateRasterAsset>>()
const boundaryRasterCache = new Map<
  string,
  Promise<ClimateRasterAsset | null>
>()

export function getClimateRasterAsset(quality: ClimateQuality) {
  return climateLayerManifest.assets[quality]
}

export function getClimateDisplayRasterAsset(
  quality: ClimateQuality,
  selectedClimateTypeId: ClimateTypeId | null,
) {
  if (!selectedClimateTypeId) return getClimateRasterAsset(quality)
  return (
    climateLayerManifest.highlightAssets[quality][selectedClimateTypeId] ??
    getClimateRasterAsset(quality)
  )
}

export function getClimateBoundaryRasterAsset(
  quality: ClimateQuality,
  selectedClimateTypeId: ClimateTypeId | null,
) {
  if (!selectedClimateTypeId) return null
  return (
    climateLayerManifest.highlightBoundaryAssets[quality][
      selectedClimateTypeId
    ] ?? null
  )
}

export function loadClimateDisplayRasterAsset(
  quality: ClimateQuality,
  selectedClimateTypeId: ClimateTypeId | null,
): Promise<ClimateRasterAsset> {
  const fallback = getClimateRasterAsset(quality)
  if (!selectedClimateTypeId) return Promise.resolve(fallback)
  const cacheKey = `${quality}:${selectedClimateTypeId}`
  const cached = displayRasterCache.get(cacheKey)
  if (cached) return cached
  const target = getClimateDisplayRasterAsset(quality, selectedClimateTypeId)
  const promise = new Promise<ClimateRasterAsset>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(target)
    image.onerror = () => {
      displayRasterCache.delete(cacheKey)
      resolve(fallback)
    }
    image.src = target.url
  })
  displayRasterCache.set(cacheKey, promise)
  return promise
}

export function loadClimateBoundaryRasterAsset(
  quality: ClimateQuality,
  selectedClimateTypeId: ClimateTypeId | null,
): Promise<ClimateRasterAsset | null> {
  const target = getClimateBoundaryRasterAsset(quality, selectedClimateTypeId)
  if (!target || !selectedClimateTypeId) return Promise.resolve(null)
  const cacheKey = `${quality}:${selectedClimateTypeId}`
  const cached = boundaryRasterCache.get(cacheKey)
  if (cached) return cached
  const promise = new Promise<ClimateRasterAsset | null>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(target)
    image.onerror = () => {
      boundaryRasterCache.delete(cacheKey)
      resolve(null)
    }
    image.src = target.url
  })
  boundaryRasterCache.set(cacheKey, promise)
  return promise
}

export type ClimateDisplayAssets = {
  raster: ClimateRasterAsset
  boundary: ClimateRasterAsset | null
}

export async function loadClimateDisplayAssets(
  quality: ClimateQuality,
  selectedClimateTypeId: ClimateTypeId | null,
): Promise<ClimateDisplayAssets> {
  const raster = await loadClimateDisplayRasterAsset(
    quality,
    selectedClimateTypeId,
  )
  if (
    !selectedClimateTypeId ||
    raster.url === getClimateRasterAsset(quality).url
  ) {
    return { raster, boundary: null }
  }
  return {
    raster,
    boundary: await loadClimateBoundaryRasterAsset(
      quality,
      selectedClimateTypeId,
    ),
  }
}

export function normalizeClimatePosition(position: {
  latitude: number
  longitude: number
}) {
  return {
    latitude: Math.min(90, Math.max(-90, position.latitude)),
    longitude: ((((position.longitude + 180) % 360) + 360) % 360) - 180,
  }
}

export function getClimateRasterPixel(
  position: { latitude: number; longitude: number },
  width: number,
  height: number,
) {
  const normalized = normalizeClimatePosition(position)
  return {
    x: Math.min(
      width - 1,
      Math.max(0, Math.floor(((normalized.longitude + 180) / 360) * width)),
    ),
    y: Math.min(
      height - 1,
      Math.max(0, Math.floor(((90 - normalized.latitude) / 180) * height)),
    ),
  }
}

export function getClimateTypeIdFromPixel(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  position: { latitude: number; longitude: number },
): ClimateTypeId | null {
  const point = getClimateRasterPixel(position, width, height)
  const offset = (point.y * width + point.x) * 4
  return (
    paletteByRgb.get(
      `${pixels[offset] ?? 0},${pixels[offset + 1] ?? 0},${pixels[offset + 2] ?? 0}`,
    ) ?? null
  )
}

async function loadClimateRaster(quality: ClimateQuality) {
  const cached = rasterCache.get(quality)
  if (cached) return cached
  const promise = new Promise<LoadedClimateRaster>((resolve, reject) => {
    const asset = getClimateRasterAsset(quality)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = asset.width
      canvas.height = asset.height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        reject(new Error('Climate raster canvas is unavailable'))
        return
      }
      context.imageSmoothingEnabled = false
      context.drawImage(image, 0, 0, asset.width, asset.height)
      resolve({
        width: asset.width,
        height: asset.height,
        pixels: context.getImageData(0, 0, asset.width, asset.height).data,
      })
    }
    image.onerror = () => reject(new Error(`Failed to load ${asset.url}`))
    image.src = asset.url
  })
  rasterCache.set(quality, promise)
  promise.catch(() => rasterCache.delete(quality))
  return promise
}

export function preloadClimateRaster(quality: ClimateQuality) {
  return loadClimateRaster(quality).then(() => undefined)
}

export async function classifyClimatePosition(
  position: { latitude: number; longitude: number },
  quality: ClimateQuality,
): Promise<ClimateClassification> {
  const normalized = normalizeClimatePosition(position)
  const raster = await loadClimateRaster(quality)
  return {
    position: normalized,
    climateTypeId: getClimateTypeIdFromPixel(
      raster.pixels,
      raster.width,
      raster.height,
      normalized,
    ),
    period: climateLayerManifest.period,
  }
}
