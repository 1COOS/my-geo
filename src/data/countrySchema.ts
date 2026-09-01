import { z } from 'zod'

export const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/)
export const countryAlpha3CodeSchema = z.string().regex(/^[A-Z]{3}$/)

export const localizedNameSchema = z.object({
  zh: z.string().min(1),
  en: z.string().min(1),
})

export const geoPositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const capitalSchema = geoPositionSchema.extend({
  name: localizedNameSchema,
})

export const languageSchema = z.object({
  code: z.string().min(2),
  name: localizedNameSchema,
})

export const currencySchema = z.object({
  code: z.string().regex(/^[A-Z]{3}$/),
  symbol: z.string().min(1),
  name: localizedNameSchema,
})

export const adjacentRegionCodeSchema = z.enum([
  'ESH',
  'GIB',
  'GUF',
  'HKG',
  'MAC',
  'UNK',
])

export const adjacentRegionSchema = z.object({
  code: adjacentRegionCodeSchema,
  kind: z.literal('region'),
  name: localizedNameSchema,
})

export const countryHighlightSchema = z.object({
  text: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
})

const sourcedCountryProfileSectionSchema = z.object({
  summary: z.string().min(1).optional(),
  keywords: z.array(z.string().min(1)).max(3),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const countryResourceProfileSchema =
  sourcedCountryProfileSectionSchema.extend({
    groups: z
      .array(
        z.object({
          label: z.string().min(1),
          items: z.array(z.string().min(1)).min(1),
        }),
      )
      .max(7),
  })

export const countryDemographicItemSchema = z
  .object({
    name: z.string().min(1),
    sharePercent: z.number().min(0).max(100).optional(),
    estimateYear: z.number().int().min(1900).max(2100).optional(),
  })
  .refine(
    (item) =>
      (item.sharePercent === undefined) === (item.estimateYear === undefined),
    { message: 'Demographic share and estimate year must appear together' },
  )

export const countryPeopleProfileSchema =
  sourcedCountryProfileSectionSchema.extend({
    ethnicGroups: z.array(countryDemographicItemSchema).max(5),
    religions: z.array(countryDemographicItemSchema).max(5),
  })

export const countryEconomyProfileSchema =
  sourcedCountryProfileSectionSchema.extend({
    agriculture: z.array(z.string().min(1)).max(3),
    industry: z.array(z.string().min(1)).max(3),
    tourism: z.array(z.string().min(1)).max(3),
  })

export const countrySignatureItemSchema = z.object({
  kind: z.enum([
    'nature',
    'geography',
    'landmark',
    'product',
    'engineering',
    'achievement',
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const countryProfileSchema = z.object({
  resources: countryResourceProfileSchema,
  people: countryPeopleProfileSchema,
  economy: countryEconomyProfileSchema,
  signature: z.array(countrySignatureItemSchema).min(1).optional(),
})

const countryBaseSchema = z.object({
  code: countryCodeSchema,
  alpha3Code: countryAlpha3CodeSchema,
  numericCode: z.string().regex(/^\d{3}$/),
  name: localizedNameSchema,
  officialName: localizedNameSchema,
  continent: localizedNameSchema,
  subregion: localizedNameSchema,
  center: geoPositionSchema,
  capitals: z.array(capitalSchema),
  languages: z.array(languageSchema).min(1),
  currencies: z.array(currencySchema).min(1),
  areaSquareKilometers: z.number().positive(),
  population: z.number().int().positive(),
  populationYear: z.number().int().min(1900).max(2100),
  populationSourceId: z.enum(['world-bank-population', 'vatican-population']),
  landlocked: z.boolean(),
  borderCountryCodes: z.array(countryCodeSchema),
  adjacentRegions: z.array(adjacentRegionSchema),
  flagAsset: z.string().regex(/^\/flags\/[a-z]{2}\.svg$/),
  hasGeometry: z.boolean(),
  profile: countryProfileSchema,
})

export const basicCountrySchema = countryBaseSchema.extend({
  featured: z.literal(false),
  highlights: z.tuple([countryHighlightSchema]),
})

export const featuredCountrySchema = countryBaseSchema.extend({
  featured: z.literal(true),
  highlights: z.tuple([
    countryHighlightSchema,
    countryHighlightSchema,
    countryHighlightSchema,
  ]),
})

export const countrySchema = z.discriminatedUnion('featured', [
  basicCountrySchema,
  featuredCountrySchema,
])

export const countryCatalogSchema = z
  .array(countrySchema)
  .length(195)
  .superRefine((countries, context) => {
    const seenCodes = new Set<string>()
    const validCodes = new Set(countries.map((country) => country.code))

    for (const country of countries) {
      if (seenCodes.has(country.code)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate country code: ${country.code}`,
        })
      }
      seenCodes.add(country.code)

      for (const borderCode of country.borderCountryCodes) {
        if (!validCodes.has(borderCode)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown border country ${borderCode} on ${country.code}`,
          })
        }
      }
    }
  })

export const countrySourceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    publisher: z.string().min(1),
    version: z.string().min(1).optional(),
    accessedAt: z.string().date().optional(),
    url: z.string().url(),
    license: z.string().min(1),
  })
  .refine((source) => source.version || source.accessedAt, {
    message: 'A source must include a version or access date',
  })

export const countrySourceRegistrySchema = z
  .array(countrySourceSchema)
  .min(1)
  .superRefine((sources, context) => {
    const seenIds = new Set<string>()
    for (const source of sources) {
      if (seenIds.has(source.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate source id: ${source.id}`,
        })
      }
      seenIds.add(source.id)
    }
  })

const polygonCoordinatesSchema = z.array(z.unknown()).min(1)

const boundaryGeometrySchema = z.object({
  type: z.enum(['Polygon', 'MultiPolygon']),
  coordinates: polygonCoordinatesSchema,
})

export const countryBoundarySchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({
    code: countryCodeSchema,
    nameZh: z.string().min(1),
    nameEn: z.string().min(1),
  }),
  geometry: boundaryGeometrySchema,
})

export const landmassSchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({
    id: z.literal('antarctica'),
    nameZh: z.literal('南极洲'),
    nameEn: z.literal('Antarctica'),
  }),
  geometry: boundaryGeometrySchema,
})

export const countryBoundariesSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(countryBoundarySchema).min(150),
  landmasses: z.tuple([landmassSchema]),
})

export type Country = z.infer<typeof countrySchema>
export type CountryProfile = z.infer<typeof countryProfileSchema>
export type CountryDemographicItem = z.infer<
  typeof countryDemographicItemSchema
>
export type CountrySignatureItem = z.infer<typeof countrySignatureItemSchema>
export type FeaturedCountry = z.infer<typeof featuredCountrySchema>
export type CountrySource = z.infer<typeof countrySourceSchema>
export type CountryBoundary = z.infer<typeof countryBoundarySchema>
export type Landmass = z.infer<typeof landmassSchema>
export type CountryBoundaries = z.infer<typeof countryBoundariesSchema>
