import { describe, expect, it } from 'vitest'

import { getLinearGeoFeatureGeometry } from '../data/linearGeoFeatures'
import {
  getCanalCameraDistance,
  getLinearFeatureAngularSpan,
  getLinearFeatureEndpointPairs,
  getLinearFeatureEndpoints,
  getLinearFeatureGeometryForScene,
  getSelectedLinearFeatureLabelOffset,
  MAX_CANAL_CAMERA_DISTANCE,
  MIN_CANAL_CAMERA_DISTANCE,
} from './linearFeatureSceneInteraction'

describe('linear feature scene interaction', () => {
  const corinth = getLinearGeoFeatureGeometry('corinth-canal')!.geometry
  const suez = getLinearGeoFeatureGeometry('suez-canal')!.geometry
  const grandCanal = getLinearGeoFeatureGeometry('grand-canal-china')!.geometry

  it('extracts the reviewed route start and end without changing coordinates', () => {
    expect(getLinearFeatureEndpoints(suez)).toEqual({
      start: { longitude: 32.3, latitude: 31.3 },
      end: { longitude: 32.55, latitude: 29.9 },
    })
  })

  it('uses closer views for short canals and regional views for long canals', () => {
    const distances = [
      getCanalCameraDistance(corinth),
      getCanalCameraDistance(suez),
      getCanalCameraDistance(grandCanal),
    ]

    expect(getLinearFeatureAngularSpan(corinth)).toBeLessThan(
      getLinearFeatureAngularSpan(suez),
    )
    expect(getLinearFeatureAngularSpan(suez)).toBeLessThan(
      getLinearFeatureAngularSpan(grandCanal),
    )
    expect(distances[0]).toBeLessThan(distances[1])
    expect(distances[1]).toBeLessThan(distances[2])
    expect(distances[0]).toBeGreaterThanOrEqual(MIN_CANAL_CAMERA_DISTANCE)
    expect(distances[2]).toBeLessThanOrEqual(MAX_CANAL_CAMERA_DISTANCE)
    expect(distances[1]).toBeGreaterThanOrEqual(180)
    expect(distances[1]).toBeLessThanOrEqual(200)
  })

  it('offsets the selected label away from the route center', () => {
    const offset = getSelectedLinearFeatureLabelOffset([
      { x: 100, y: 160 },
      { x: 110, y: 110 },
    ])

    expect(Math.hypot(offset.x, offset.y)).toBeGreaterThan(24)
    expect(offset.y).toBeLessThan(0)
  })

  it('uses medium detail normally, low detail on low quality and high detail when selected', () => {
    const geometry = getLinearGeoFeatureGeometry('yangtze-system')!

    expect(getLinearFeatureGeometryForScene(geometry, 'balanced', false)).toBe(
      geometry.mediumDetailGeometry,
    )
    expect(getLinearFeatureGeometryForScene(geometry, 'low', false)).toBe(
      geometry.lowDetailGeometry,
    )
    expect(getLinearFeatureGeometryForScene(geometry, 'low', true)).toBe(
      geometry.geometry,
    )
  })

  it('extracts a source and mouth pair for every compound main stem', () => {
    const geometry = getLinearGeoFeatureGeometry(
      'mississippi-missouri-system',
    )!.geometry

    expect(getLinearFeatureEndpointPairs(geometry)).toHaveLength(2)
  })
})
