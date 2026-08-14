import { describe, expect, it } from 'vitest'

import { countriesByCode } from './countries'
import { mountainRangeGeometries, mountainRanges } from './mountainRanges'

type Position = readonly [number, number]

function distanceKilometers(left: Position, right: Position) {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const latitudeDelta = toRadians(right[1] - left[1])
  const longitudeDelta = toRadians(right[0] - left[0])
  const leftLatitude = toRadians(left[1])
  const rightLatitude = toRadians(right[1])
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) *
      Math.cos(rightLatitude) *
      Math.sin(longitudeDelta / 2) ** 2
  return 12_742 * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

describe('mountain range catalogue', () => {
  it('contains the fixed 30 famous mountain ranges and reviewed Natural Earth ids', () => {
    expect(mountainRanges).toHaveLength(30)
    expect(mountainRangeGeometries).toHaveLength(30)
    expect(
      mountainRangeGeometries.map(
        (geometry) => geometry.provenance.naturalEarthNeId,
      ),
    ).toEqual([
      1159104307, 1159104185, 1159104183, 1159104181, 1159104299, 1159104187,
      1159104169, 1159104171, 1159103573, 1159104167, 1159104297, 1159103941,
      1159103937, 1159103939, 1159103935, 1159104301, 1159104305, 1159104189,
      1159104165, 1159103881, 1730070733, 1159104311, 1159104191, 1159104201,
      1159103951, 1159104199, 1159104309, 1159104295, 1159104623, 1730072617,
    ])
  })

  it('matches valid countries, peaks, sources, and monotonic geometry', () => {
    const geometries = new Map(
      mountainRangeGeometries.map((geometry) => [geometry.id, geometry]),
    )
    for (const range of mountainRanges) {
      const geometry = geometries.get(range.id)!
      expect(geometry).toBeDefined()
      for (const countryCode of [
        ...range.countryCodes,
        ...range.highestPeak.countryCodes,
      ]) {
        expect(countriesByCode.has(countryCode)).toBe(true)
      }
      expect(range.sourceIds.length).toBeGreaterThan(0)
      expect(geometry.geometry.coordinates).toHaveLength(
        geometry.mediumDetailGeometry.coordinates.length,
      )
      expect(geometry.geometry.coordinates).toHaveLength(
        geometry.lowDetailGeometry.coordinates.length,
      )
      geometry.geometry.coordinates.forEach((line, index) => {
        expect(line.length).toBeGreaterThanOrEqual(
          geometry.mediumDetailGeometry.coordinates[index].length,
        )
        expect(
          geometry.mediumDetailGeometry.coordinates[index].length,
        ).toBeGreaterThanOrEqual(
          geometry.lowDetailGeometry.coordinates[index].length,
        )
        const peak = [
          range.highestPeak.position.longitude,
          range.highestPeak.position.latitude,
        ] as const
        expect(
          Math.min(...line.map((point) => distanceKilometers(point, peak))),
        ).toBeLessThan(85)
      })
    }
  })

  it('stays inside ordinary geometry budgets', () => {
    expect(
      mountainRangeGeometries.reduce(
        (total, geometry) =>
          total + geometry.mediumDetailGeometry.coordinates.flat().length,
        0,
      ),
    ).toBeLessThanOrEqual(4_200)
    expect(
      mountainRangeGeometries.reduce(
        (total, geometry) =>
          total + geometry.lowDetailGeometry.coordinates.flat().length,
        0,
      ),
    ).toBeLessThanOrEqual(1_440)
  })

  it('preserves representative ridge directions and control points', () => {
    const geometryById = new Map(
      mountainRangeGeometries.map((geometry) => [geometry.id, geometry]),
    )
    for (const [id, controls] of [
      ['himalayas', [[86.925, 27.9881]]],
      ['qinling', [[107.75, 33.95]]],
      ['ural-mountains', [[60.118, 65.035]]],
      ['andes', [[-70.01, -32.653]]],
      ['rocky-mountains', [[-106.4454, 39.1178]]],
      ['great-dividing-range', [[148.263, -36.455]]],
    ] as const) {
      const points = geometryById.get(id)!.geometry.coordinates.flat()
      for (const control of controls) {
        expect(
          Math.min(
            ...points.map((point) => distanceKilometers(point, control)),
          ),
        ).toBeLessThan(40)
      }
    }
  })
})
