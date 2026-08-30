import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

export const worldExtremeCategoryIds = [
  'country-scale',
  'mountains-deserts',
  'rivers-lakes',
  'oceans-depths',
] as const

export const worldExtremeCategoryIdSchema = z.enum(worldExtremeCategoryIds)

export const worldExtremeMetricIds = [
  'largest-country-area',
  'smallest-country-area',
  'most-populous-country',
  'least-populous-country',
  'highest-peak',
  'longest-continental-mountain-range',
  'largest-hot-desert',
  'longest-river',
  'largest-freshwater-lake-area',
  'deepest-lake',
  'largest-ocean-area',
  'deepest-ocean-trench',
] as const

export const worldExtremeMetricIdSchema = z.enum(worldExtremeMetricIds)

export const worldExtremeUnitSchema = z.enum([
  'square-kilometers',
  'people',
  'meters',
  'kilometers',
])

export const worldExtremeEntitySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('country'), id: countryCodeSchema }),
  z.object({
    kind: z.literal('waterbody'),
    id: z.string().regex(/^[a-z0-9-]+$/),
  }),
  z.object({
    kind: z.literal('linearFeature'),
    id: z.string().regex(/^[a-z0-9-]+$/),
  }),
  z.object({
    kind: z.literal('mountainRange'),
    id: z.string().regex(/^[a-z0-9-]+$/),
  }),
  z.object({
    kind: z.literal('desert'),
    id: z.string().regex(/^[a-z0-9-]+$/),
  }),
])

export const worldExtremeEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  rank: z.number().int().min(1).max(3),
  name: localizedNameSchema,
  value: z.number().positive(),
  approximate: z.boolean(),
  year: z.number().int().min(1900).max(2100).optional(),
  position: geoPositionSchema,
  entity: worldExtremeEntitySchema.optional(),
  summary: z.string().min(20),
  facts: z.tuple([z.string().min(10), z.string().min(10)]),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const worldExtremeMetricSchema = z.object({
  id: worldExtremeMetricIdSchema,
  categoryId: worldExtremeCategoryIdSchema,
  name: z.string().min(2),
  note: z.string().min(4),
  unit: worldExtremeUnitSchema,
  direction: z.enum(['ascending', 'descending']),
  measurement: z.string().min(20),
  scopeNote: z.string().min(20),
  dispute: z.string().min(20).optional(),
  entries: z.tuple([
    worldExtremeEntrySchema,
    worldExtremeEntrySchema,
    worldExtremeEntrySchema,
  ]),
})

export const worldExtremeCategorySchema = z.object({
  id: worldExtremeCategoryIdSchema,
  name: z.string().min(2),
  note: z.string().min(4),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
})

export const worldExtremeCatalogSchema = z
  .object({
    categories: z.array(worldExtremeCategorySchema).length(4),
    metrics: z.array(worldExtremeMetricSchema).length(12),
  })
  .superRefine((catalog, context) => {
    const categoryIds = new Set<string>()
    const metricIds = new Set<string>()

    for (const category of catalog.categories) {
      if (categoryIds.has(category.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate world-extreme category: ${category.id}`,
        })
      }
      categoryIds.add(category.id)
    }

    for (const metric of catalog.metrics) {
      if (metricIds.has(metric.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate world-extreme metric: ${metric.id}`,
        })
      }
      metricIds.add(metric.id)
      if (!categoryIds.has(metric.categoryId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown category ${metric.categoryId} on ${metric.id}`,
        })
      }

      const entryIds = new Set<string>()
      metric.entries.forEach((entry, index) => {
        if (entry.rank !== index + 1) {
          context.addIssue({
            code: 'custom',
            message: `World-extreme ranks must be 1, 2, 3 on ${metric.id}`,
          })
        }
        if (entryIds.has(entry.id)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate entry ${entry.id} on ${metric.id}`,
          })
        }
        entryIds.add(entry.id)
      })
      const values = metric.entries.map((entry) => entry.value)
      const sortedValues = [...values].sort((left, right) =>
        metric.direction === 'ascending' ? left - right : right - left,
      )
      if (!values.every((value, index) => value === sortedValues[index])) {
        context.addIssue({
          code: 'custom',
          message: `World-extreme values do not match rank order on ${metric.id}`,
        })
      }
    }

    for (const categoryId of worldExtremeCategoryIds) {
      if (!categoryIds.has(categoryId)) {
        context.addIssue({
          code: 'custom',
          message: `Missing world-extreme category: ${categoryId}`,
        })
      }
    }

    for (const metricId of worldExtremeMetricIds) {
      if (!metricIds.has(metricId)) {
        context.addIssue({
          code: 'custom',
          message: `Missing world-extreme metric: ${metricId}`,
        })
      }
    }
  })

export type WorldExtremeCategoryId = z.infer<
  typeof worldExtremeCategoryIdSchema
>
export type WorldExtremeMetricId = z.infer<typeof worldExtremeMetricIdSchema>
export type WorldExtremeUnit = z.infer<typeof worldExtremeUnitSchema>
export type WorldExtremeEntity = z.infer<typeof worldExtremeEntitySchema>
export type WorldExtremeEntry = z.infer<typeof worldExtremeEntrySchema>
export type WorldExtremeMetric = z.infer<typeof worldExtremeMetricSchema>
export type WorldExtremeCategory = z.infer<typeof worldExtremeCategorySchema>
