import type { CountryBoundary } from '../data/countrySchema'
import type { City } from '../data/citySchema'
import type { LinearGeoFeature } from '../data/linearGeoFeatureSchema'
import type { Waterbody } from '../data/waterbodySchema'
import type { LandmarkMarker } from './landmarkSceneInteraction'

export const OVERVIEW_CAMERA_DISTANCE = 425
export const CITY_CAMERA_DISTANCE = 190
export const WATERBODY_CAMERA_DISTANCE = 225
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
  markerType: 'city'
  cityId: string
  countryCode: City['countryCode']
  lat: number
  lng: number
  name: string
  isCapital: boolean
}

export type WaterbodyMarker = {
  markerType: 'waterbody'
  waterbodyId: string
  layer: Waterbody['layer']
  kind: Waterbody['kind']
  lat: number
  lng: number
  name: string
}

export type GlobePointMarker = CityMarker | WaterbodyMarker | LandmarkMarker

export type CityLayerVisibility = {
  showCapitals: boolean
  showCities: boolean
  selectedCityId: string | null
  hoveredCityId: string | null
}

export function getVisibleLayerCities(
  cities: readonly City[],
  visibility: CityLayerVisibility,
) {
  return cities.filter(
    (city) =>
      city.id === visibility.selectedCityId ||
      city.id === visibility.hoveredCityId ||
      (city.isCapital ? visibility.showCapitals : visibility.showCities),
  )
}

export function getBoundaryCode(value: object | undefined) {
  return (value as CountryBoundary | undefined)?.properties.code ?? null
}

export function getCityMarker(value: object | undefined) {
  return (value as CityMarker | undefined)?.markerType === 'city'
    ? (value as CityMarker)
    : null
}

export function getWaterbodyMarker(value: object | undefined) {
  return (value as WaterbodyMarker | undefined)?.markerType === 'waterbody'
    ? (value as WaterbodyMarker)
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

export function getWaterbodyIdForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  if (layer === 'point') return getWaterbodyMarker(value)?.waterbodyId ?? null
  if (layer === 'polygon') {
    return (
      (value as { properties?: { waterbodyId?: string } } | undefined)
        ?.properties?.waterbodyId ?? null
    )
  }
  if (layer === 'path') {
    return (value as { waterbodyId?: string } | undefined)?.waterbodyId ?? null
  }
  return null
}

export function getLinearFeatureIdForLayer(
  layer: string | undefined,
  value: object | undefined,
) {
  return layer === 'path'
    ? ((value as { linearFeatureId?: string } | undefined)?.linearFeatureId ??
        null)
    : null
}

export type WaterbodyLayerVisibility = {
  showOceanLayer: boolean
  showWaterwayLayer: boolean
  selectedWaterbodyId: string | null
  hoveredWaterbodyId: string | null
}

export function getVisibleLayerWaterbodies(
  waterbodies: readonly Waterbody[],
  visibility: WaterbodyLayerVisibility,
) {
  return waterbodies.filter(
    (waterbody) =>
      waterbody.id === visibility.selectedWaterbodyId ||
      waterbody.id === visibility.hoveredWaterbodyId ||
      (waterbody.layer === 'ocean'
        ? visibility.showOceanLayer
        : visibility.showWaterwayLayer),
  )
}

export type LinearFeatureLayerVisibility = {
  showRiverAndCanalLayer: boolean
  selectedLinearFeatureId: string | null
  hoveredLinearFeatureId: string | null
}

export function getVisibleLinearFeatures(
  features: readonly LinearGeoFeature[],
  visibility: LinearFeatureLayerVisibility,
) {
  return features.filter(
    (feature) =>
      feature.id === visibility.selectedLinearFeatureId ||
      feature.id === visibility.hoveredLinearFeatureId ||
      visibility.showRiverAndCanalLayer,
  )
}

export function getCityLabelBudget(
  quality: 'balanced' | 'low',
  touchDevice: boolean,
) {
  return quality === 'low' || touchDevice ? 16 : 30
}

export function getCameraFlightDuration(reducedMotion: boolean) {
  return reducedMotion ? 0 : 1.05
}

export function shouldApplyCameraTargetRequest(
  appliedRequestId: number | null,
  nextRequestId: number,
) {
  return appliedRequestId !== nextRequestId
}
