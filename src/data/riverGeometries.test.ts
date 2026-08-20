import { describe, expect, it } from 'vitest'

import { getLinearGeoFeatureGeometry } from './geometryData'

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

function expectRouteNear(id: string, controls: Position[], maximum = 110) {
  const points = getLinearGeoFeatureGeometry(id)!.geometry.coordinates.flat()
  for (const control of controls) {
    expect(
      Math.min(...points.map((point) => distanceKilometers(point, control))),
      `${id} should pass near ${control.join(',')}`,
    ).toBeLessThan(maximum)
  }
}

describe('generated river main stems', () => {
  it('preserves representative bends and cities along major rivers', () => {
    expectRouteNear('yangtze-system', [
      [106.55, 29.56],
      [114.3, 30.59],
      [118.8, 32.05],
    ])
    expectRouteNear('yellow-river-system', [
      [106.5, 37.5],
      [111, 40.2],
    ])
    expectRouteNear('danube-system', [[19.05, 47.5]])
    expectRouteNear('nile-system', [[31.24, 30.12]])
    expectRouteNear('amazon-system', [[-60, -3.2]])
  })

  it('uses the reviewed Chinese Pearl River chain, not the American river', () => {
    expectRouteNear(
      'pearl-river-system',
      [
        [103.92, 25.88],
        [109.53, 23.8],
        [113.56, 22.58],
      ],
      45,
    )
  })

  it('keeps both named main stems for compound systems', () => {
    for (const id of [
      'ganges-brahmaputra-system',
      'tigris-euphrates-system',
      'ob-irtysh-system',
      'mississippi-missouri-system',
      'parana-paraguay-system',
      'murray-darling-system',
    ]) {
      expect(
        getLinearGeoFeatureGeometry(id)!.geometry.coordinates,
      ).toHaveLength(2)
    }
  })

  it('records explicit supplements for all five known Natural Earth gaps', () => {
    for (const id of [
      'yangtze-system',
      'mekong-system',
      'amazon-system',
      'parana-paraguay-system',
      'saint-lawrence-great-lakes-system',
    ]) {
      expect(
        getLinearGeoFeatureGeometry(id)!.provenance?.supplements.length,
      ).toBeGreaterThan(0)
    }
  })

  it('stays within ordinary and selected point budgets', () => {
    const ids = [
      'yangtze-system',
      'yellow-river-system',
      'pearl-river-system',
      'mekong-system',
      'ganges-brahmaputra-system',
      'indus-system',
      'tigris-euphrates-system',
      'ob-irtysh-system',
      'yenisei-angara-system',
      'lena-system',
      'amur-system',
      'volga-system',
      'danube-system',
      'rhine-system',
      'nile-system',
      'congo-system',
      'niger-system',
      'zambezi-system',
      'orange-system',
      'mississippi-missouri-system',
      'mackenzie-system',
      'saint-lawrence-great-lakes-system',
      'colorado-system',
      'rio-grande-system',
      'yukon-system',
      'amazon-system',
      'parana-paraguay-system',
      'orinoco-system',
      'sao-francisco-system',
      'murray-darling-system',
    ]
    const geometries = ids.map((id) => getLinearGeoFeatureGeometry(id)!)
    expect(
      geometries.reduce(
        (total, geometry) =>
          total + geometry.mediumDetailGeometry.coordinates.flat().length,
        0,
      ),
    ).toBeLessThanOrEqual(10_000)
    expect(
      geometries.reduce(
        (total, geometry) =>
          total + geometry.lowDetailGeometry.coordinates.flat().length,
        0,
      ),
    ).toBeLessThanOrEqual(3_000)
    for (const geometry of geometries) {
      expect(geometry.geometry.coordinates.flat().length).toBeLessThanOrEqual(
        4_000,
      )
    }
  })
})
