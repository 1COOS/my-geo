import type { CountryBoundary } from '../data/countrySchema'
import type { City } from '../data/citySchema'

export const OVERVIEW_CAMERA_DISTANCE = 425
export const CITY_CAMERA_DISTANCE = 190
export const PROXIMITY_ENTER_DISTANCE = 250
export const PROXIMITY_EXIT_DISTANCE = 275
export const GLOBE_VERTICAL_CENTER_RATIO = 0.45

type CartesianPosition = {
  x: number
  y: number
  z: number
}

export function getOverviewCameraPosition(
  position: CartesianPosition,
  targetDistance = OVERVIEW_CAMERA_DISTANCE,
) {
  const distance = Math.hypot(position.x, position.y, position.z)
  if (distance === 0) return { x: 0, y: 0, z: targetDistance }
  const scale = targetDistance / distance
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

export type CityMarker = {
  cityId: string
  countryCode: City['countryCode']
  lat: number
  lng: number
  name: string
  isCapital: boolean
}

export function getBoundaryCode(value: object | undefined) {
  return (value as CountryBoundary | undefined)?.properties.code ?? null
}

export function getCityMarker(value: object | undefined) {
  return (value as CityMarker | undefined)?.cityId
    ? (value as CityMarker)
    : null
}

export function getCountryCodeForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  if (layer === 'polygon') return getBoundaryCode(value)
  if (layer === 'point') return getCityMarker(value)?.countryCode ?? null
  return null
}

export function getCityIdForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  return layer === 'point' ? (getCityMarker(value)?.cityId ?? null) : null
}

export function resolveProximityCountryCode(
  previousCountryCode: string | null,
  centerCountryCode: string | null,
  distance: number,
) {
  if (!centerCountryCode) return null
  if (previousCountryCode === centerCountryCode) {
    return distance <= PROXIMITY_EXIT_DISTANCE ? centerCountryCode : null
  }
  return distance <= PROXIMITY_ENTER_DISTANCE ? centerCountryCode : null
}

export function getCapitalLabelBudget(
  quality: 'balanced' | 'low',
  touchDevice: boolean,
) {
  return quality === 'low' || touchDevice ? 16 : 30
}

export function getCameraFlightDuration(reducedMotion: boolean) {
  return reducedMotion ? 0 : 1.05
}
