import { describe, expect, it } from 'vitest'

import {
  getGeographyCanvasCursor,
  getGeographyPointerDragThreshold,
  getGeographyReferenceHitPaths,
  getGeographyReferencePaths,
  getGeographyScenePaths,
  getReferenceLineIdForLayer,
  hasExceededGeographyDragThreshold,
} from './geographyLearningScene'

describe('geography learning scene paths', () => {
  it('builds all reference paths with selected and low-quality styles', () => {
    const balanced = getGeographyReferencePaths('balanced', 'equator')
    const low = getGeographyReferencePaths('low', 'equator')
    const balancedSelected = balanced.find(
      (path) => path.referenceLineId === 'equator',
    )!
    const balancedOrdinary = balanced.find(
      (path) => path.referenceLineId === 'tropic-of-cancer',
    )!
    const lowSelected = low.find((path) => path.referenceLineId === 'equator')!
    const lowOrdinary = low.find(
      (path) => path.referenceLineId === 'tropic-of-cancer',
    )!

    expect(balanced).toHaveLength(13)
    expect(low).toHaveLength(13)
    expect(balancedSelected).toMatchObject({
      color: '#ffffff',
      stroke: 1.7,
      interactionOnly: false,
    })
    expect(lowSelected).toMatchObject({ color: '#ffffff', stroke: 1.25 })
    expect(balancedOrdinary.stroke).toBe(0.8)
    expect(lowOrdinary.stroke).toBe(0.6)
    expect(
      balanced.find(
        (path) => path.referenceLineId === 'north-low-middle-boundary',
      )?.stroke,
    ).toBe(0.42)
    expect(
      low.find((path) => path.referenceLineId === 'north-low-middle-boundary')
        ?.stroke,
    ).toBe(0.3)
    expect(balancedSelected.stroke).toBeGreaterThanOrEqual(
      balancedOrdinary.stroke * 2,
    )
    expect(lowSelected.stroke).toBeGreaterThanOrEqual(lowOrdinary.stroke * 2)
    expect(balancedSelected.points[0][2]).toBeGreaterThan(
      balancedOrdinary.points[0][2],
    )
    expect(lowSelected.points[0][2]).toBeGreaterThan(lowOrdinary.points[0][2])
    expect(
      balanced.find(
        (path) => path.referenceLineId === 'western-hemisphere-boundary',
      ),
    ).toMatchObject({ dashLength: 0.08, dashGap: 0.055 })
    expect(low.every((path) => path.points.length > 80)).toBe(true)
  })

  it('builds continuous transparent hit paths for mouse and touch', () => {
    const mouse = getGeographyReferenceHitPaths(false)
    const touch = getGeographyReferenceHitPaths(true)
    const visual = getGeographyReferencePaths('balanced', null)

    expect(mouse).toHaveLength(13)
    expect(touch).toHaveLength(13)
    expect(mouse.every((path) => path.interactionOnly)).toBe(true)
    expect(mouse.every((path) => path.color === 'rgba(255,255,255,0)')).toBe(
      true,
    )
    expect(mouse.every((path) => path.stroke === 10)).toBe(true)
    expect(touch.every((path) => path.stroke === 18)).toBe(true)
    expect(
      mouse.every((path) => path.dashLength === 1 && path.dashGap === 0),
    ).toBe(true)
    expect(
      mouse.every(
        (path, index) => path.points[0][2] < visual[index].points[0][2],
      ),
    ).toBe(true)
  })

  it('places hit targets before visual paths only while the layer is visible', () => {
    const visible = getGeographyScenePaths('balanced', 'equator', false, true)

    expect(visible).toHaveLength(26)
    expect(visible.slice(0, 13).every((path) => path.interactionOnly)).toBe(
      true,
    )
    expect(visible.slice(13).every((path) => !path.interactionOnly)).toBe(true)
    expect(getGeographyScenePaths('low', null, true, false)).toEqual([])
  })

  it('uses separate mouse and touch drag thresholds', () => {
    expect(getGeographyPointerDragThreshold('mouse')).toBe(6)
    expect(getGeographyPointerDragThreshold('touch')).toBe(10)
    expect(
      hasExceededGeographyDragThreshold(
        { x: 10, y: 10, pointerType: 'mouse' },
        { x: 16, y: 10 },
      ),
    ).toBe(true)
    expect(
      hasExceededGeographyDragThreshold(
        { x: 10, y: 10, pointerType: 'touch' },
        { x: 19, y: 10 },
      ),
    ).toBe(false)
    expect(
      hasExceededGeographyDragThreshold(
        { x: 10, y: 10, pointerType: 'touch' },
        { x: 20, y: 10 },
      ),
    ).toBe(true)
  })

  it('uses a pointer cursor only inside a reference-line hit target', () => {
    expect(getGeographyCanvasCursor('equator')).toBe('pointer')
    expect(getGeographyCanvasCursor(null)).toBe('')
  })

  it('only extracts reference ids from the path layer', () => {
    expect(
      getReferenceLineIdForLayer('path', { referenceLineId: 'equator' }),
    ).toBe('equator')
    expect(
      getReferenceLineIdForLayer('polygon', { referenceLineId: 'equator' }),
    ).toBeNull()
  })
})
