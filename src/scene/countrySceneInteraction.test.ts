import { describe, expect, it } from 'vitest'

import { countryBoundaries } from '../data/countries'
import {
  CITY_CAMERA_DISTANCE,
  getCameraFlightDuration,
  getCapitalLabelBudget,
  getCountryCodeForLayer,
  getGlobeViewOffset,
  getOverviewCameraPosition,
  GLOBE_VERTICAL_CENTER_RATIO,
  OVERVIEW_CAMERA_DISTANCE,
  PROXIMITY_ENTER_DISTANCE,
  PROXIMITY_EXIT_DISTANCE,
  resolveProximityCountryCode,
  type CityMarker,
} from './countrySceneInteraction'

describe('country scene interaction', () => {
  it('dispatches polygon and capital-point data to country codes', () => {
    const chinaBoundary = countryBoundaries.features.find(
      (boundary) => boundary.properties.code === 'CN',
    )
    const vaticanMarker: CityMarker = {
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

  it('uses 250/275 proximity hysteresis and clears ocean centers', () => {
    expect(PROXIMITY_ENTER_DISTANCE).toBe(250)
    expect(PROXIMITY_EXIT_DISTANCE).toBe(275)
    expect(resolveProximityCountryCode(null, 'CN', 250)).toBe('CN')
    expect(resolveProximityCountryCode(null, 'CN', 251)).toBeNull()
    expect(resolveProximityCountryCode('CN', 'CN', 275)).toBe('CN')
    expect(resolveProximityCountryCode('CN', 'CN', 276)).toBeNull()
    expect(resolveProximityCountryCode('CN', null, 190)).toBeNull()
  })

  it('limits adaptive labels for low quality and touch devices', () => {
    expect(getCapitalLabelBudget('balanced', false)).toBe(30)
    expect(getCapitalLabelBudget('balanced', true)).toBe(16)
    expect(getCapitalLabelBudget('low', false)).toBe(16)
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
