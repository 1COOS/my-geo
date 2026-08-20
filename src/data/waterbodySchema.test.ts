import { describe, expect, it } from 'vitest'

import { countriesByCode } from './countries'
import { waterbodyGeometries } from './geometryData'
import { waterbodies } from './waterbodies'
import type { WaterbodyGeometry } from './waterbodySchema'

type SurfaceGeometry = Extract<
  WaterbodyGeometry,
  { kind: 'surface' }
>['geometry']

function geometryRings(geometry: SurfaceGeometry) {
  return geometry.type === 'Polygon'
    ? geometry.coordinates
    : geometry.coordinates.flat()
}

function geometryPointCount(geometry: SurfaceGeometry) {
  return geometryRings(geometry).reduce((total, ring) => total + ring.length, 0)
}

describe('waterbody catalogue', () => {
  it('contains the reviewed 71-item classification', () => {
    expect(waterbodies).toHaveLength(71)
    expect(
      Object.fromEntries(
        ['ocean', 'sea', 'gulf', 'bay', 'lake', 'strait', 'trench'].map(
          (kind) => [
            kind,
            waterbodies.filter((item) => item.kind === kind).length,
          ],
        ),
      ),
    ).toEqual({
      ocean: 5,
      sea: 26,
      gulf: 4,
      bay: 2,
      lake: 20,
      strait: 10,
      trench: 4,
    })
  })

  it('has matching geometry and valid country references', () => {
    const geometryIds = new Set(
      waterbodyGeometries.map((geometry) => geometry.id),
    )
    expect(geometryIds.size).toBe(71)
    for (const waterbody of waterbodies) {
      expect(geometryIds.has(waterbody.id)).toBe(true)
      expect(waterbody.sourceIds.length).toBeGreaterThan(0)
      for (const code of waterbody.adjacentCountryCodes) {
        expect(countriesByCode.has(code)).toBe(true)
      }
    }
  })

  it('uses sourced surface outlines with closed high and low-detail rings', () => {
    const surfaces = waterbodyGeometries.filter(
      (geometry) => geometry.kind === 'surface',
    )
    expect(surfaces).toHaveLength(67)
    expect(
      waterbodyGeometries.filter((geometry) => geometry.kind === 'trench'),
    ).toHaveLength(4)

    let lowDetailPointCount = 0
    for (const surface of surfaces) {
      const waterbody = waterbodies.find((item) => item.id === surface.id)!
      expect(surface.provenance.archiveSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(
        surface.provenance.naturalEarthRecords.length +
          surface.provenance.supplements.length,
      ).toBeGreaterThan(0)
      const maximumPoints =
        waterbody.kind === 'ocean'
          ? 600
          : waterbody.kind === 'strait'
            ? 100
            : waterbody.kind === 'lake'
              ? 120
              : 300
      const lowPoints = geometryPointCount(surface.lowDetailGeometry)
      expect(lowPoints).toBeLessThanOrEqual(maximumPoints)
      expect(geometryPointCount(surface.geometry)).toBeGreaterThanOrEqual(
        lowPoints,
      )
      lowDetailPointCount += lowPoints

      for (const geometry of [surface.geometry, surface.lowDetailGeometry]) {
        for (const ring of geometryRings(geometry)) {
          expect(ring[0]).toEqual(ring.at(-1))
        }
      }
    }
    expect(lowDetailPointCount).toBeLessThanOrEqual(11_000)
  })

  it('replaces rectangular estimates and records the two reviewed gaps', () => {
    const pacific = waterbodyGeometries.find(
      (geometry) => geometry.id === 'pacific-ocean',
    )
    const mediterranean = waterbodyGeometries.find(
      (geometry) => geometry.id === 'mediterranean-sea',
    )
    const bohai = waterbodyGeometries.find(
      (geometry) => geometry.id === 'bohai-sea',
    )
    const baikal = waterbodyGeometries.find(
      (geometry) => geometry.id === 'lake-baikal',
    )
    const eyre = waterbodyGeometries.find(
      (geometry) => geometry.id === 'lake-eyre',
    )
    const mariana = waterbodyGeometries.find(
      (geometry) => geometry.id === 'mariana-trench',
    )
    expect(pacific?.kind === 'surface' && pacific.geometry.type).toBe(
      'MultiPolygon',
    )
    expect(
      mediterranean?.kind === 'surface' &&
        geometryPointCount(mediterranean.geometry),
    ).toBeGreaterThan(100)
    expect(
      mediterranean?.kind === 'surface' &&
        new Set(
          geometryRings(mediterranean.geometry)
            .flat()
            .map(([longitude]) => longitude),
        ).size,
    ).toBeGreaterThan(20)
    expect(
      waterbodyGeometries
        .filter(
          (geometry) =>
            geometry.kind === 'surface' &&
            geometry.provenance.supplements.length > 0,
        )
        .map((geometry) => geometry.id),
    ).toEqual(['bering-strait', 'strait-of-hormuz'])
    expect(
      bohai?.kind === 'surface' &&
        bohai.provenance.naturalEarthRecords.map((record) => record.neId),
    ).toEqual([1159117171])
    expect(
      baikal?.kind === 'surface' &&
        baikal.provenance.naturalEarthRecords.map((record) => record.neId),
    ).toEqual([1159113127])
    expect(
      eyre?.kind === 'surface' &&
        eyre.provenance.naturalEarthRecords.map((record) => record.neId),
    ).toEqual([1159126091, 1159126189])
    expect(
      mariana?.kind === 'trench' && mariana.points.length,
    ).toBeLessThanOrEqual(24)
  })
})
