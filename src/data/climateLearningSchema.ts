import { z } from 'zod'

const localizedNameSchema = z.object({
  zh: z.string().min(1),
  en: z.string().min(1),
})

const geoPositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const climateTypeIds = [
  'tropical-rainforest',
  'tropical-monsoon',
  'tropical-savanna',
  'tropical-desert',
  'subtropical-monsoon-humid',
  'mediterranean',
  'temperate-oceanic',
  'temperate-monsoon',
  'temperate-continental',
  'subarctic-coniferous',
  'tundra',
  'ice-cap',
  'highland-mountain',
] as const

export const climateOceanColor = '#1685cc' as const
export const climateOceanRgb = [22, 133, 204] as const

export const climateTypeIdSchema = z.enum(climateTypeIds)
export type ClimateTypeId = z.infer<typeof climateTypeIdSchema>

export const climateSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  accessedAt: z.iso.date(),
  license: z.string().min(1),
  usage: z.string().min(1),
})

export const climateTypeSchema = z.object({
  id: climateTypeIdSchema,
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)).min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  summary: z.string().min(1),
  distribution: z.string().min(1),
  temperature: z.string().min(1),
  precipitation: z.string().min(1),
  landscape: z.string().min(1),
  examples: z.array(z.string().min(1)).min(1),
  commonMistake: z.string().min(1),
  representativePosition: geoPositionSchema,
  cameraDistance: z.number().positive(),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const climateLearningCatalogSchema = z.object({
  period: z.literal('1991–2020'),
  topic: z.object({
    id: z.literal('world-climate-types'),
    name: localizedNameSchema,
    aliases: z.array(z.string().min(1)).min(1),
    summary: z.string().min(1),
  }),
  sources: z.array(climateSourceSchema).min(1),
  climateTypes: z.array(climateTypeSchema).length(climateTypeIds.length),
})

export type ClimateType = z.infer<typeof climateTypeSchema>
export type ClimateLearningCatalog = z.infer<
  typeof climateLearningCatalogSchema
>

export const climateMaskSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['highland', 'temperate-monsoon', 'tropical-savanna']),
  name: z.string().min(1),
  polygon: z
    .array(
      z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    )
    .min(4),
})

export type ClimateMask = z.infer<typeof climateMaskSchema>

export type ClimateClassification = {
  position: {
    latitude: number
    longitude: number
  }
  climateTypeId: ClimateTypeId | null
  period: '1991–2020'
}

export type ClimateKnowledgeSelection =
  | {
      kind: 'overview'
      classification?: ClimateClassification
    }
  | {
      kind: 'type'
      climateTypeId: ClimateTypeId
      classification?: ClimateClassification
    }

const balancedClimateRasterAssetSchema = z.object({
  url: z.string().startsWith('/climate/'),
  width: z.literal(2048),
  height: z.literal(1024),
  bytes: z
    .number()
    .int()
    .positive()
    .max(4 * 1024 * 1024),
  sha256: z.string().length(64),
})

const lowClimateRasterAssetSchema = z.object({
  url: z.string().startsWith('/climate/'),
  width: z.literal(1024),
  height: z.literal(512),
  bytes: z
    .number()
    .int()
    .positive()
    .max(4 * 1024 * 1024),
  sha256: z.string().length(64),
})

export const climateLayerManifestSchema = z.object({
  period: z.literal('1991–2020'),
  source: z.object({
    archiveName: z.literal('koppen_geiger_tif.zip'),
    archiveBytes: z.literal(130618411),
    archiveMd5: z.literal('7fc2f5a15d4f5fe0ce59c9a9b502aa09'),
    rasterPath: z.literal('1991_2020/koppen_geiger_0p1.tif'),
    rasterWidth: z.literal(3600),
    rasterHeight: z.literal(1800),
  }),
  palette: z.array(
    z.object({
      id: climateTypeIdSchema,
      color: z.string().regex(/^#[0-9a-f]{6}$/i),
      rgb: z.tuple([
        z.number().int().min(0).max(255),
        z.number().int().min(0).max(255),
        z.number().int().min(0).max(255),
      ]),
    }),
  ),
  assets: z.object({
    balanced: balancedClimateRasterAssetSchema.extend({
      url: z.literal('/climate/climate-types-2048-v2.png'),
    }),
    low: lowClimateRasterAssetSchema.extend({
      url: z.literal('/climate/climate-types-1024-v2.png'),
    }),
  }),
  highlightAssets: z.object({
    balanced: z.record(climateTypeIdSchema, balancedClimateRasterAssetSchema),
    low: z.record(climateTypeIdSchema, lowClimateRasterAssetSchema),
  }),
  highlightBoundaryAssets: z.object({
    balanced: z.record(climateTypeIdSchema, balancedClimateRasterAssetSchema),
    low: z.record(climateTypeIdSchema, lowClimateRasterAssetSchema),
  }),
  anchors: z.record(z.string(), climateTypeIdSchema.nullable()),
})

export type ClimateLayerManifest = z.infer<typeof climateLayerManifestSchema>
