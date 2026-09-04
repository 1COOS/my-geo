import { z } from 'zod'

import { countries } from '../../data/countries'
import type { Country } from '../../data/countrySchema'
import {
  getQuestionPoolCountries,
  type QuestionDifficulty,
  type QuestionScope,
} from '../../data/countryQuestionFamiliarity'

export type KnowledgeQuestionKind =
  'flag-to-country' | 'country-to-flag' | 'country-to-capital'

export type KnowledgeQuestionFormat = 'choice' | 'character-fill'

export type KnowledgeQuestionOption = {
  id: string
  label: string
  flagAsset?: string
}

export type KnowledgeQuestionCharacter = {
  id: string
  character: string
}

type KnowledgeQuestionBase = {
  id: string
  kind: KnowledgeQuestionKind
  prompt: string
  scope: QuestionScope
  difficulty: QuestionDifficulty
  countryCode: string
  subjectFlagAsset?: string
}

export type KnowledgeChoiceQuestion = KnowledgeQuestionBase & {
  format: 'choice'
  correctOptionId: string
  options: KnowledgeQuestionOption[]
}

export type KnowledgeCharacterFillQuestion = KnowledgeQuestionBase & {
  format: 'character-fill'
  answerText: string
  acceptedAnswers: string[]
  characterBank: KnowledgeQuestionCharacter[]
}

export type KnowledgeQuestion =
  KnowledgeChoiceQuestion | KnowledgeCharacterFillQuestion

type RandomSource = () => number

const fillAnswerSchema = z
  .string()
  .min(1)
  .refine((answer) => /^\p{Script=Han}+$/u.test(answer), {
    message: 'Fill answers must contain only Chinese characters',
  })
  .refine((answer) => [...answer].length <= 12, {
    message: 'Fill answers must contain no more than 12 characters',
  })

const validatedFillAnswersByCountry = new Map(
  countries.map((country) => [
    country.code,
    {
      country: fillAnswerSchema.parse(country.name.zh),
      capitals: country.capitals.map((capital) =>
        fillAnswerSchema.parse(capital.name.zh),
      ),
    },
  ]),
)

const choiceQuestionKinds: KnowledgeQuestionKind[] = [
  'flag-to-country',
  'country-to-flag',
  'country-to-capital',
]

const fillQuestionKinds: Array<
  Extract<KnowledgeQuestionKind, 'flag-to-country' | 'country-to-capital'>
> = ['flag-to-country', 'country-to-capital']

function shuffle<T>(items: T[], random: RandomSource) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }
  return shuffled
}

function pickRandom<T>(items: readonly T[], random: RandomSource) {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length))
  return items[index]
}

function getCapitalLabel(country: Country) {
  return country.capitals.map((capital) => capital.name.zh).join('、')
}

function buildChoiceOptions(
  country: Country,
  kind: KnowledgeQuestionKind,
  pool: Country[],
  random: RandomSource,
) {
  const answerLabel =
    kind === 'country-to-capital' ? getCapitalLabel(country) : country.name.zh
  const candidates = shuffle(
    pool.filter((candidate) => candidate.code !== country.code),
    random,
  ).filter((candidate, index, all) => {
    const label =
      kind === 'country-to-capital'
        ? getCapitalLabel(candidate)
        : candidate.name.zh
    return (
      label !== answerLabel &&
      all.findIndex((other) =>
        kind === 'country-to-capital'
          ? getCapitalLabel(other) === label
          : other.name.zh === label,
      ) === index
    )
  })
  const selected = [country, ...candidates.slice(0, 3)]

  return shuffle(
    selected.map((optionCountry) => ({
      id: optionCountry.code,
      label:
        kind === 'country-to-capital'
          ? getCapitalLabel(optionCountry)
          : optionCountry.name.zh,
      flagAsset:
        kind === 'country-to-flag' ? optionCountry.flagAsset : undefined,
    })),
    random,
  )
}

function getDistractorCharacters(pool: Country[], answerText: string) {
  const answerCharacters = new Set([...answerText])
  return [
    ...new Set(
      pool
        .flatMap((country) => [
          validatedFillAnswersByCountry.get(country.code)!.country,
          ...validatedFillAnswersByCountry.get(country.code)!.capitals,
        ])
        .flatMap((answer) => [...answer])
        .filter((character) => !answerCharacters.has(character)),
    ),
  ]
}

