import { describe, expect, it } from 'vitest'

import { cities } from '../data/countries'
import { geographyReferenceLines } from '../data/geographyLearning'
import { waterbodies } from '../data/waterbodies'
import {
  getLabelGroup,
  getLabelPriority,
  getLabelVisibilityChanges,
  labelRectsOverlap,
  type MapLabel,
} from './globeLabelLayout'

const emptyPriorityState = {
  selectedCityId: null,
  hoveredCityId: null,
  selectedWaterbodyId: null,
  hoveredWaterbodyId: null,
  selectedLinearFeatureId: null,
  hoveredLinearFeatureId: null,
  selectedMountainRangeId: null,
  hoveredMountainRangeId: null,
  selectedDesertId: null,
  hoveredDesertId: null,
  selectedLandmarkId: null,
  hoveredLandmarkId: null,
  selectedReferenceLineId: null,
}

describe('globe label layout', () => {
  it('keeps selected and hovered entities ahead of ordinary labels', () => {
    const city = cities.find((item) => item.isCapital)!
    const label: MapLabel = {
      id: city.id,
      type: 'city',
      latitude: city.latitude,
      longitude: city.longitude,
      city,
    }

    expect(
      getLabelPriority(label, {
        ...emptyPriorityState,
        selectedCityId: city.id,
      }),
    ).toBe(0)
    expect(
      getLabelPriority(label, {
        ...emptyPriorityState,
        hoveredCityId: city.id,
      }),
    ).toBe(1)
    expect(getLabelPriority(label, emptyPriorityState)).toBeGreaterThan(1)
    expect(getLabelGroup(label)).toBe('capital')
  })

  it('classifies water and geography labels into collision groups', () => {
    const waterbody = waterbodies.find((item) => item.layer === 'lake')!
    const line = geographyReferenceLines[0]
    expect(
      getLabelGroup({
        id: waterbody.id,
        type: 'waterbody',
        latitude: waterbody.center.latitude,
        longitude: waterbody.center.longitude,
        waterbody,
      }),
    ).toBe('lake')
    expect(
      getLabelGroup({
        id: line.id,
        type: 'referenceLine',
        latitude: line.anchorPosition.latitude,
        longitude: line.anchorPosition.longitude,
        line,
      }),
    ).toBe('geography')
  })

  it('detects overlapping label rectangles without allocating geometry', () => {
    const base = { left: 0, top: 0, right: 20, bottom: 20 }
    expect(
      labelRectsOverlap(base, { left: 10, top: 10, right: 30, bottom: 30 }),
    ).toBe(true)
    expect(
      labelRectsOverlap(base, { left: 21, top: 0, right: 30, bottom: 20 }),
    ).toBe(false)
  })

  it('changes DOM visibility only when label membership changes', () => {
    expect(
      getLabelVisibilityChanges(
        new Set(['capital-beijing', 'city-shanghai']),
        new Set(['capital-beijing', 'city-guangzhou']),
      ),
    ).toEqual({
      hiddenIds: ['city-shanghai'],
      shownIds: ['city-guangzhou'],
    })
    expect(
      getLabelVisibilityChanges(
        new Set(['capital-beijing']),
        new Set(['capital-beijing']),
      ),
    ).toEqual({ hiddenIds: [], shownIds: [] })
  })
})
