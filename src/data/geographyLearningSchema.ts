import { z } from 'zod'

import { geoPositionSchema, localizedNameSchema } from './countrySchema'

export const geographyTopicIds = [
  'grid-reading',
  'hemispheres',
  'latitude-zones',
  'earth-zones',
] as const

export const geographyTopicIdSchema = z.enum(geographyTopicIds)

export const referenceLineIds = [
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
] as const

export const referenceLineIdSchema = z.enum(referenceLineIds)

export const referenceLineCategorySchema = z.enum([
  'equator',
  'tropic',
  'polar-circle',
  'latitude-zone-boundary',
  'longitude-origin',
  'hemisphere-boundary',
])

export const geographyOverviewSchema = z.object({
  name: localizedNameSchema,
  eyebrow: z.string().min(4),
  summary: z.string().min(20),
  currentViewLabel: z.string().min(4),
  diagramCaption: z.string().min(8),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const geographyTopicSchema = z.object({
  id: geographyTopicIdSchema,
  name: localizedNameSchema,
  shortName: localizedNameSchema,
  visualization: z.object({
    kind: z.literal('reference-lines'),
  }),
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
    overview: geographyOverviewSchema,
    topics: z.array(geographyTopicSchema).min(1),
    referenceLines: z.array(referenceLineSchema).min(1),
    sources: z.array(geographyLearningSourceSchema).min(2),
  })
  .superRefine((catalog, context) => {
    const topicIds = new Set<string>()
    const sourceIds = new Set(catalog.sources.map((source) => source.id))
    const lineIds = new Set<string>()

    for (const sourceId of catalog.overview.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown geography source ${sourceId} on overview`,
        })
      }
    }

    for (const topic of catalog.topics) {
      if (topicIds.has(topic.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate geography topic ${topic.id}`,
        })
      }
      topicIds.add(topic.id)
      for (const sourceId of topic.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown geography source ${sourceId} on ${topic.id}`,
          })
        }
      }
    }

    for (const topicId of geographyTopicIds) {
      if (!topicIds.has(topicId)) {
        context.addIssue({
          code: 'custom',
          message: `Missing geography topic ${topicId}`,
        })
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

    for (const lineId of referenceLineIds) {
      if (!lineIds.has(lineId)) {
        context.addIssue({
          code: 'custom',
          message: `Missing geography reference line ${lineId}`,
        })
      }
    }
  })

export type GeographyTopicId = z.infer<typeof geographyTopicIdSchema>
export type ReferenceLineId = z.infer<typeof referenceLineIdSchema>
export type ReferenceLineCategory = z.infer<typeof referenceLineCategorySchema>
export type GeographyOverview = z.infer<typeof geographyOverviewSchema>
export type GeographyTopic = z.infer<typeof geographyTopicSchema>
export type ReferenceLine = z.infer<typeof referenceLineSchema>
export type GeographyLearningSource = z.infer<
  typeof geographyLearningSourceSchema
>
