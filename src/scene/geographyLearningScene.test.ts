import { describe, expect, it } from 'vitest'
import { Object3D, Raycaster } from 'three'

import {
  applyGeographyReferenceLineHitAreas,
  getGeographyCanvasCursor,
  getGeographyLineHitWidth,
  getGeographyPointerDragThreshold,
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
      stroke: 2.6,
    })
    expect(lowSelected).toMatchObject({ color: '#ffffff', stroke: 2 })
    expect(
      balanced
        .filter((path) => path.referenceLineId !== 'equator')
        .every((path) => path.stroke === 1.2),
    ).toBe(true)
    expect(
      low
        .filter((path) => path.referenceLineId !== 'equator')
        .every((path) => path.stroke === 0.9),
    ).toBe(true)
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
    expect(
      [...balanced, ...low].every((path) => !path.color.includes('rgba')),
    ).toBe(true)
  })

  it('renders only the thirteen visible paths while the layer is active', () => {
    const visible = getGeographyScenePaths('balanced', 'equator', true)

    expect(visible).toHaveLength(13)
    expect(getGeographyScenePaths('low', null, false)).toEqual([])
  })

  it('expands raycasting only for geography lines and restores shared params', () => {
    const scene = new Object3D()
    const geographyGroup = Object.assign(new Object3D(), {
      __globeObjType: 'path',
      __data: getGeographyReferencePaths('balanced', null)[0],
    })
    const riverGroup = Object.assign(new Object3D(), {
      __globeObjType: 'path',
      __data: { linearFeatureId: 'nile' },
    })
    const geographyLine = Object.assign(new Object3D(), {
      material: { linewidth: 0.8 },
    })
    const riverLine = Object.assign(new Object3D(), {
      material: { linewidth: 1 },
    })
    let observedThreshold: number | undefined
    geographyLine.raycast = (raycaster) => {
      observedThreshold = (
        raycaster.params as Raycaster['params'] & {
          Line2?: { threshold?: number }
        }
      ).Line2?.threshold
    }
    riverLine.raycast = () => undefined
    const originalGeographyRaycast = Reflect.get(geographyLine, 'raycast')
    const originalRiverRaycast = Reflect.get(riverLine, 'raycast')
    geographyGroup.add(geographyLine)
    riverGroup.add(riverLine)
    scene.add(geographyGroup, riverGroup)

    expect(applyGeographyReferenceLineHitAreas(scene, false)).toBe(1)
    expect(Reflect.get(geographyLine, 'raycast')).not.toBe(
      originalGeographyRaycast,
    )
    expect(Reflect.get(riverLine, 'raycast')).toBe(originalRiverRaycast)

    const raycaster = new Raycaster()
    const previousLine2 = { threshold: 2 }
    const raycasterParams = raycaster.params as Raycaster['params'] & {
      Line2?: { threshold?: number }
    }
    raycasterParams.Line2 = previousLine2
    geographyLine.raycast(raycaster, [])
    expect(observedThreshold).toBeCloseTo(9.2)
    expect(raycasterParams.Line2).toBe(previousLine2)

    expect(applyGeographyReferenceLineHitAreas(scene, true)).toBe(1)
    geographyLine.raycast(raycaster, [])
    expect(observedThreshold).toBeCloseTo(17.2)
    expect(getGeographyLineHitWidth(false)).toBe(10)
    expect(getGeographyLineHitWidth(true)).toBe(18)
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
