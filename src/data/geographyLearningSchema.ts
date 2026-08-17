import { z } from 'zod'

import { geoPositionSchema, localizedNameSchema } from './countrySchema'

export const geographyTopicIdSchema = z.enum([
  'grid-reading',
  'hemispheres',
  'latitude-zones',
  'earth-zones',
])

export const referenceLineIdSchema = z.enum([
  'equator',
  'tropic-of-cancer',
  'tropic-of-capricorn',
  'north-low-middle-boundary',
  'south-low-middle-boundary',
  'north-middle-high-boundary',
  'south-middle-high-boundary',
  'arctic-circle',
  'antarctic-circle',
  'prime-meridian',
  'antimeridian',
  'western-hemisphere-boundary',
  'eastern-hemisphere-boundary',
])

export const referenceLineCategorySchema = z.enum([
  'equator',
  'tropic',
  'polar-circle',
  'latitude-zone-boundary',
  'longitude-origin',
  'hemisphere-boundary',
])

export const geographyTopicSchema = z.object({
  id: geographyTopicIdSchema,
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)).min(1),
  summary: z.string().min(20),
  rules: z.array(z.string().min(10)).min(2).max(5),
  commonMistakes: z.array(z.string().min(10)).min(1).max(4),
  examples: z.array(z.string().min(10)).min(1).max(4),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const referenceLineSchema = z.object({
  id: referenceLineIdSchema,
  name: localizedNameSchema,
  shortLabel: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1),
  orientation: z.enum(['latitude', 'longitude']),
  coordinate: z.number().min(-180).max(180),
  category: referenceLineCategorySchema,
  topicId: geographyTopicIdSchema,
  anchorPosition: geoPositionSchema,
  focusPosition: geoPositionSchema,
  cameraDistance: z.number().min(260).max(425),
  explanation: z.string().min(20),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const geographyLearningSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  accessedAt: z.string().date(),
  usage: z.string().min(10),
})

export const geographyLearningCatalogSchema = z
  .object({
    topics: z.array(geographyTopicSchema).length(4),
    referenceLines: z.array(referenceLineSchema).length(13),
    sources: z.array(geographyLearningSourceSchema).min(2),
  })
  .superRefine((catalog, context) => {
    const topicIds = new Set(catalog.topics.map((topic) => topic.id))
    const sourceIds = new Set(catalog.sources.map((source) => source.id))
    const lineIds = new Set<string>()

    for (const topic of catalog.topics) {
      for (const sourceId of topic.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown geography source ${sourceId} on ${topic.id}`,
          })
        }
      }
    }

    for (const line of catalog.referenceLines) {
      if (lineIds.has(line.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate reference line ${line.id}`,
        })
      }
      lineIds.add(line.id)
      if (!topicIds.has(line.topicId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown geography topic ${line.topicId} on ${line.id}`,
        })
      }
      for (const sourceId of line.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown geography source ${sourceId} on ${line.id}`,
          })
        }
      }
    }
  })

export type GeographyTopicId = z.infer<typeof geographyTopicIdSchema>
export type ReferenceLineId = z.infer<typeof referenceLineIdSchema>
export type ReferenceLineCategory = z.infer<typeof referenceLineCategorySchema>
export type GeographyTopic = z.infer<typeof geographyTopicSchema>
export type ReferenceLine = z.infer<typeof referenceLineSchema>
export type GeographyLearningSource = z.infer<
  typeof geographyLearningSourceSchema
>
