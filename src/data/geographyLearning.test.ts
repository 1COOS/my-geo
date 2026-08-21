import { describe, expect, it } from 'vitest'

import {
  formatReferenceLineCoordinate,
  geographyLearningOverview,
  geographyLearningSources,
  geographyReferenceLines,
  geographyTopics,
  getGeographyTopicReferenceLines,
  getReferenceLineScenePoints,
  resolveGeographyExploreSelection,
  resolveGeographyLearningSelection,
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
    expect(geographyLearningOverview.name.zh).toBe('地球经纬线')
    expect(geographyLearningOverview.eyebrow).not.toContain('初中地理')
    expect(geographyLearningOverview.sourceIds).toEqual([
      'moe-geography-curriculum-2022',
      'britannica-latitude-longitude',
    ])
    expect(geographyTopics.map((topic) => topic.shortName.zh)).toEqual([
      '经度基准',
      '半球界线',
      '纬度分区',
      '五带界线',
    ])
    expect(geographyTopics.map((topic) => topic.name.zh)).toEqual([
      '经度基准',
      '半球界线',
      '纬度分区线',
      '五带分界线',
    ])
    expect(
      geographyTopics.every(
        (topic) => topic.visualization.kind === 'reference-lines',
      ),
    ).toBe(true)
  })

  it('validates shareable topic and reference-line selections', () => {
    expect(resolveGeographyLearningSelection('hemispheres', 'equator')).toEqual(
      { topicId: 'hemispheres', referenceLineId: 'equator' },
    )
    expect(
      resolveGeographyLearningSelection('grid-reading', 'equator'),
    ).toEqual({ topicId: 'grid-reading', referenceLineId: null })
    expect(resolveGeographyLearningSelection('unknown', 'equator')).toBeNull()

    expect(
      resolveGeographyExploreSelection('earth-zones', 'tropic-of-cancer'),
    ).toEqual({
      kind: 'line',
      topicId: 'earth-zones',
      referenceLineId: 'tropic-of-cancer',
    })
    expect(resolveGeographyExploreSelection('grid-reading', 'equator')).toEqual(
      { kind: 'overview', focusTopicId: 'grid-reading' },
    )
    expect(resolveGeographyExploreSelection('unknown', 'equator')).toBeNull()
  })

  it('groups every reviewed line into exactly one usage category', () => {
    const groupedLines = geographyTopics.flatMap((topic) =>
      getGeographyTopicReferenceLines(topic.id),
    )

    expect(groupedLines).toHaveLength(13)
    expect(new Set(groupedLines.map((line) => line.id)).size).toBe(13)
    expect(
      getGeographyTopicReferenceLines('earth-zones').map((line) => line.id),
    ).toEqual([
      'tropic-of-cancer',
      'tropic-of-capricorn',
      'arctic-circle',
      'antarctic-circle',
    ])
  })

  it('formats coordinates consistently across overview and detail cards', () => {
    expect(formatReferenceLineCoordinate(geographyReferenceLines[0])).toBe('0°')
    expect(
      formatReferenceLineCoordinate(
        geographyReferenceLines.find((line) => line.id === 'tropic-of-cancer')!,
      ),
    ).toBe('23.5°N')
    expect(
      formatReferenceLineCoordinate(
        geographyReferenceLines.find(
          (line) => line.id === 'western-hemisphere-boundary',
        )!,
      ),
    ).toBe('20°W')
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
