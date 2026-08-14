import { describe, expect, it } from 'vitest'

import {
  getMountainRange,
  getMountainRangeGeometry,
  mountainRanges,
} from '../data/mountainRanges'
import {
  getMountainGeometryForScene,
  getMountainRangeIdForLayer,
  getVisibleMountainRanges,
} from './mountainSceneInteraction'

describe('mountain scene interaction', () => {
  it('shows the layer catalogue and retains selected or hovered ranges', () => {
    expect(
      getVisibleMountainRanges(mountainRanges, {
        showMountainLayer: true,
        selectedMountainRangeId: null,
        hoveredMountainRangeId: null,
      }),
    ).toHaveLength(30)
    expect(
      getVisibleMountainRanges(mountainRanges, {
        showMountainLayer: false,
        selectedMountainRangeId: 'himalayas',
        hoveredMountainRangeId: 'andes',
      }).map((range) => range.id),
    ).toEqual(['himalayas', 'andes'])
  })

  it('uses high detail only for the selected range', () => {
    const geometry = getMountainRangeGeometry('himalayas')!
    expect(getMountainGeometryForScene(geometry, 'balanced', false)).toBe(
      geometry.mediumDetailGeometry,
    )
    expect(getMountainGeometryForScene(geometry, 'low', false)).toBe(
      geometry.lowDetailGeometry,
    )
    expect(getMountainGeometryForScene(geometry, 'low', true)).toBe(
      geometry.geometry,
    )
  })

  it('resolves mountain paths without colliding with other path types', () => {
    const himalayas = getMountainRange('himalayas')!
    expect(
      getMountainRangeIdForLayer('path', { mountainRangeId: himalayas.id }),
    ).toBe('himalayas')
    expect(getMountainRangeIdForLayer('path', { linearFeatureId: 'x' })).toBe(
      null,
    )
    expect(getMountainRangeIdForLayer('point', { mountainRangeId: 'x' })).toBe(
      null,
    )
  })
})