function buildCharacterBank(
  questionId: string,
  answerText: string,
  pool: Country[],
  random: RandomSource,
) {
  const answerCharacters = [...answerText]
  const distractorCount = 12 - answerCharacters.length
  const distractors = shuffle(
    getDistractorCharacters(pool, answerText),
    random,
  ).slice(0, distractorCount)

  if (distractors.length !== distractorCount) {
    throw new Error(
      `Question ${questionId} cannot build a 12-character answer bank`,
    )
  }

  return shuffle([...answerCharacters, ...distractors], random).map(
    (character, index) => ({
      id: `${questionId}:character:${index}`,
      character,
    }),
  )
}

function createChoiceQuestion(
  scope: QuestionScope,
  difficulty: QuestionDifficulty,
  country: Country,
  index: number,
  pool: Country[],
  random: RandomSource,
): KnowledgeChoiceQuestion {
  const kind = pickRandom(choiceQuestionKinds, random)
  const id = `${scope}:${difficulty}:${index}:choice:${kind}:${country.code}`
  const prompt =
    kind === 'flag-to-country'
      ? '这面国旗属于哪个国家？'
      : kind === 'country-to-flag'
        ? `请选择${country.name.zh}的国旗`
        : `${country.name.zh}的首都是哪里？`

  return {
    id,
    format: 'choice',
    kind,
    prompt,
    scope,
    difficulty,
    countryCode: country.code,
    subjectFlagAsset:
      kind === 'flag-to-country' ? country.flagAsset : undefined,
    correctOptionId: country.code,
    options: buildChoiceOptions(country, kind, pool, random),
  }
}

function createFillQuestion(
  scope: QuestionScope,
  difficulty: QuestionDifficulty,
  country: Country,
  index: number,
  pool: Country[],
  random: RandomSource,
): KnowledgeCharacterFillQuestion {
  const kind = pickRandom(fillQuestionKinds, random)
  const answers = validatedFillAnswersByCountry.get(country.code)!
  const answerText =
    kind === 'flag-to-country'
      ? answers.country
      : pickRandom(answers.capitals, random)
  const acceptedAnswers =
    kind === 'flag-to-country' ? [answers.country] : answers.capitals
  const id = `${scope}:${difficulty}:${index}:character-fill:${kind}:${country.code}`
  const hasMultipleCapitals = answers.capitals.length > 1

  return {
    id,
    format: 'character-fill',
    kind,
    prompt:
      kind === 'flag-to-country'
        ? '请用中文字拼出这面国旗所属的国家'
        : hasMultipleCapitals
          ? `${country.name.zh}的首都之一是哪里？`
          : `${country.name.zh}的首都是哪里？`,
    scope,
    difficulty,
    countryCode: country.code,
    subjectFlagAsset:
      kind === 'flag-to-country' ? country.flagAsset : undefined,
    answerText,
    acceptedAnswers,
    characterBank: buildCharacterBank(id, answerText, pool, random),
  }
}

export const knowledgeChallengeQuestionCount = 10

export function createKnowledgeChallenge(
  scope: QuestionScope,
  difficulty: QuestionDifficulty,
  random: RandomSource = Math.random,
) {
  const questionPool = getQuestionPoolCountries(scope, difficulty)
  const countrySequence = shuffle(questionPool, random)

  return Array.from({ length: knowledgeChallengeQuestionCount }, (_, index) => {
    const country = countrySequence[index % countrySequence.length]
    return random() < 0.5
      ? createChoiceQuestion(
          scope,
          difficulty,
          country,
          index,
          questionPool,
          random,
        )
      : createFillQuestion(
          scope,
          difficulty,
          country,
          index,
          questionPool,
          random,
        )
  })
}

export function getChallengeScore(correctAnswers: number, total: number) {
  return total > 0 ? Math.round((correctAnswers / total) * 100) : 0
}

export function hasPassedKnowledgeChallenge(
  correctAnswers: number,
  total: number,
) {
  return getChallengeScore(correctAnswers, total) >= 80
}
