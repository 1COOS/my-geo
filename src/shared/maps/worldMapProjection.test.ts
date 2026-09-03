import { describe, expect, it, vi } from 'vitest'

import {
  createWorldMapProjection,
  getWorldFeaturePath,
  projectWorldPosition,
} from './worldMapProjection'
import { activateSvgControlOnKeyboard } from './svgMapInteraction'

describe('world map projection primitives', () => {
  it('projects the geographic origin to the configured map center', () => {
    const map = createWorldMapProjection({
      width: 360,
      height: 180,
      precision: 0.1,
    })

    expect(
      projectWorldPosition(map.projection, { latitude: 0, longitude: 0 }),
    ).toEqual([180, 90])
    expect(map.projection.precision()).toBe(0.1)
  })

  it('creates paths with the configured projection', () => {
    const map = createWorldMapProjection({ width: 720, height: 340 })
    const path = getWorldFeaturePath(map.path, {
      type: 'Point',
      coordinates: [0, 0],
    })

    expect(path).toContain('M360,170')
  })
})

describe('activateSvgControlOnKeyboard', () => {
  it.each(['Enter', ' '])('activates on %s', (key) => {
    const preventDefault = vi.fn()
    const activate = vi.fn()

    activateSvgControlOnKeyboard({ key, preventDefault }, activate)

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(activate).toHaveBeenCalledOnce()
  })

  it('ignores unrelated keys', () => {
    const preventDefault = vi.fn()
    const activate = vi.fn()

    activateSvgControlOnKeyboard(
      { key: 'ArrowRight', preventDefault },
      activate,
    )

    expect(preventDefault).not.toHaveBeenCalled()
    expect(activate).not.toHaveBeenCalled()
  })
})
