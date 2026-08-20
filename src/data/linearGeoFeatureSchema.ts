import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

export const linearGeoFeatureKindSchema = z.enum(['river', 'canal'])

const commonLinearGeoFeatureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)),
  kind: linearGeoFeatureKindSchema,
  labelPosition: geoPositionSchema,
  cameraPosition: geoPositionSchema,
  cameraDistance: z.number().min(160).max(425),
  region: z.string().min(1),
  countryCodes: z.array(countryCodeSchema).min(1),
  lengthKilometers: z.number().positive(),
  approximateLength: z.boolean(),
  summary: z.string().min(20),
  facts: z.tuple([z.string().min(10), z.string().min(10)]),
  sourceIds: z.array(z.string().min(1)).min(1),
  labelPriority: z.number().int().min(1).max(100),
})

export const riverFeatureSchema = commonLinearGeoFeatureSchema.extend({
  kind: z.literal('river'),
  source: z.string().min(1),
  mouth: z.string().min(1),
  traversedRegions: z.array(z.string().min(1)).min(1),
})

export const canalFeatureSchema = commonLinearGeoFeatureSchema.extend({
  kind: z.literal('canal'),
  start: z.string().min(1),
  end: z.string().min(1),
  connectedWaters: z.tuple([z.string().min(1), z.string().min(1)]),
  openedYear: z.number().int().min(500).max(2100).optional(),
})

export const linearGeoFeatureSchema = z.discriminatedUnion('kind', [
  riverFeatureSchema,
  canalFeatureSchema,
])

const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
])

const multiLineStringSchema = z.object({
  type: z.literal('MultiLineString'),
  coordinates: z
    .array(z.array(coordinateSchema).min(2).max(2000))
    .min(1)
    .max(5),
})

export const linearGeoFeatureGeometrySchema = z.object({
  id: z.string().min(1),
  geometry: multiLineStringSchema,
  mediumDetailGeometry: multiLineStringSchema,
  lowDetailGeometry: multiLineStringSchema,
  provenance: z
    .object({
      archiveSha256: z.string().regex(/^[a-f0-9]{64}$/),
      naturalEarthParts: z.array(
        z.object({
          neId: z.number().int().positive(),
          part: z.number().int().nonnegative(),
        }),
      ),
      supplements: z.array(
        z.object({
          kind: z.enum(['reviewed-gap', 'authoritative-open-data']),
          sourceIds: z.array(z.string().min(1)).min(1),
          start: coordinateSchema,
          end: coordinateSchema,
          distanceKilometers: z.number().nonnegative(),
        }),
      ),
    })
    .optional(),
})

export const linearGeoFeatureCatalogSchema = z
  .array(linearGeoFeatureSchema)
  .length(40)
  .superRefine((features, context) => {
    const ids = new Set<string>()
    for (const feature of features) {
      if (ids.has(feature.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate linear feature id: ${feature.id}`,
        })
      }
      ids.add(feature.id)
    }
  })

export const linearGeoFeatureGeometryCatalogSchema = z
  .array(linearGeoFeatureGeometrySchema)
  .length(40)
  .superRefine((geometries, context) => {
    const ids = new Set<string>()
    for (const geometry of geometries) {
      if (ids.has(geometry.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate linear feature geometry: ${geometry.id}`,
        })
      }
      ids.add(geometry.id)
      if (
        geometry.geometry.coordinates.length !==
          geometry.mediumDetailGeometry.coordinates.length ||
        geometry.geometry.coordinates.length !==
          geometry.lowDetailGeometry.coordinates.length
      ) {
        context.addIssue({
          code: 'custom',
          message: `Detail segment mismatch on ${geometry.id}`,
        })
      }
      for (
        let index = 0;
        index < geometry.geometry.coordinates.length;
        index += 1
      ) {
        const highCount = geometry.geometry.coordinates[index].length
        const mediumCount =
          geometry.mediumDetailGeometry.coordinates[index].length
        const lowCount = geometry.lowDetailGeometry.coordinates[index].length
        if (highCount < mediumCount || mediumCount < lowCount) {
          context.addIssue({
            code: 'custom',
            message: `Detail point count is not monotonic on ${geometry.id}`,
          })
        }
      }
    }
  })

export type LinearGeoFeature = z.infer<typeof linearGeoFeatureSchema>
export type LinearGeoFeatureKind = z.infer<typeof linearGeoFeatureKindSchema>
export type LinearGeoFeatureGeometry = z.infer<
  typeof linearGeoFeatureGeometrySchema
>
