import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
])

const multiLineStringSchema = z.object({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(coordinateSchema).min(2).max(600)).min(1).max(3),
})

export const mountainRangeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)),
  labelPosition: geoPositionSchema,
  cameraPosition: geoPositionSchema,
  cameraDistance: z.number().min(180).max(425),
  region: z.string().min(1),
  countryCodes: z.array(countryCodeSchema).min(1),
  lengthKilometers: z.number().positive().optional(),
  approximateLength: z.boolean(),
  highestPeak: z.object({
    name: localizedNameSchema,
    aliases: z.array(z.string().min(1)),
    elevationMeters: z.number().positive().max(9_000),
    approximateElevation: z.boolean(),
    position: geoPositionSchema,
    countryCodes: z.array(countryCodeSchema).min(1),
  }),
  summary: z.string().min(20),
  facts: z.tuple([z.string().min(10), z.string().min(10)]),
  sourceIds: z.array(z.string().min(1)).min(1),
  labelPriority: z.number().int().min(1).max(100),
})

export const mountainRangeGeometrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  geometry: multiLineStringSchema,
  mediumDetailGeometry: multiLineStringSchema,
  lowDetailGeometry: multiLineStringSchema,
  provenance: z.object({
    archiveSha256: z.string().regex(/^[a-f0-9]{64}$/),
    naturalEarthNeId: z.number().int().positive(),
    controlPoints: z.array(coordinateSchema).min(2),
    correctionSourceIds: z.array(z.string().min(1)),
  }),
})

export const mountainRangeCatalogSchema = z
  .array(mountainRangeSchema)
  .length(30)
  .superRefine((ranges, context) => {
    const ids = new Set<string>()
    for (const range of ranges) {
      if (ids.has(range.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate mountain range id: ${range.id}`,
        })
      }
      ids.add(range.id)
    }
  })

export const mountainRangeGeometryCatalogSchema = z
  .array(mountainRangeGeometrySchema)
  .length(30)
  .superRefine((geometries, context) => {
    const ids = new Set<string>()
    for (const geometry of geometries) {
      if (ids.has(geometry.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate mountain geometry id: ${geometry.id}`,
        })
      }
      ids.add(geometry.id)
      const detailLevels = [
        geometry.geometry.coordinates,
        geometry.mediumDetailGeometry.coordinates,
        geometry.lowDetailGeometry.coordinates,
      ]
      if (
        !detailLevels.every((lines) => lines.length === detailLevels[0].length)
      ) {
        context.addIssue({
          code: 'custom',
          message: `Detail segment mismatch on ${geometry.id}`,
        })
        continue
      }
      for (let index = 0; index < detailLevels[0].length; index += 1) {
        const [high, medium, low] = detailLevels.map(
          (lines) => lines[index].length,
        )
        if (high < medium || medium < low || medium > 140 || low > 48) {
          context.addIssue({
            code: 'custom',
            message: `Invalid mountain detail budget on ${geometry.id}`,
          })
        }
      }
    }
  })

export type MountainRange = z.infer<typeof mountainRangeSchema>
export type MountainRangeGeometry = z.infer<typeof mountainRangeGeometrySchema>
