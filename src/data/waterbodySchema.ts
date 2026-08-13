import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

export const waterbodyKindSchema = z.enum([
  'ocean',
  'sea',
  'gulf',
  'bay',
  'strait',
  'trench',
])

export const waterbodyLayerSchema = z.enum(['ocean', 'waterway'])

const measurementSchema = z.number().positive().optional()

export const waterbodySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)),
  kind: waterbodyKindSchema,
  layer: waterbodyLayerSchema,
  center: geoPositionSchema,
  cameraDistance: z.number().min(180).max(425),
  region: z.string().min(1),
  adjacentCountryCodes: z.array(countryCodeSchema),
  adjacentLandmasses: z.array(z.string().min(1)).min(1),
  areaSquareKilometers: measurementSchema,
  lengthKilometers: measurementSchema,
  maxDepthMeters: measurementSchema,
  summary: z.string().min(20),
  facts: z.tuple([z.string().min(10), z.string().min(10)]),
  sourceIds: z.array(z.string().min(1)).min(1),
  labelPriority: z.number().int().min(1).max(100),
})

export const surfaceWaterbodyGeometrySchema = z.object({
  id: z.string().min(1),
  kind: z.literal('surface'),
  geometry: z.object({
    type: z.enum(['Polygon', 'MultiPolygon']),
    coordinates: z.array(z.unknown()).min(1),
  }),
  lowDetailGeometry: z.object({
    type: z.enum(['Polygon', 'MultiPolygon']),
    coordinates: z.array(z.unknown()).min(1),
  }),
})

const trenchPointSchema = z.tuple([
  z.number().min(-90).max(90),
  z.number().min(-180).max(180),
])

export const trenchWaterbodyGeometrySchema = z.object({
  id: z.string().min(1),
  kind: z.literal('trench'),
  points: z.array(trenchPointSchema).min(2).max(24),
  lowDetailPoints: z.array(trenchPointSchema).min(2).max(12),
})

export const waterbodyGeometrySchema = z.discriminatedUnion('kind', [
  surfaceWaterbodyGeometrySchema,
  trenchWaterbodyGeometrySchema,
])

export const waterbodyCatalogSchema = z
  .array(waterbodySchema)
  .length(50)
  .superRefine((waterbodies, context) => {
    const ids = new Set<string>()
    for (const waterbody of waterbodies) {
      if (ids.has(waterbody.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate waterbody id: ${waterbody.id}`,
        })
      }
      ids.add(waterbody.id)
      if (
        waterbody.layer === 'ocean' &&
        !['ocean', 'sea', 'gulf', 'bay'].includes(waterbody.kind)
      ) {
        context.addIssue({
          code: 'custom',
          message: `Unexpected ocean-layer kind on ${waterbody.id}`,
        })
      }
      if (
        waterbody.layer === 'waterway' &&
        !['strait', 'trench'].includes(waterbody.kind)
      ) {
        context.addIssue({
          code: 'custom',
          message: `Unexpected waterway-layer kind on ${waterbody.id}`,
        })
      }
    }
  })

export const waterbodyGeometryCatalogSchema = z
  .array(waterbodyGeometrySchema)
  .length(50)
  .superRefine((geometries, context) => {
    const ids = new Set<string>()
    for (const geometry of geometries) {
      if (ids.has(geometry.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate waterbody geometry: ${geometry.id}`,
        })
      }
      ids.add(geometry.id)
    }
  })

export type Waterbody = z.infer<typeof waterbodySchema>
export type WaterbodyKind = z.infer<typeof waterbodyKindSchema>
export type WaterbodyGeometry = z.infer<typeof waterbodyGeometrySchema>
