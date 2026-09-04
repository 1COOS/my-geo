import { describe, expect, it } from 'vitest'

import { countries } from '../../data/countries'
import { countryBoundaries } from '../../data/geometryData'
import { knowledgeRegions } from '../../data/knowledgeRegions'
import {
  createKnowledgeRegionMapProjection,
  getCircularMeanLongitude,
  projectKnowledgeRegionMapPosition,
} from './knowledgeRegionMapProjection'

describe('knowledge region map projection', () => {
  it('uses a circular longitude mean across the antimeridian', () => {
    const longitude = getCircularMeanLongitude([
      { latitude: 0, longitude: 170 },
      { latitude: 0, longitude: -170 },
    ])

    expect(Math.abs(Math.abs(longitude) - 180)).toBeLessThan(0.001)
  })

  it.each([
    { width: 720, height: 240 },
    { width: 154, height: 120 },
  ])('fits every curated region inside $width×$height', (viewport) => {
    const boundaryByCode = new Map(
      countryBoundaries.features.map((feature) => [
        feature.properties.code,
        feature,
      ]),
    )

    for (const region of knowledgeRegions) {
      const regionCountries = countries.filter((country) =>
        region.countryCodes.includes(country.code),
      )
      const boundaries = region.countryCodes.flatMap((code) => {
        const boundary = boundaryByCode.get(code)
        return boundary ? [boundary] : []
      })
      const map = createKnowledgeRegionMapProjection({
        boundaries,
        positions: regionCountries.map((country) => country.center),
        viewport,
      })

      expect(map.width).toBe(viewport.width)
      expect(map.height).toBe(viewport.height)
      for (const boundary of boundaries) {
        expect(map.path(boundary as never)).not.toBe('')
      }
      for (const country of regionCountries) {
        const point = projectKnowledgeRegionMapPosition(
          map.projection,
          country.center,
        )
        expect(point, `${region.id}:${country.code}`).not.toBeNull()
        expect(
          point![0],
          `${region.id}:${country.code}:x`,
        ).toBeGreaterThanOrEqual(0)
        expect(point![0], `${region.id}:${country.code}:x`).toBeLessThanOrEqual(
          viewport.width,
        )
        expect(
          point![1],
          `${region.id}:${country.code}:y`,
        ).toBeGreaterThanOrEqual(0)
        expect(point![1], `${region.id}:${country.code}:y`).toBeLessThanOrEqual(
          viewport.height,
        )
      }
    }
  })
})
