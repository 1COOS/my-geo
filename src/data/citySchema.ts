import { z } from 'zod'

import {
  countryCodeSchema,
  geoPositionSchema,
  localizedNameSchema,
} from './countrySchema'

export const citySelectionReasonSchema = z.enum([
  'capital',
  'population_center',
  'economic_center',
  'global_fame',
  'cultural_tourism',
  'regional_center',
])

export const citySchema = geoPositionSchema.extend({
  id: z.string().regex(/^[a-z]{2}-[a-z0-9-]+$/),
  countryCode: countryCodeSchema,
  name: localizedNameSchema,
  population: z.number().int().nonnegative().nullable(),
  isCapital: z.boolean(),
  order: z.number().int().min(1).max(5),
  reasons: z.array(citySelectionReasonSchema).min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const cityCatalogSchema = z
  .array(citySchema)
  .superRefine((cities, context) => {
    const ids = new Set<string>()
    const countryOrders = new Set<string>()

    for (const city of cities) {
      if (ids.has(city.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate city id: ${city.id}`,
        })
      }
      ids.add(city.id)

      const countryOrder = `${city.countryCode}:${city.order}`
      if (countryOrders.has(countryOrder)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate city order: ${countryOrder}`,
        })
      }
      countryOrders.add(countryOrder)

      if (city.isCapital && !city.reasons.includes('capital')) {
        context.addIssue({
          code: 'custom',
          message: `Capital city ${city.id} is missing the capital reason`,
        })
      }
      if (!city.isCapital && city.reasons.includes('capital')) {
        context.addIssue({
          code: 'custom',
          message: `Non-capital city ${city.id} has the capital reason`,
        })
      }
    }
  })

export type City = z.infer<typeof citySchema>
export type CitySelectionReason = z.infer<typeof citySelectionReasonSchema>
