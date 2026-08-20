import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { countries } from '../src/data/countries'

const svgViewBoxPattern = /\bviewBox\s*=\s*["']([^"']+)["']/i
const unsafeSvgContentPattern =
  /<script\b|<image\b|\b(?:href|xlink:href|src)\s*=\s*["']https?:/i

async function readFlagViewBox(flagAsset: string) {
  const svg = await readFile(
    path.join(process.cwd(), 'public', flagAsset.replace(/^\//, '')),
    'utf8',
  )
  const viewBox = svg
    .match(svgViewBoxPattern)?.[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number)

  expect(viewBox).toHaveLength(4)
  expect(viewBox?.every(Number.isFinite)).toBe(true)
  expect(viewBox?.[2]).toBeGreaterThan(0)
  expect(viewBox?.[3]).toBeGreaterThan(0)
  expect(svg).not.toMatch(unsafeSvgContentPattern)

  return viewBox!
}

describe('generated flag assets', () => {
  it('ships safe native-aspect-ratio SVG flags for all 195 countries', async () => {
    const viewBoxes = new Map<string, number[]>()

    for (const country of countries) {
      viewBoxes.set(country.code, await readFlagViewBox(country.flagAsset))
    }

    const aspectRatio = (code: string) => {
      const viewBox = viewBoxes.get(code)!
      return viewBox[2] / viewBox[3]
    }

    expect(aspectRatio('CN')).toBeCloseTo(3 / 2, 5)
    expect(aspectRatio('CH')).toBeCloseTo(1, 5)
    expect(aspectRatio('QA')).toBeCloseTo(28 / 11, 5)
    expect(aspectRatio('NP')).toBeCloseTo(71.571 / 87.246, 5)
    expect(
      new Set([...viewBoxes.values()].map((box) => box[2] / box[3])).size,
    ).toBeGreaterThan(10)
  })
})
