import { describe, expect, it } from 'vitest'

import { cities, countryBoundaries } from '../data/countries'
import { waterbodies } from '../data/waterbodies'
import { linearGeoFeatures } from '../data/linearGeoFeatures'
import {
  CITY_CAMERA_DISTANCE,
  getCameraFlightDuration,
  getCityLabelBudget,
  getCountryCodeForLayer,
  getGlobeViewOffset,
  getOverviewCameraPosition,
  getVisibleLayerCities,
  getVisibleLayerWaterbodies,
  getVisibleLinearFeatures,
  getLinearFeatureIdForLayer,
  getWaterbodyIdForLayer,
  GLOBE_VERTICAL_CENTER_RATIO,
  OVERVIEW_CAMERA_DISTANCE,
  shouldApplyCameraTargetRequest,
  type CityMarker,
} from './countrySceneInteraction'

describe('country scene interaction', () => {
  it('dispatches polygon and capital-point data to country codes', () => {
    const chinaBoundary = countryBoundaries.features.find(
      (boundary) => boundary.properties.code === 'CN',
    )
    const vaticanMarker: CityMarker = {
      markerType: 'city',
      cityId: 'va-vatican-city',
      countryCode: 'VA',
      lat: 41.904,
      lng: 12.453,
      name: '梵蒂冈城',
      isCapital: true,
    }

    expect(getCountryCodeForLayer('polygon', chinaBoundary)).toBe('CN')
    expect(getCountryCodeForLayer('point', vaticanMarker)).toBe('VA')
    expect(getCountryCodeForLayer('globe', {})).toBeNull()
  })

  it('disables camera tweening for reduced motion', () => {
    expect(getCameraFlightDuration(false)).toBeGreaterThan(0)
    expect(getCameraFlightDuration(true)).toBe(0)
  })

  it('applies each explicit camera request only once', () => {
    expect(shouldApplyCameraTargetRequest(null, 0)).toBe(true)
    expect(shouldApplyCameraTargetRequest(0, 0)).toBe(false)
    expect(shouldApplyCameraTargetRequest(0, 1)).toBe(true)
  })

  it('defines the shared overview camera distance', () => {
    expect(OVERVIEW_CAMERA_DISTANCE).toBe(425)
    const position = getOverviewCameraPosition({ x: 20, y: -40, z: 80 })
    expect(Math.hypot(position.x, position.y, position.z)).toBeCloseTo(
      OVERVIEW_CAMERA_DISTANCE,
    )
  })

  it('supports a closer city camera distance', () => {
    const position = getOverviewCameraPosition(
      { x: 20, y: -40, z: 80 },
      CITY_CAMERA_DISTANCE,
    )

    expect(CITY_CAMERA_DISTANCE).toBe(190)
    expect(Math.hypot(position.x, position.y, position.z)).toBeCloseTo(190)
  })

  it('limits adaptive labels for low quality and touch devices', () => {
    expect(getCityLabelBudget('balanced', false)).toBe(30)
    expect(getCityLabelBudget('balanced', true)).toBe(16)
    expect(getCityLabelBudget('low', false)).toBe(16)
  })

  it('filters mutually exclusive capital and city layers with selection exceptions', () => {
    const beijing = cities.find((city) => city.id === 'cn-beijing')!
    const shanghai = cities.find((city) => city.id === 'cn-shanghai')!
    const sample = [beijing, shanghai]

    expect(
      getVisibleLayerCities(sample, {
        showCapitals: false,
        showCities: false,
        selectedCityId: null,
        hoveredCityId: null,
      }),
    ).toEqual([])
    expect(
      getVisibleLayerCities(sample, {
        showCapitals: true,
        showCities: false,
        selectedCityId: null,
        hoveredCityId: null,
      }),
    ).toEqual([beijing])
    expect(
      getVisibleLayerCities(sample, {
        showCapitals: false,
        showCities: true,
        selectedCityId: null,
        hoveredCityId: null,
      }),
    ).toEqual([shanghai])
    expect(
      getVisibleLayerCities(sample, {
        showCapitals: true,
        showCities: true,
        selectedCityId: null,
        hoveredCityId: null,
      }),
    ).toEqual(sample)
    expect(
      getVisibleLayerCities(sample, {
        showCapitals: false,
        showCities: false,
        selectedCityId: shanghai.id,
        hoveredCityId: beijing.id,
      }),
    ).toEqual(sample)
  })

  it('filters ocean and waterway layers with selection exceptions', () => {
    const pacific = waterbodies.find((item) => item.id === 'pacific-ocean')!
    const mariana = waterbodies.find((item) => item.id === 'mariana-trench')!
    const sample = [pacific, mariana]
    expect(
      getVisibleLayerWaterbodies(sample, {
        showOceanLayer: true,
        showWaterwayLayer: false,
        selectedWaterbodyId: null,
        hoveredWaterbodyId: null,
      }),
    ).toEqual([pacific])
    expect(
      getVisibleLayerWaterbodies(sample, {
        showOceanLayer: false,
        showWaterwayLayer: false,
        selectedWaterbodyId: mariana.id,
        hoveredWaterbodyId: pacific.id,
      }),
    ).toEqual(sample)
    expect(getWaterbodyIdForLayer('path', { waterbodyId: mariana.id })).toBe(
      mariana.id,
    )
  })

  it('toggles rivers and canals together while preserving selected lines', () => {
    const river = linearGeoFeatures.find((feature) => feature.kind === 'river')!
    const canal = linearGeoFeatures.find((feature) => feature.kind === 'canal')!
    expect(
      getVisibleLinearFeatures([river, canal], {
        showRiverAndCanalLayer: true,
        selectedLinearFeatureId: null,
        hoveredLinearFeatureId: null,
      }),
    ).toEqual([river, canal])
    expect(
      getVisibleLinearFeatures([river, canal], {
        showRiverAndCanalLayer: false,
        selectedLinearFeatureId: canal.id,
        hoveredLinearFeatureId: river.id,
      }),
    ).toEqual([river, canal])
    expect(
      getLinearFeatureIdForLayer('path', { linearFeatureId: river.id }),
    ).toBe(river.id)
  })

  it('exposes 197 capitals and 141 non-capital cities without overlap', () => {
    const capitals = getVisibleLayerCities(cities, {
      showCapitals: true,
      showCities: false,
      selectedCityId: null,
      hoveredCityId: null,
    })
    const nonCapitalCities = getVisibleLayerCities(cities, {
      showCapitals: false,
      showCities: true,
      selectedCityId: null,
      hoveredCityId: null,
    })
    const allCities = getVisibleLayerCities(cities, {
      showCapitals: true,
      showCities: true,
      selectedCityId: null,
      hoveredCityId: null,
    })

    expect(capitals).toHaveLength(197)
    expect(capitals.every((city) => city.isCapital)).toBe(true)
    expect(nonCapitalCities).toHaveLength(141)
    expect(nonCapitalCities.every((city) => !city.isCapital)).toBe(true)
    expect(allCities).toHaveLength(338)
    expect(new Set(allCities.map((city) => city.id)).size).toBe(338)
  })

  it('places the globe center at 45 percent of the viewport height', () => {
    const offset = getGlobeViewOffset(1000, 800)

    expect(GLOBE_VERTICAL_CENTER_RATIO).toBe(0.45)
    expect(offset).toMatchObject({
      fullWidth: 1000,
      fullHeight: 800,
      offsetX: 0,
      width: 1000,
      height: 800,
    })
    expect(offset.offsetY).toBeCloseTo(40)
  })
})
