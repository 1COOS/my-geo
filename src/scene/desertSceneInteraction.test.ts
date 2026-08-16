import { describe, expect, it } from 'vitest'

import { desertGeometries, deserts } from '../data/deserts'
import {
  getDesertGeometryForScene,
  getDesertIdForLayer,
  getDesertPolygonState,
  getVisibleDeserts,
} from './desertSceneInteraction'

describe('desert scene interaction', () => {
  it('shows deserts only while the layer is active', () => {
    expect(
      getVisibleDeserts(deserts, {
        showDesertLayer: true,
      }),
    ).toHaveLength(20)
    expect(
      getVisibleDeserts(deserts, {
        showDesertLayer: false,
      }),
    ).toEqual([])
  })

  it('uses low-detail polygons only in low quality', () => {
    const geometry = desertGeometries[0]
    expect(getDesertGeometryForScene(geometry, 'balanced')).toBe(
      geometry.geometry,
    )
    expect(getDesertGeometryForScene(geometry, 'low')).toBe(
      geometry.lowDetailGeometry,
    )
  })

  it('resolves only desert polygon features', () => {
    expect(
      getDesertIdForLayer('polygon', { properties: { desertId: 'sahara' } }),
    ).toBe('sahara')
    expect(
      getDesertIdForLayer('polygon', { properties: { waterbodyId: 'x' } }),
    ).toBeNull()
    expect(
      getDesertIdForLayer('path', { properties: { desertId: 'sahara' } }),
    ).toBeNull()
  })

  it('never treats a country polygon as selected when both ids are null', () => {
    expect(
      getDesertPolygonState({ properties: { code: 'CN' } }, null, null),
    ).toBeNull()
    expect(
      getDesertPolygonState(
        { properties: { desertId: 'sahara' } },
        'sahara',
        null,
      ),
    ).toBe('selected')
  })
})
