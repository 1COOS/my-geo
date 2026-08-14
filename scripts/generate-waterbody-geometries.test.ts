import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  buildWaterbodyGeometryCatalog,
  generateWaterbodyGeometryCatalogFromArchive,
} from './generate-waterbody-geometries'
import {
  NATURAL_EARTH_MARINE_ARCHIVE_SHA256,
  waterbodyGeometryDefinitions,
} from './waterbody-geometry-content'

const archivePath = process.env.MY_GEO_WATERBODY_ARCHIVE

describe('waterbody geometry source contract', () => {
  it('declares 44 sourced objects and two reviewed supplements', () => {
    expect(waterbodyGeometryDefinitions).toHaveLength(47)
    expect(
      waterbodyGeometryDefinitions.filter(
        (definition) => definition.naturalEarthNeIds.length > 0,
      ),
    ).toHaveLength(45)
    expect(
      waterbodyGeometryDefinitions
        .filter((definition) => definition.reviewedOutline)
        .map((definition) => definition.id),
    ).toEqual(['bering-strait', 'strait-of-hormuz'])
    expect(
      new Set(waterbodyGeometryDefinitions.map((definition) => definition.id))
        .size,
    ).toBe(47)
  })

  it('fails closed when a reviewed Natural Earth record is missing', () => {
    expect(() =>
      buildWaterbodyGeometryCatalog(
        NATURAL_EARTH_MARINE_ARCHIVE_SHA256,
        new Map(),
      ),
    ).toThrow(/Missing Natural Earth marine record/)
  })
})

describe.skipIf(!archivePath)(
  'waterbody geometry generator reproducibility',
  () => {
    it('produces byte-equivalent data for the same pinned input', async () => {
      const bytes = new Uint8Array(await readFile(archivePath!))
      const first = await generateWaterbodyGeometryCatalogFromArchive(bytes)
      const second = await generateWaterbodyGeometryCatalogFromArchive(bytes)
      const committed = JSON.parse(
        await readFile(
          path.resolve(
            import.meta.dirname,
            '../src/data/generated/waterbody-geometries.json',
          ),
          'utf8',
        ),
      ) as unknown

      expect(JSON.stringify(first)).toBe(JSON.stringify(second))
      expect(first).toEqual(committed)
    })

    it('rejects bytes that do not match the pinned archive', async () => {
      const bytes = new Uint8Array(await readFile(archivePath!))
      bytes[0] ^= 0xff
      await expect(
        generateWaterbodyGeometryCatalogFromArchive(bytes),
      ).rejects.toThrow(/SHA-256 mismatch/)
    })
  },
)
