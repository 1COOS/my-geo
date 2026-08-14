import { describe, expect, it } from 'vitest'

import { countriesByCode } from './countries'
import {
  linearGeoFeatureGeometries,
  linearGeoFeatures,
} from './linearGeoFeatures'

describe('linear geography catalogue', () => {
  it('contains 30 river systems and 10 artificial canals', () => {
    expect(linearGeoFeatures).toHaveLength(40)
    expect(
      linearGeoFeatures.filter((feature) => feature.kind === 'river'),
    ).toHaveLength(30)
    expect(
      linearGeoFeatures.filter((feature) => feature.kind === 'canal'),
    ).toHaveLength(10)
  })

  it('matches each feature to valid high, medium and low detail geometry', () => {
    const geometries = new Map(
      linearGeoFeatureGeometries.map((geometry) => [geometry.id, geometry]),
    )
    for (const feature of linearGeoFeatures) {
      const geometry = geometries.get(feature.id)
      expect(geometry).toBeDefined()
      expect(geometry?.geometry.coordinates.length).toBe(
        geometry?.mediumDetailGeometry.coordinates.length,
      )
      expect(geometry?.geometry.coordinates.length).toBe(
        geometry?.lowDetailGeometry.coordinates.length,
      )
      geometry?.geometry.coordinates.forEach((line, index) => {
        expect(line.length).toBeGreaterThanOrEqual(
          geometry.mediumDetailGeometry.coordinates[index].length,
        )
        expect(
          geometry.mediumDetailGeometry.coordinates[index].length,
        ).toBeGreaterThanOrEqual(
          geometry.lowDetailGeometry.coordinates[index].length,
        )
      })
      for (const code of feature.countryCodes) {
        expect(countriesByCode.has(code)).toBe(true)
      }
    }
  })
})
