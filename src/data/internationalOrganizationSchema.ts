import { z } from 'zod'

import { countryCodeSchema, localizedNameSchema } from './countrySchema'

export const internationalAffiliationKindSchema = z.enum([
  'role',
  'organization',
  'mechanism',
])

export const internationalAffiliationCategorySchema = z.enum([
  'global',
  'regional',
  'security',
  'economic',
])

export const internationalAffiliationOtherMemberKindSchema = z.enum([
  'regional-organization',
  'territory',
  'other',
])

export const internationalAffiliationOtherMemberSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: internationalAffiliationOtherMemberKindSchema,
  name: localizedNameSchema,
})

export const internationalAffiliationDetailsSchema = z.object({
  established: z.string().min(1),
  headquarters: z.string().min(1),
  overview: z.string().min(1),
  purpose: z.string().min(1),
  membership: z.string().min(1),
})

export const internationalAffiliationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: internationalAffiliationKindSchema,
  category: internationalAffiliationCategorySchema,
  name: localizedNameSchema,
  abbreviation: z.string().min(1),
  monogram: z.string().regex(/^[A-Z0-9]{1,8}$/),
  details: internationalAffiliationDetailsSchema,
  officialMemberCount: z.number().int().positive(),
  memberCountryCodes: z.array(countryCodeSchema).min(1),
  otherMembers: z.array(internationalAffiliationOtherMemberSchema),
  sourceIds: z.array(z.string().min(1)).min(1),
})

export const internationalAffiliationCatalogSchema = z
  .array(internationalAffiliationSchema)
  .length(18)
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

      if (
        affiliation.officialMemberCount !==
        affiliation.memberCountryCodes.length + affiliation.otherMembers.length
      ) {
        context.addIssue({
          code: 'custom',
          message: `Official member total does not match represented members on ${affiliation.id}`,
          path: [affiliationIndex, 'officialMemberCount'],
        })
      }

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

      const seenOtherMemberIds = new Set<string>()
      for (const [memberIndex, member] of affiliation.otherMembers.entries()) {
        if (seenOtherMemberIds.has(member.id)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate other member ${member.id} on ${affiliation.id}`,
            path: [affiliationIndex, 'otherMembers', memberIndex, 'id'],
          })
        }
        seenOtherMemberIds.add(member.id)
      }

      const seenSourceIds = new Set<string>()
      for (const [sourceIndex, sourceId] of affiliation.sourceIds.entries()) {
        if (seenSourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate source ${sourceId} on ${affiliation.id}`,
            path: [affiliationIndex, 'sourceIds', sourceIndex],
          })
        }
        seenSourceIds.add(sourceId)
      }
    }
  })

export type InternationalAffiliation = z.infer<
  typeof internationalAffiliationSchema
>
export type InternationalAffiliationCategory = z.infer<
  typeof internationalAffiliationCategorySchema
>
export type InternationalAffiliationOtherMember = z.infer<
  typeof internationalAffiliationOtherMemberSchema
>
