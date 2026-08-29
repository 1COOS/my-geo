import { describe, expect, it } from 'vitest'

import {
  getWaterLearningLayer,
  getWaterObjectGroups,
  getWaterObjectLayerId,
  getWaterObjectsForGroup,
  resolveWaterLearningLayerId,
  waterLearningLayers,
  waterLearningObjectCount,
  waterLearningSources,
} from './waterLearning'

describe('water learning catalogue', () => {
  it('matches the four 3D water layers and the complete object count', () => {
    expect(waterLearningLayers.map((layer) => layer.id)).toEqual([
      'ocean',
      'lake',
      'waterway',
      'river',
    ])
    expect(waterLearningLayers.map((layer) => layer.name)).toEqual([
      '海洋',
      '湖泊',
      '水域',
      '河流',
    ])
    expect(waterLearningObjectCount).toBe(111)
    expect(waterLearningSources).toHaveLength(3)
    expect(getWaterLearningLayer('waterway')?.name).toBe('水域')
  })

  it('keeps legacy topic URLs compatible while using layer IDs canonically', () => {
    expect(resolveWaterLearningLayerId('lake')).toBe('lake')
    expect(resolveWaterLearningLayerId(null, 'ocean-and-land')).toBe('ocean')
    expect(resolveWaterLearningLayerId(null, 'lakes-and-wetlands')).toBe('lake')
    expect(resolveWaterLearningLayerId(null, 'rivers-and-basins')).toBe('river')
    expect(resolveWaterLearningLayerId(null, 'water-cycle')).toBe('ocean')
    expect(resolveWaterLearningLayerId('unknown')).toBe('ocean')
  })

  it('groups every layer object exactly once using the approved classifications', () => {
    expect(
      getWaterObjectGroups('ocean').map((group) => [
        group.name,
        group.objectIds.length,
      ]),
    ).toEqual([
      ['大洋', 5],
      ['海', 26],
      ['海湾', 6],
    ])
    expect(
      getWaterObjectGroups('lake').map((group) => [
        group.name,
        group.objectIds.length,
      ]),
    ).toEqual([
      ['亚洲', 5],
      ['欧洲', 1],
      ['非洲', 5],
      ['北美洲', 7],
      ['南美洲', 1],
      ['大洋洲', 1],
    ])
    expect(
      getWaterObjectGroups('waterway').map((group) => [
        group.name,
        group.objectIds.length,
      ]),
    ).toEqual([
      ['海峡', 10],
      ['海沟', 4],
    ])
    expect(
      getWaterObjectGroups('river').map((group) => [
        group.name,
        group.objectIds.length,
      ]),
    ).toEqual([
      ['河流', 30],
      ['运河', 10],
    ])

    const allObjects = waterLearningLayers.flatMap((layer) =>
      getWaterObjectGroups(layer.id).flatMap(getWaterObjectsForGroup),
    )
    expect(allObjects).toHaveLength(111)
    expect(new Set(allObjects.map((object) => object.value.id)).size).toBe(111)
  })

  it('derives detail layers from the same contracts as the 3D scene', () => {
    expect(getWaterObjectLayerId('pacific-ocean')).toBe('ocean')
    expect(getWaterObjectLayerId('lake-baikal')).toBe('lake')
    expect(getWaterObjectLayerId('bering-strait')).toBe('waterway')
    expect(getWaterObjectLayerId(undefined, 'amazon-system')).toBe('river')
    expect(getWaterObjectLayerId('unknown')).toBeNull()
  })
})
