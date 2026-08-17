import { describe, expect, it } from 'vitest'

import {
  geographyLearningSources,
  geographyReferenceLines,
  geographyTopics,
  getReferenceLineScenePoints,
} from './geographyLearning'

describe('geography learning catalogue', () => {
  it('keeps four reviewed topics and the complete reference-line set', () => {
    expect(geographyTopics.map((topic) => topic.id)).toEqual([
      'grid-reading',
      'hemispheres',
      'latitude-zones',
      'earth-zones',
    ])
    expect(geographyReferenceLines).toHaveLength(13)
    expect(new Set(geographyReferenceLines.map((line) => line.id)).size).toBe(
      13,
    )
    expect(geographyLearningSources).toHaveLength(2)
  })

  it('generates complete latitude circles and pole-to-pole meridians', () => {
    const equator = geographyReferenceLines.find(
      (line) => line.id === 'equator',
    )!
    const primeMeridian = geographyReferenceLines.find(
      (line) => line.id === 'prime-meridian',
    )!
    const latitudePoints = getReferenceLineScenePoints(equator)
    const longitudePoints = getReferenceLineScenePoints(primeMeridian)

    expect(latitudePoints[0]).toEqual([0, -180])
    expect(latitudePoints.at(-1)).toEqual([0, 180])
    expect(longitudePoints[0][0]).toBeCloseTo(-89.5)
    expect(longitudePoints.at(-1)?.[0]).toBeCloseTo(89.5)
    expect(longitudePoints.every((point) => point[1] === 0)).toBe(true)
  })
})
