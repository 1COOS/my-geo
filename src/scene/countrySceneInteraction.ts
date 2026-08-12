import type { CountryBoundary } from '../data/countrySchema'

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
