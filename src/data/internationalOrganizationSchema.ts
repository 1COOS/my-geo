import { z } from 'zod'

import { countryCodeSchema, localizedNameSchema } from './countrySchema'

export const internationalAffiliationKindSchema = z.enum([
  'role',
  'organization',
])

export const internationalAffiliationCategorySchema = z.enum([
  'global',
  'regional',
  'functional',
  'security',
])

export const internationalAffiliationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: internationalAffiliationKindSchema,
  category: internationalAffiliationCategorySchema,
  name: localizedNameSchema,
  abbreviation: z.string().min(1),
  description: z.string().min(1),
  officialMemberCount: z.number().int().positive(),
  memberCountryCodes: z.array(countryCodeSchema).min(1),
  sourceId: z.string().min(1),
})

export const internationalAffiliationCatalogSchema = z
  .array(internationalAffiliationSchema)
  .length(7)
  .superRefine((affiliations, context) => {
    const seenIds = new Set<string>()

    for (const [affiliationIndex, affiliation] of affiliations.entries()) {
      if (seenIds.has(affiliation.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate international affiliation: ${affiliation.id}`,
          path: [affiliationIndex, 'id'],
        })
      }
      seenIds.add(affiliation.id)

      const seenCountryCodes = new Set<string>()
      for (const [
        countryIndex,
        countryCode,
      ] of affiliation.memberCountryCodes.entries()) {
        if (seenCountryCodes.has(countryCode)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate member country ${countryCode} on ${affiliation.id}`,
            path: [affiliationIndex, 'memberCountryCodes', countryIndex],
          })
        }
        seenCountryCodes.add(countryCode)
      }
    }
  })

export type InternationalAffiliation = z.infer<
  typeof internationalAffiliationSchema
>
export type InternationalAffiliationCategory = z.infer<
  typeof internationalAffiliationCategorySchema
>
