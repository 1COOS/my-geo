import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

export const landmarkCategorySchema = z.enum([
  'archaeological_site',
  'palace_castle',
  'religious_building',
  'fortification',
  'monument',
  'historic_building',
])

export const landmarkSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: localizedNameSchema,
  aliases: z.array(z.string().min(1)),
  category: landmarkCategorySchema,
  countryCode: countryCodeSchema,
  location: localizedNameSchema,
  position: geoPositionSchema,
  period: localizedNameSchema,
  summary: z.string().min(1),
  features: z.array(z.string().min(1)).min(1).max(3),
  facts: z.array(z.string().min(1)).min(2).max(3),
  labelPriority: z.number().int().min(1).max(100),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const landmarkCatalogSchema = z
  .array(landmarkSchema)
  .length(30)
  .superRefine((landmarks, context) => {
    const ids = new Set<string>()
    for (const landmark of landmarks) {
      if (ids.has(landmark.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate landmark id: ${landmark.id}`,
        })
      }
      ids.add(landmark.id)
    }
  })

export type LandmarkCategory = z.infer<typeof landmarkCategorySchema>
export type Landmark = z.infer<typeof landmarkSchema>
