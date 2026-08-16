import { describe, expect, it } from 'vitest'

import {
  addGeographicPathAltitude,
  getGeographicPathAppearance,
  getGeographicPathPointAltitude,
  getGeographicPathPointLatitude,
  getGeographicPathPointLongitude,
} from './geographicPathStyle'

describe('geographic path appearance', () => {
  it('uses the reviewed active strokes for every path kind and quality', () => {
    expect(
      getGeographicPathAppearance({ kind: 'river' }, 'balanced'),
    ).toMatchObject({
      altitude: 0.054,
      color: '#00f0ff',
      stroke: 1,
    })
    expect(getGeographicPathAppearance({ kind: 'river' }, 'low')).toMatchObject(
      { color: '#00f0ff', stroke: 0.72 },
    )
    expect(
      getGeographicPathAppearance({ kind: 'mountain' }, 'balanced'),
    ).toMatchObject({ color: '#ff9f32', stroke: 0.95 })
    expect(
      getGeographicPathAppearance({ kind: 'mountain' }, 'low'),
    ).toMatchObject({ color: '#ff9f32', stroke: 0.68 })
    expect(
      getGeographicPathAppearance({ kind: 'canal' }, 'balanced'),
    ).toMatchObject({ color: '#ffc62f', stroke: 0.65 })
    expect(getGeographicPathAppearance({ kind: 'canal' }, 'low')).toMatchObject(
      { color: '#ffc62f', stroke: 0.48 },
    )
  })

  it('keeps selected and hovered paths stronger than active paths', () => {
    for (const quality of ['balanced', 'low'] as const) {
      for (const kind of ['river', 'canal', 'mountain'] as const) {
        const active = getGeographicPathAppearance({ kind }, quality)
        const hovered = getGeographicPathAppearance(
          { kind, hovered: true },
          quality,
        )
        const selected = getGeographicPathAppearance(
          { kind, selected: true, hovered: true },
          quality,
        )

        expect(hovered.stroke).toBe(quality === 'balanced' ? 1.25 : 0.9)
        expect(selected.stroke).toBe(quality === 'balanced' ? 1.5 : 1.08)
        expect(hovered.stroke).toBeGreaterThan(active.stroke)
        expect(selected.stroke).toBeGreaterThan(hovered.stroke)
        expect(selected.altitude).toBeGreaterThan(active.altitude)
        expect(selected.color).toBe(kind === 'canal' ? '#ffd66b' : '#ffffff')
      }
    }
  })

  it('preserves the dashed canal encoding without affecting solid paths', () => {
    expect(
      getGeographicPathAppearance({ kind: 'canal' }, 'balanced'),
    ).toMatchObject({
      dashLength: 0.1,
      dashGap: 0.06,
    })
    expect(
      getGeographicPathAppearance({ kind: 'mountain' }, 'balanced'),
    ).toMatchObject({
      dashLength: 1,
      dashGap: 0,
    })
  })

  it('stores the computed altitude on every scene point', () => {
    expect(
      addGeographicPathAltitude(
        [
          [30, 120],
          [31, 121],
        ],
        0.054,
      ),
    ).toEqual([
      [30, 120, 0.054],
      [31, 121, 0.054],
    ])
  })

  it('reads coordinates from scene points instead of treating indexes as constants', () => {
    const point = [30, 120, 0.054] as const

    expect(getGeographicPathPointLatitude(point)).toBe(30)
    expect(getGeographicPathPointLongitude(point)).toBe(120)
    expect(getGeographicPathPointAltitude(point)).toBe(0.054)
  })
})
