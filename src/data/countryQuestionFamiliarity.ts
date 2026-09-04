import { z } from 'zod'

import { countries } from './countries'
import { countryCodeSchema, type Country } from './countrySchema'
import {
  knowledgeContinentIdSchema,
  knowledgeContinents,
  knowledgeRegionByCountryCode,
  type KnowledgeContinentId,
} from './knowledgeRegions'

export const questionDifficultySchema = z.enum(['easy', 'normal', 'hard'])

export type QuestionDifficulty = z.infer<typeof questionDifficultySchema>

export const questionScopeSchema = z.union([
  z.literal('world'),
  knowledgeContinentIdSchema,
])

export type QuestionScope = z.infer<typeof questionScopeSchema>

export const questionWorldScope = {
  id: 'world',
  name: { zh: '全球', en: 'World' },
} as const

export const questionDifficulties = [
  { id: 'easy', name: '简单', note: '最常见国家' },
  { id: 'normal', name: '普通', note: '较熟悉国家' },
  { id: 'hard', name: '困难', note: '冷门国家' },
] as const satisfies ReadonlyArray<{
  id: QuestionDifficulty
  name: string
  note: string
}>

const expectedDifficultyCounts: Record<
  KnowledgeContinentId,
  Record<QuestionDifficulty, number>
> = {
  asia: { easy: 12, normal: 16, hard: 19 },
  europe: { easy: 11, normal: 16, hard: 18 },
  africa: { easy: 14, normal: 19, hard: 21 },
  americas: { easy: 9, normal: 12, hard: 14 },
  oceania: { easy: 4, normal: 5, hard: 5 },
}

const familiarityDefinitionSchema = z.object({
  continentId: knowledgeContinentIdSchema,
  difficulties: z.object({
    easy: z.array(countryCodeSchema),
    normal: z.array(countryCodeSchema),
    hard: z.array(countryCodeSchema),
  }),
})

const familiarityDefinitions = [
  {
    continentId: 'asia',
    difficulties: {
      easy: [
        'CN',
        'JP',
        'KR',
        'IN',
        'SG',
        'TH',
        'TR',
        'SA',
        'AE',
        'ID',
        'VN',
        'KP',
      ],
      normal: [
        'MY',
        'PH',
        'IL',
        'PK',
        'IR',
        'IQ',
        'QA',
        'KZ',
        'MN',
        'NP',
        'KH',
        'MM',
        'BD',
        'LK',
        'AF',
        'PS',
      ],
      hard: [
        'AM',
        'AZ',
        'BH',
        'BN',
        'BT',
        'GE',
        'JO',
        'KG',
        'KW',
        'LA',
        'LB',
        'MV',
        'OM',
        'SY',
        'TJ',
        'TL',
        'TM',
        'UZ',
        'YE',
      ],
    },
  },
  {
    continentId: 'europe',
    difficulties: {
      easy: ['GB', 'FR', 'DE', 'IT', 'ES', 'RU', 'CH', 'NL', 'GR', 'SE', 'NO'],
      normal: [
        'PT',
        'AT',
        'BE',
        'DK',
        'FI',
        'IE',
        'IS',
        'PL',
        'UA',
        'CZ',
        'HU',
        'RO',
        'BY',
        'VA',
        'MC',
        'LU',
      ],
      hard: [
        'AD',
        'AL',
        'BA',
        'BG',
        'CY',
        'EE',
        'HR',
        'LI',
        'LT',
        'LV',
        'MD',
        'ME',
        'MK',
        'MT',
        'RS',
        'SI',
        'SK',
        'SM',
      ],
    },
  },
  {
    continentId: 'africa',
    difficulties: {
      easy: [
        'EG',
        'ZA',
        'NG',
        'KE',
        'ET',
        'MA',
        'DZ',
        'LY',
        'SD',
        'TZ',
        'MG',
        'SO',
        'GH',
        'CD',
      ],
      normal: [
        'TN',
        'UG',
        'ZW',
        'ZM',
        'AO',
        'MZ',
        'NA',
        'BW',
        'RW',
        'SN',
        'CI',
        'CM',
        'ML',
        'NE',
        'SS',
        'MU',
        'SC',
        'LR',
        'GA',
      ],
      hard: [
        'BF',
        'BI',
        'BJ',
        'CF',
        'CG',
        'CV',
        'DJ',
        'ER',
        'GM',
        'GN',
        'GQ',
        'GW',
        'KM',
        'LS',
        'MR',
        'MW',
        'SL',
        'ST',
        'SZ',
        'TD',
        'TG',
      ],
    },
  },
  {
    continentId: 'americas',
    difficulties: {
      easy: ['US', 'CA', 'BR', 'MX', 'AR', 'CU', 'CL', 'PE', 'CO'],
      normal: [
        'VE',
        'BO',
        'EC',
        'PA',
        'CR',
        'JM',
        'BS',
        'UY',
        'PY',
        'DO',
        'GT',
        'HT',
      ],
      hard: [
        'AG',
        'BB',
        'BZ',
        'DM',
        'GD',
        'GY',
        'HN',
        'KN',
        'LC',
        'NI',
        'SR',
        'SV',
        'TT',
        'VC',
      ],
    },
  },
  {
    continentId: 'oceania',
    difficulties: {
      easy: ['AU', 'NZ', 'FJ', 'PG'],
      normal: ['WS', 'TO', 'FM', 'MH', 'SB'],
      hard: ['VU', 'PW', 'KI', 'TV', 'NR'],
    },
  },
] satisfies z.input<typeof familiarityDefinitionSchema>[]

