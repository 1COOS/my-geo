import { describe, expect, it } from 'vitest'

import {
  climateMasks,
  koppenClassByValue,
  mapKoppenClassToClimateType,
  mapKoppenValueToClimateType,
} from './climateClassification'
import { climateSources, climateTypes, getClimateType } from './climateLearning'
import { climateLayerManifest } from './climateRaster'

describe('climate learning data', () => {
  it('contains 13 unique sourced types with a fixed palette', () => {
    expect(climateTypes).toHaveLength(13)
    expect(new Set(climateTypes.map((item) => item.id)).size).toBe(13)
    expect(new Set(climateTypes.map((item) => item.color)).size).toBe(13)
    const sourceIds = new Set(climateSources.map((source) => source.id))
    for (const climateType of climateTypes) {
      expect(getClimateType(climateType.id)).toBe(climateType)
      expect(climateType.aliases.length).toBeGreaterThan(0)
      expect(
        climateType.sourceIds.every((sourceId) => sourceIds.has(sourceId)),
      ).toBe(true)
    }
    expect(climateLayerManifest.palette.map((item) => item.id)).toEqual(
      climateTypes.map((item) => item.id),
    )
  })

  it('maps all 30 source values and preserves the agreed boundaries', () => {
    for (const value of Object.keys(koppenClassByValue).map(Number)) {
      expect(
        mapKoppenValueToClimateType(value, {
          latitude: 25,
          longitude: 0,
        }),
      ).not.toBeNull()
    }
    expect(
      mapKoppenClassToClimateType('BSh', { latitude: 19.999, longitude: 0 }),
    ).toBe('tropical-savanna')
    expect(
      mapKoppenClassToClimateType('BSh', { latitude: 20, longitude: 0 }),
    ).toBe('tropical-desert')
    expect(
      mapKoppenClassToClimateType('Dfb', {
        latitude: 55.8,
        longitude: 37.6,
      }),
    ).toBe('temperate-continental')
    expect(
      mapKoppenClassToClimateType('BSk', {
        latitude: 39.9,
        longitude: 116.4,
      }),
    ).toBe('temperate-monsoon')
  })

  it('applies highland and reviewed regional masks before base mapping', () => {
    expect(
      mapKoppenClassToClimateType('Csb', {
        latitude: -0.2,
        longitude: -78.5,
      }),
    ).toBe('highland-mountain')
    expect(
      mapKoppenClassToClimateType('Cwb', {
        latitude: 9,
        longitude: 38.7,
      }),
    ).toBe('highland-mountain')
    expect(
      mapKoppenClassToClimateType('Csb', {
        latitude: -1.3,
        longitude: 36.8,
      }),
    ).toBe('tropical-savanna')
    for (const mask of climateMasks) {
      expect(mask.polygon[0]).toEqual(mask.polygon.at(-1))
    }
  })

  it('keeps the reviewed anchor classifications in the generated manifest', () => {
    expect(climateLayerManifest.anchors).toEqual({
      manaus: 'tropical-rainforest',
      mumbai: 'tropical-monsoon',
      nairobi: 'tropical-savanna',
      cairo: 'tropical-desert',
      shanghai: 'subtropical-monsoon-humid',
      beijing: 'temperate-monsoon',
      london: 'temperate-oceanic',
      rome: 'mediterranean',
      moscow: 'temperate-continental',
      yakutsk: 'subarctic-coniferous',
      utqiagvik: 'tundra',
      antarcticInterior: 'ice-cap',
      lhasa: 'highland-mountain',
      quito: 'highland-mountain',
      addisAbaba: 'highland-mountain',
    })
  })
})
