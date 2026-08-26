import {
  geoContains,
  geoEquirectangular,
  geoPath,
  type GeoProjection,
} from 'd3-geo'

import { countries } from '../../data/countries'
import type {
  CountryBoundaries,
  CountryBoundary,
  Landmass,
} from '../../data/countrySchema'
import type { GeoPosition } from '../../shared/types/geo'

export const MINI_MAP_WIDTH = 360
export const MINI_MAP_HEIGHT = 180
export const MINI_MAP_KEYBOARD_STEP = 5
export const MINI_MAP_KEYBOARD_FAST_STEP = 15
export const MICROSTATE_HIT_RADIUS = 6

export const worldMiniMapProjection = geoEquirectangular()
  .scale(MINI_MAP_WIDTH / (2 * Math.PI))
  .translate([MINI_MAP_WIDTH / 2, MINI_MAP_HEIGHT / 2])
  .precision(0.1)
  .clipExtent([
    [0, 0],
    [MINI_MAP_WIDTH, MINI_MAP_HEIGHT],
  ])

export const worldMiniMapPath = geoPath(worldMiniMapProjection)

export function getMicrostateCountries(boundaries: CountryBoundaries) {
  const boundaryCodes = new Set(
    boundaries.features.map((feature) => feature.properties.code),
  )
  return countries.filter((country) => !boundaryCodes.has(country.code))
}

export function projectGeoPosition(
  position: GeoPosition,
  projection: GeoProjection = worldMiniMapProjection,
) {
  const point = projection([position.longitude, position.latitude])
  return point ? { x: point[0], y: point[1] } : null
}

export function invertMiniMapPoint(
  x: number,
  y: number,
  projection: GeoProjection = worldMiniMapProjection,
): GeoPosition | null {
  const coordinate = projection.invert?.([x, y])
  if (!coordinate) return null
  return {
    latitude: clampLatitude(coordinate[1]),
    longitude: wrapLongitude(coordinate[0]),
  }
}

export function findCountryAtPosition(
  position: GeoPosition,
  countryBoundaries: CountryBoundaries,
) {
  const point = projectGeoPosition(position)
  if (!point) return null

  let closestCountryCode: string | null = null
  let closestDistance = Number.POSITIVE_INFINITY
  for (const country of getMicrostateCountries(countryBoundaries)) {
    const countryPoint = projectGeoPosition(country.center)
    if (!countryPoint) continue
    const distance = Math.hypot(
      countryPoint.x - point.x,
      countryPoint.y - point.y,
    )
    if (distance <= MICROSTATE_HIT_RADIUS && distance < closestDistance) {
      closestCountryCode = country.code
      closestDistance = distance
    }
  }
  if (closestCountryCode) return closestCountryCode

  const coordinate: [number, number] = [position.longitude, position.latitude]
  const boundary = countryBoundaries.features.find((feature) =>
    geoContains(feature as never, coordinate),
  )
  return boundary?.properties.code ?? null
}

export function moveMiniMapCursor(
  position: GeoPosition,
  latitudeDelta: number,
  longitudeDelta: number,
): GeoPosition {
  return {
    latitude: clampLatitude(position.latitude + latitudeDelta),
    longitude: wrapLongitude(position.longitude + longitudeDelta),
  }
}

export function formatGeoPosition(position: GeoPosition) {
  const latitudeDirection = position.latitude >= 0 ? 'N' : 'S'
  const longitudeDirection = position.longitude >= 0 ? 'E' : 'W'
  return `${Math.abs(position.latitude).toFixed(1)}°${latitudeDirection} · ${Math.abs(
    position.longitude,
  ).toFixed(1)}°${longitudeDirection}`
}

export function getMapFeaturePath(feature: CountryBoundary | Landmass) {
  return worldMiniMapPath(feature as never) ?? ''
}

function clampLatitude(latitude: number) {
  return Math.min(90, Math.max(-90, latitude))
}

function wrapLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180
}
