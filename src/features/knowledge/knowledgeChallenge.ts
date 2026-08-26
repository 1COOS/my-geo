import type { Country } from '../../data/countrySchema'
import {
  getQuestionPoolCountries,
  type QuestionDifficulty,
} from '../../data/countryQuestionFamiliarity'
import type { KnowledgeContinentId } from '../../data/knowledgeRegions'

export type KnowledgeQuestionKind =
  'flag-to-country' | 'country-to-flag' | 'country-to-capital'

export type KnowledgeQuestionOption = {
  id: string
  label: string
  flagAsset?: string
}

export type KnowledgeQuestion = {
  id: string
  kind: KnowledgeQuestionKind
  prompt: string
  continentId: KnowledgeContinentId
  difficulty: QuestionDifficulty
  countryCode: string
  subjectFlagAsset?: string
  correctOptionId: string
  options: KnowledgeQuestionOption[]
}

type RandomSource = () => number

const questionKinds: KnowledgeQuestionKind[] = [
  'flag-to-country',
  'country-to-flag',
  'country-to-capital',
]

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

function getCapitalLabel(country: Country) {
  return country.capitals.map((capital) => capital.name.zh).join('、')
}

function buildOptions(
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

export const knowledgeChallengeQuestionCount = 10

export function createKnowledgeChallenge(
  continentId: KnowledgeContinentId,
  difficulty: QuestionDifficulty,
  random: RandomSource = Math.random,
) {
  const questionPool = getQuestionPoolCountries(continentId, difficulty)
  const countrySequence = shuffle(questionPool, random)

  return Array.from({ length: knowledgeChallengeQuestionCount }, (_, index) => {
    const country = countrySequence[index % countrySequence.length]
    const kind = questionKinds[index % questionKinds.length]
    const options = buildOptions(country, kind, questionPool, random)
    const prompt =
      kind === 'flag-to-country'
        ? '这面国旗属于哪个国家？'
        : kind === 'country-to-flag'
          ? `请选择${country.name.zh}的国旗`
          : `${country.name.zh}的首都是哪里？`

    return {
      id: `${continentId}:${difficulty}:${index}:${kind}:${country.code}`,
      kind,
      prompt,
      continentId,
      difficulty,
      countryCode: country.code,
      subjectFlagAsset:
        kind === 'flag-to-country' ? country.flagAsset : undefined,
      correctOptionId: country.code,
      options,
    } satisfies KnowledgeQuestion
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
