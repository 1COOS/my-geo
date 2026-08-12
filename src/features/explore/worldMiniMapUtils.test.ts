import { describe, expect, it } from 'vitest'

import { getCountry } from '../../data/countries'
import {
  findCountryAtPosition,
  invertMiniMapPoint,
  moveMiniMapCursor,
  projectGeoPosition,
} from './worldMiniMapUtils'

describe('world mini map utilities', () => {
  it('round-trips geographic coordinates through the map projection', () => {
    const position = { latitude: 39.9, longitude: 116.4 }
    const point = projectGeoPosition(position)

    expect(point).not.toBeNull()
    const invertedPosition = invertMiniMapPoint(point!.x, point!.y)
    expect(invertedPosition).not.toBeNull()
    expect(invertedPosition!.latitude).toBeCloseTo(position.latitude, 5)
    expect(invertedPosition!.longitude).toBeCloseTo(position.longitude, 5)
  })

  it('detects polygon countries, dateline countries, microstates, and ocean', () => {
    expect(findCountryAtPosition(getCountry('CN')!.center)).toBe('CN')
    expect(findCountryAtPosition({ latitude: -17.8, longitude: 177.9 })).toBe(
      'FJ',
    )
    expect(findCountryAtPosition(getCountry('VA')!.center)).toBe('VA')
    expect(findCountryAtPosition({ latitude: 0, longitude: -140 })).toBeNull()
  })

  it('clamps latitude and wraps longitude for keyboard navigation', () => {
    expect(moveMiniMapCursor({ latitude: 88, longitude: 175 }, 15, 15)).toEqual(
      { latitude: 90, longitude: -170 },
    )
  })
})
