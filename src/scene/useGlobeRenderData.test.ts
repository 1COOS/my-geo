import { describe, expect, it } from 'vitest'

import { countryBoundaries } from '../data/geometryData'
import { getGlobePolygonData } from './useGlobeRenderData'

describe('globe polygon render data', () => {
  it('renders Antarctica before interactive countries', () => {
    const polygons = getGlobePolygonData(countryBoundaries, [], [], null)

    expect(polygons[0]).toBe(countryBoundaries.landmasses[0])
    expect(polygons).toContain(
      countryBoundaries.features.find(
        (feature) => feature.properties.code === 'CN',
      ),
    )
  })
})
