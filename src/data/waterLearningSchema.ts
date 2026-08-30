import { z } from 'zod'

export const waterLearningLayerIds = [
  'ocean',
  'lake',
  'waterway',
  'river',
] as const

export const waterLearningLayerIdSchema = z.enum(waterLearningLayerIds)

const comparisonSchema = z.object({
  title: z.string().min(2),
  items: z.array(z.string().min(8)).min(2).max(4),
})

export const waterLearningLayerSchema = z.object({
  id: waterLearningLayerIdSchema,
  name: z.string().min(2),
  aliases: z.array(z.string().min(1)).min(2),
  summary: z.string().min(30),
  coreKnowledge: z.array(z.string().min(12)).min(4).max(8),
  readingRules: z.array(z.string().min(12)).min(3).max(6),
  comparisons: z.array(comparisonSchema).min(1).max(4),
  commonMistakes: z.array(z.string().min(12)).min(2).max(5),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const waterObjectGroupSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  layerId: waterLearningLayerIdSchema,
  name: z.string().min(1),
  nameEn: z.string().min(2),
  summary: z.string().min(20),
  objectKind: z.enum(['waterbody', 'linearFeature']),
  objectIds: z.array(z.string().min(1)).min(1),
})

export const waterLearningSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  accessedAt: z.string().date(),
  usage: z.string().min(10),
})

export const waterLearningCatalogSchema = z
  .object({
    layers: z.array(waterLearningLayerSchema).length(4),
    groups: z.array(waterObjectGroupSchema).min(4),
    sources: z.array(waterLearningSourceSchema).min(3),
  })
  .superRefine((catalog, context) => {
    const layerIds = new Set(catalog.layers.map((layer) => layer.id))
    const sourceIds = new Set(catalog.sources.map((source) => source.id))
    const groupIds = new Set<string>()

    for (const layerId of waterLearningLayerIds) {
      if (!layerIds.has(layerId)) {
        context.addIssue({
          code: 'custom',
          message: `Missing water learning layer: ${layerId}`,
        })
      }
    }

    for (const layer of catalog.layers) {
      for (const sourceId of layer.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown water learning source ${sourceId} on ${layer.id}`,
          })
        }
      }
    }

    for (const group of catalog.groups) {
      if (groupIds.has(group.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate water object group: ${group.id}`,
        })
      }
      groupIds.add(group.id)
      if (!layerIds.has(group.layerId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown water layer ${group.layerId} on ${group.id}`,
        })
      }
    }
  })

export type WaterLearningLayerId = z.infer<typeof waterLearningLayerIdSchema>
export type WaterLearningLayer = z.infer<typeof waterLearningLayerSchema>
export type WaterObjectGroup = z.infer<typeof waterObjectGroupSchema>
export type WaterLearningSource = z.infer<typeof waterLearningSourceSchema>
