import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

export const territoryIdSchema = z.string().regex(/^[a-z0-9-]+$/)

export const territoryTypeSchema = z.enum([
  'autonomous-territory',
  'overseas-territory',
  'unincorporated-territory',
  'overseas-department',
  'overseas-collectivity',
  'special-collectivity',
])

const territoryCurrencySchema = z.object({
  code: z.string().regex(/^[A-Z]{3}$/),
  symbol: z.string().min(1),
  name: localizedNameSchema,
})

const sourcedTerritorySectionSchema = z.object({
  summary: z.string().min(1),
  items: z.array(z.string().min(1)).min(1).max(6),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const territorySourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  accessedAt: z.string().date(),
  license: z.string().min(1),
})

export const territorySchema = z.object({
  id: territoryIdSchema,
  code: z.string().regex(/^[A-Z]{2}$/),
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)),
  type: territoryTypeSchema,
  administeringCountryCode: countryCodeSchema,
  relationSummary: z.string().min(1),
  continent: localizedNameSchema,
  subregion: localizedNameSchema,
  center: geoPositionSchema,
  cameraDistance: z.number().min(110).max(360),
  displayMode: z.enum(['polygon', 'marker']),
  areaSquareKilometers: z.number().positive(),
  population: z.number().int().positive(),
  populationYear: z.number().int().min(2020).max(2100),
  administrativeCenter: localizedNameSchema,
  currency: territoryCurrencySchema,
  geography: sourcedTerritorySectionSchema,
  people: sourcedTerritorySectionSchema,
  economy: sourcedTerritorySectionSchema,
  settlements: z.array(localizedNameSchema).min(1).max(5),
  landmarks: z.array(localizedNameSchema).min(1).max(5),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const territoryCatalogSchema = z
  .array(territorySchema)
  .length(9)
  .superRefine((territories, context) => {
    const ids = new Set<string>()
    const codes = new Set<string>()
    for (const territory of territories) {
      if (ids.has(territory.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate territory id: ${territory.id}`,
        })
      }
      if (codes.has(territory.code)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate territory code: ${territory.code}`,
        })
      }
      ids.add(territory.id)
      codes.add(territory.code)
    }
  })

export const territorySourceRegistrySchema = z
  .array(territorySourceSchema)
  .min(1)

const territoryBoundaryGeometrySchema = z.object({
  type: z.enum(['Polygon', 'MultiPolygon']),
  coordinates: z.array(z.unknown()).min(1),
})

export const territoryBoundarySchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({
    territoryId: territoryIdSchema,
  }),
  geometry: territoryBoundaryGeometrySchema,
})

export const territoryBoundaryCatalogSchema = z
  .array(territoryBoundarySchema)
  .length(4)

export type Territory = z.infer<typeof territorySchema>
export type TerritoryType = z.infer<typeof territoryTypeSchema>
export type TerritoryBoundary = z.infer<typeof territoryBoundarySchema>
export type TerritorySource = z.infer<typeof territorySourceSchema>
