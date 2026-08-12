import { describe, expect, it } from 'vitest'

import { countryBoundaries } from '../data/countries'
import {
  getCameraFlightDuration,
  getCountryCodeForLayer,
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
})