export const countryQuestionFamiliarity = z
  .array(familiarityDefinitionSchema)
  .length(5)
  .superRefine((definitions, context) => {
    const assignedCodes = new Set<string>()
    const validCodes = new Set(countries.map((country) => country.code))

    for (const definition of definitions) {
      for (const difficulty of questionDifficultySchema.options) {
        const codes = definition.difficulties[difficulty]
        const expectedCount =
          expectedDifficultyCounts[definition.continentId][difficulty]
        if (codes.length !== expectedCount) {
          context.addIssue({
            code: 'custom',
            message: `${definition.continentId}:${difficulty} expected ${expectedCount} countries, received ${codes.length}`,
          })
        }

        for (const code of codes) {
          if (!validCodes.has(code)) {
            context.addIssue({
              code: 'custom',
              message: `Unknown country code ${code}`,
            })
          }
          if (assignedCodes.has(code)) {
            context.addIssue({
              code: 'custom',
              message: `${code} appears in more than one question difficulty`,
            })
          }
          assignedCodes.add(code)

          const actualContinentId =
            knowledgeRegionByCountryCode.get(code)?.continentId
          if (actualContinentId !== definition.continentId) {
            context.addIssue({
              code: 'custom',
              message: `${code} belongs to ${actualContinentId}, not ${definition.continentId}`,
            })
          }
        }
      }
    }

    if (assignedCodes.size !== countries.length) {
      context.addIssue({
        code: 'custom',
        message: `Expected ${countries.length} assigned countries, received ${assignedCodes.size}`,
      })
    }
  })
  .parse(familiarityDefinitions)

const familiarityByContinent = new Map(
  countryQuestionFamiliarity.map((definition) => [
    definition.continentId,
    definition,
  ]),
)

const countryByCode = new Map(
  countries.map((country) => [country.code, country]),
)

export function getQuestionDifficulty(difficulty: QuestionDifficulty) {
  return questionDifficulties.find((item) => item.id === difficulty)!
}

export function getQuestionPoolCountries(
  scope: QuestionScope,
  difficulty: QuestionDifficulty,
): Country[] {
  if (scope === 'world') {
    return countryQuestionFamiliarity.flatMap((definition) =>
      definition.difficulties[difficulty].map((code) =>
        countryByCode.get(code),
      ),
    ) as Country[]
  }

  return familiarityByContinent
    .get(scope)!
    .difficulties[difficulty].map((code) => countryByCode.get(code)!)
}

export function getQuestionPoolCountryCount(
  scope: QuestionScope,
  difficulty: QuestionDifficulty,
) {
  return getQuestionPoolCountries(scope, difficulty).length
}

export function getQuestionContinentCountryCount(
  continentId: KnowledgeContinentId,
) {
  const definition = familiarityByContinent.get(continentId)!
  return questionDifficultySchema.options.reduce(
    (total, difficulty) => total + definition.difficulties[difficulty].length,
    0,
  )
}

export function getQuestionChallengeId(
  scope: QuestionScope,
  difficulty: QuestionDifficulty,
) {
  return `${scope}:${difficulty}` as const
}

export function getQuestionContinent(continentId: KnowledgeContinentId) {
  return knowledgeContinents.find((continent) => continent.id === continentId)!
}

export function getQuestionScope(scope: QuestionScope) {
  return scope === 'world' ? questionWorldScope : getQuestionContinent(scope)
}
