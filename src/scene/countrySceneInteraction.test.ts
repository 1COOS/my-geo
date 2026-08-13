import { describe, expect, it } from 'vitest'

import { countryBoundaries } from '../data/countries'
import {
  getCameraFlightDuration,
  getCountryCodeForLayer,
  getGlobeViewOffset,
  getOverviewCameraPosition,
  GLOBE_VERTICAL_CENTER_RATIO,
  OVERVIEW_CAMERA_DISTANCE,
  type CapitalMarker,
} from './countrySceneInteraction'

describe('country scene interaction', () => {
  it('dispatches polygon and capital-point data to country codes', () => {
    const chinaBoundary = countryBoundaries.features.find(
      (boundary) => boundary.properties.code === 'CN',
    )
    const vaticanMarker: CapitalMarker = {
      countryCode: 'VA',
      lat: 41.904,
      lng: 12.453,
      name: '梵蒂冈城',
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
