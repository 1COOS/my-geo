import { geoContains } from 'd3-geo'
import { describe, expect, it } from 'vitest'

import { countriesByCode, countrySourcesById } from './countries'
import { desertGeometries, deserts } from './deserts'

function countPoints(
  geometry: (typeof desertGeometries)[number]['lowDetailGeometry'],
) {
  return geometry.type === 'Polygon'
    ? geometry.coordinates.flat().length
    : geometry.coordinates.flat(2).length
}

describe('desert catalogue', () => {
  it('contains 20 major deserts with reviewed local geometry', () => {
    expect(deserts).toHaveLength(20)
    expect(desertGeometries).toHaveLength(20)
    expect(deserts.slice(0, 3).map((desert) => desert.id)).toEqual([
      'sahara',
      'gobi',
      'rub-al-khali',
    ])
  })

  it('keeps representative centers inside valid, closed polygons', () => {
    const geometriesById = new Map(
      desertGeometries.map((geometry) => [geometry.id, geometry]),
    )
    for (const desert of deserts) {
      const geometry = geometriesById.get(desert.id)!
      expect(
        geoContains(
          { type: 'Feature', properties: {}, geometry: geometry.geometry },
          [desert.center.longitude, desert.center.latitude],
        ),
      ).toBe(true)
      const polygons =
        geometry.geometry.type === 'Polygon'
          ? [geometry.geometry.coordinates]
          : geometry.geometry.coordinates
      for (const polygon of polygons) {
        for (const ring of polygon) {
          expect(ring[0]).toEqual(ring.at(-1))
        }
      }
    }
  })

  it('uses valid country and source ids and stays within the low-detail budget', () => {
    for (const desert of deserts) {
      expect(
        desert.countryCodes.every((code) => countriesByCode.has(code)),
      ).toBe(true)
      expect(desert.sourceIds.every((id) => countrySourcesById.has(id))).toBe(
        true,
      )
    }
    expect(
      desertGeometries.reduce(
        (total, geometry) => total + countPoints(geometry.lowDetailGeometry),
        0,
      ),
    ).toBeLessThanOrEqual(3_600)
    expect(
      desertGeometries.every(
        (geometry) => countPoints(geometry.lowDetailGeometry) <= 260,
      ),
    ).toBe(true)
  })
})
