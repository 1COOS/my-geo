import { describe, expect, it } from 'vitest'

import { countriesByCode } from './countries'
import {
  DEFAULT_WORLD_EXTREME_CATEGORY_ID,
  DEFAULT_WORLD_EXTREME_METRIC_ID,
  getWorldExtremeEntry,
  getWorldExtremeExplorePath,
  getWorldExtremeMetric,
  getWorldExtremeMetricsForCategory,
  getWorldExtremeSource,
  resolveWorldExtremeSelection,
  worldExtremeCategories,
  worldExtremeEntryCount,
  worldExtremeMetrics,
} from './worldExtremes'

describe('worldExtremes', () => {
  it('exposes four categories, twelve metrics and three ranked entries each', () => {
    expect(worldExtremeCategories).toHaveLength(4)
    expect(worldExtremeMetrics).toHaveLength(12)
    expect(worldExtremeEntryCount).toBe(36)
    expect(
      worldExtremeMetrics.every((metric) => metric.entries.length === 3),
    ).toBe(true)
    expect(
      worldExtremeMetrics.every((metric) =>
        metric.entries.every((entry, index) => entry.rank === index + 1),
      ),
    ).toBe(true)
  })

  it('keeps explicit records sorted in the declared direction', () => {
    for (const metric of worldExtremeMetrics) {
      const values = metric.entries.map((entry) => entry.value)
      const expected = [...values].sort((left, right) =>
        metric.direction === 'ascending' ? left - right : right - left,
      )
      expect(values, metric.id).toEqual(expected)
    }
  })

  it('keeps country area and population records aligned with country data', () => {
    for (const metricId of [
      'largest-country-area',
      'smallest-country-area',
      'most-populous-country',
      'least-populous-country',
    ] as const) {
      const metric = getWorldExtremeMetric(metricId)!
      for (const entry of metric.entries) {
        expect(entry.entity?.kind).toBe('country')
        const country = countriesByCode.get(entry.entity!.id)!
        if (metric.unit === 'people') {
          expect(entry.value).toBe(country.population)
          expect(entry.year).toBe(country.populationYear)
        } else {
          expect(entry.value).toBe(country.areaSquareKilometers)
        }
      }
    }
  })

  it('resolves every source and all entries have valid map positions', () => {
    for (const metric of worldExtremeMetrics) {
      for (const entry of metric.entries) {
        expect(entry.position.latitude).toBeGreaterThanOrEqual(-90)
        expect(entry.position.latitude).toBeLessThanOrEqual(90)
        expect(entry.position.longitude).toBeGreaterThanOrEqual(-180)
        expect(entry.position.longitude).toBeLessThanOrEqual(180)
        for (const sourceId of entry.sourceIds) {
          expect(getWorldExtremeSource(sourceId), sourceId).toBeDefined()
        }
      }
    }
  })

  it('normalizes invalid selections and lets a valid metric own its category', () => {
    expect(resolveWorldExtremeSelection(null, null)).toEqual({
      categoryId: DEFAULT_WORLD_EXTREME_CATEGORY_ID,
      metricId: DEFAULT_WORLD_EXTREME_METRIC_ID,
    })
    expect(
      resolveWorldExtremeSelection('oceans-depths', 'highest-peak'),
    ).toEqual({
      categoryId: 'mountains-deserts',
      metricId: 'highest-peak',
    })
    expect(resolveWorldExtremeSelection('rivers-lakes', 'unknown')).toEqual({
      categoryId: 'rivers-lakes',
      metricId: getWorldExtremeMetricsForCategory('rivers-lakes')[0].id,
    })
  })

  it('builds entity and coordinate-only 3D deep links', () => {
    expect(
      getWorldExtremeExplorePath(
        getWorldExtremeEntry('highest-peak', 'mount-everest')!,
      ),
    ).toBe('/explore?latitude=27.9881&longitude=86.925&mountainRange=himalayas')
    expect(
      getWorldExtremeExplorePath(
        getWorldExtremeEntry('largest-hot-desert', 'arabian-desert')!,
      ),
    ).toBe('/explore?latitude=23.5&longitude=47.5')
  })
})
