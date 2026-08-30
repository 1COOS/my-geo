import { describe, expect, it } from 'vitest'

import {
  getWaterLearningLayer,
  getWaterObjectGroups,
  getWaterObjectGroup,
  getWaterObjectGroupForObject,
  getWaterObjectLayerId,
  getWaterObjectsForGroup,
  resolveWaterLearningLayerId,
  resolveWaterObjectGroup,
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
      '海峡·海沟',
      '河流',
    ])
    expect(waterLearningObjectCount).toBe(111)
    expect(waterLearningSources).toHaveLength(3)
    expect(getWaterLearningLayer('waterway')?.name).toBe('海峡·海沟')
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
    ).toEqual([['世界湖泊', 20]])
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

  it('resolves shareable groups and derives the group for every detail object', () => {
    expect(getWaterObjectGroup('ocean-seas')?.name).toBe('海')
    expect(resolveWaterObjectGroup('ocean', 'ocean-seas').id).toBe('ocean-seas')
    expect(resolveWaterObjectGroup('lake', 'ocean-seas').id).toBe('world-lakes')
    expect(resolveWaterObjectGroup('river', 'unknown').id).toBe('river-rivers')
    expect(getWaterObjectGroupForObject('lake-baikal')?.id).toBe('world-lakes')
    expect(getWaterObjectGroup('lake-asia')?.id).toBe('world-lakes')
    expect(getWaterObjectGroupForObject(undefined, 'amazon-system')?.id).toBe(
      'river-rivers',
    )
    expect(getWaterObjectGroupForObject('unknown')).toBeUndefined()
    expect(
      waterLearningLayers.flatMap((layer) => getWaterObjectGroups(layer.id)),
    ).toHaveLength(8)
    expect(
      waterLearningLayers
        .flatMap((layer) => getWaterObjectGroups(layer.id))
        .map((group) => group.nameEn),
    ).toEqual([
      'Oceans',
      'Seas',
      'Gulfs and Bays',
      'World Lakes',
      'Straits',
      'Trenches',
      'Rivers',
      'Canals',
    ])
    expect(
      waterLearningLayers
        .flatMap((layer) => getWaterObjectGroups(layer.id))
        .every((group) => group.summary.length >= 20),
    ).toBe(true)
  })
})
