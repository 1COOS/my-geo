import { describe, expect, it } from 'vitest'

import { countriesByCode, countrySourcesById } from './countries'
import { landmarks } from './landmarks'

describe('landmark catalogue', () => {
  it('contains the reviewed 30 cultural and historic landmarks', () => {
    expect(landmarks).toHaveLength(30)
    expect(landmarks.slice(0, 5).map((landmark) => landmark.id)).toEqual([
      'great-wall',
      'forbidden-city',
      'terracotta-army',
      'himeji-castle',
      'angkor-wat',
    ])
    expect(new Set(landmarks.map((landmark) => landmark.id)).size).toBe(30)
  })

  it('keeps country and source references valid', () => {
    const authoritativeSourceIds = new Set([
      'unesco-world-heritage',
      'bavaria-neuschwanstein',
    ])
    for (const landmark of landmarks) {
      expect(countriesByCode.has(landmark.countryCode)).toBe(true)
      expect(
        landmark.sourceIds.every((sourceId) =>
          countrySourcesById.has(sourceId),
        ),
      ).toBe(true)
      expect(
        landmark.sourceIds.some((sourceId) =>
          authoritativeSourceIds.has(sourceId),
        ),
      ).toBe(true)
      expect(landmark.facts.length).toBeGreaterThanOrEqual(2)
      expect(landmark.features.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('covers every inhabited continent represented by the app', () => {
    const continents = new Set(
      landmarks.map(
        (landmark) => countriesByCode.get(landmark.countryCode)!.continent.en,
      ),
    )

    expect(continents).toEqual(
      new Set(['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']),
    )
    expect(
      landmarks.reduce<Record<string, number>>((counts, landmark) => {
        const continent = countriesByCode.get(landmark.countryCode)!.continent
          .en
        counts[continent] = (counts[continent] ?? 0) + 1
        return counts
      }, {}),
    ).toEqual({ Asia: 11, Europe: 6, Africa: 5, Americas: 6, Oceania: 2 })
  })
})
