import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

const surfaceCoordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
])

const polygonCoordinatesSchema = z
  .array(z.array(surfaceCoordinateSchema).min(4))
  .min(1)

export const desertSurfaceGeometrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('Polygon'),
    coordinates: polygonCoordinatesSchema,
  }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(polygonCoordinatesSchema).min(1),
  }),
])

export const desertSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)),
  center: geoPositionSchema,
  cameraDistance: z.number().min(180).max(425),
  region: z.string().min(1),
  countryCodes: z.array(countryCodeSchema).min(1),
  areaSquareKilometers: z.number().positive(),
  approximateArea: z.boolean(),
  landscape: z.array(z.string().min(1)).min(2).max(4),
  summary: z.string().min(20),
  facts: z.tuple([z.string().min(10), z.string().min(10)]),
  sourceIds: z.array(z.string().min(1)).min(1),
  labelPriority: z.number().int().min(1).max(100),
})

export const desertGeometrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  geometry: desertSurfaceGeometrySchema,
  lowDetailGeometry: desertSurfaceGeometrySchema,
  provenance: z.object({
    archiveVersion: z.literal('5.0.0'),
    archiveSha256: z.string().regex(/^[a-f0-9]{64}$/),
    naturalEarthNeId: z.number().int().positive(),
  }),
})

export const desertCatalogSchema = z
  .array(desertSchema)
  .length(20)
  .superRefine((deserts, context) => {
    const ids = new Set<string>()
    for (const desert of deserts) {
      if (ids.has(desert.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate desert id: ${desert.id}`,
        })
      }
      ids.add(desert.id)
    }
  })

export const desertGeometryCatalogSchema = z
  .array(desertGeometrySchema)
  .length(20)
  .superRefine((geometries, context) => {
    const ids = new Set<string>()
    for (const geometry of geometries) {
      if (ids.has(geometry.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate desert geometry id: ${geometry.id}`,
        })
      }
      ids.add(geometry.id)
    }
  })

export type Desert = z.infer<typeof desertSchema>
export type DesertGeometry = z.infer<typeof desertGeometrySchema>
export type DesertSurfaceGeometry = z.infer<typeof desertSurfaceGeometrySchema>
