import { z } from 'zod'

export const countrySchema = z.object({
  code: z.string().length(2),
  name: z.object({
    zh: z.string().min(1),
    en: z.string().min(1),
  }),
  capital: z.object({
    name: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  flagAsset: z.string().startsWith('/'),
  facts: z.array(z.string().min(1)),
})

export const countryCatalogSchema = z.array(countrySchema)

export type Country = z.infer<typeof countrySchema>
