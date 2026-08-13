import type { CountryBoundary } from '../data/countrySchema'

export const OVERVIEW_CAMERA_DISTANCE = 425
export const GLOBE_VERTICAL_CENTER_RATIO = 0.45

type CartesianPosition = {
  x: number
  y: number
  z: number
}

export function getOverviewCameraPosition(position: CartesianPosition) {
  const distance = Math.hypot(position.x, position.y, position.z)
  if (distance === 0) return { x: 0, y: 0, z: OVERVIEW_CAMERA_DISTANCE }
  const scale = OVERVIEW_CAMERA_DISTANCE / distance
  return {
    x: position.x * scale,
    y: position.y * scale,
    z: position.z * scale,
  }
}

export function getGlobeViewOffset(width: number, height: number) {
  return {
    fullWidth: width,
    fullHeight: height,
    offsetX: 0,
    offsetY: height * (0.5 - GLOBE_VERTICAL_CENTER_RATIO),
    width,
    height,
  }
}

export type CapitalMarker = {
  countryCode: string
  lat: number
  lng: number
  name: string
}

export function getBoundaryCode(value: object | undefined) {
  return (value as CountryBoundary | undefined)?.properties.code ?? null
}

export function getCapitalMarkerCode(value: object | undefined) {
  return (value as CapitalMarker | undefined)?.countryCode ?? null
}

export function getCountryCodeForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  if (layer === 'polygon') return getBoundaryCode(value)
  if (layer === 'point') return getCapitalMarkerCode(value)
  return null
}

export function getCameraFlightDuration(reducedMotion: boolean) {
  return reducedMotion ? 0 : 1.05
}
