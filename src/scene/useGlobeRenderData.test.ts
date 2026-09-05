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

  it('adds a selected territory overlay without changing the country set', () => {
    const territoryBoundary = {
      type: 'Feature',
      properties: { territoryId: 'greenland' },
      geometry: { type: 'Polygon', coordinates: [] },
    }
    const polygons = getGlobePolygonData(
      countryBoundaries,
      [],
      [],
      null,
      territoryBoundary,
    )

    expect(polygons.at(-1)).toBe(territoryBoundary)
    expect(polygons).toHaveLength(
      countryBoundaries.features.length +
        countryBoundaries.landmasses.length +
        1,
    )
  })
})
