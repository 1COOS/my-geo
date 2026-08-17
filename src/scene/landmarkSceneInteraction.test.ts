import { describe, expect, it } from 'vitest'

import { landmarks } from '../data/landmarks'
import {
  getLandmarkIdForLayer,
  getLandmarkLabelPriority,
  getLandmarkMarker,
  getVisibleLandmarks,
  type LandmarkMarker,
} from './landmarkSceneInteraction'

describe('landmark scene interaction', () => {
  const marker: LandmarkMarker = {
    markerType: 'landmark',
    landmarkId: 'great-wall',
    lat: 40.4319,
    lng: 116.5704,
    name: '长城',
  }

  it('shows landmarks only while the layer is active', () => {
    expect(
      getVisibleLandmarks(landmarks, { showLandmarkLayer: false }),
    ).toEqual([])
    expect(
      getVisibleLandmarks(landmarks, { showLandmarkLayer: true }),
    ).toHaveLength(30)
  })

  it('resolves only landmark point markers', () => {
    expect(getLandmarkMarker(marker)).toEqual(marker)
    expect(getLandmarkMarker({ markerType: 'city' })).toBeNull()
    expect(
      getLandmarkMarker({ markerType: 'landmark', landmarkId: '' }),
    ).toBeNull()
    expect(getLandmarkIdForLayer('point', marker)).toBe('great-wall')
    expect(getLandmarkIdForLayer('polygon', marker)).toBeNull()
    expect(getLandmarkIdForLayer('point', undefined)).toBeNull()
    expect(
      getLandmarkIdForLayer('point', {
        markerType: 'landmark',
        landmarkId: '',
      }),
    ).toBeNull()
  })

  it('prioritizes selected and hovered labels before ordinary landmarks', () => {
    const greatWall = landmarks[0]
    expect(
      getLandmarkLabelPriority(greatWall, {
        selectedLandmarkId: greatWall.id,
        hoveredLandmarkId: null,
      }),
    ).toBe(0)
    expect(
      getLandmarkLabelPriority(greatWall, {
        selectedLandmarkId: null,
        hoveredLandmarkId: greatWall.id,
      }),
    ).toBe(1)
    expect(
      getLandmarkLabelPriority(greatWall, {
        selectedLandmarkId: null,
        hoveredLandmarkId: null,
      }),
    ).toBeGreaterThan(2)
  })
})
