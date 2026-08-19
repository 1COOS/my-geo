import type { Country } from '../../data/countrySchema'
import {
  getCountriesForKnowledgeRegion,
  getKnowledgeRegion,
  knowledgeRegions,
  type KnowledgeRegionId,
} from '../../data/knowledgeRegions'
import { countries } from '../../data/countries'

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

function getDistractorPool(
  regionId: KnowledgeRegionId,
  regionCountries: Country[],
) {
  if (regionCountries.length >= 4) return regionCountries
  const continentId = getKnowledgeRegion(regionId)!.continentId
  const continentCodes = new Set(
    knowledgeRegions
      .filter((region) => region.continentId === continentId)
      .flatMap((region) => region.countryCodes),
  )
  return countries.filter((country) => continentCodes.has(country.code))
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

export function getChallengeQuestionCount(countryCount: number) {
  return Math.min(10, Math.max(4, countryCount * 2))
}

export function createKnowledgeChallenge(
  regionId: KnowledgeRegionId,
  random: RandomSource = Math.random,
) {
  const regionCountries = getCountriesForKnowledgeRegion(regionId)
  const questionCount = getChallengeQuestionCount(regionCountries.length)
  const countrySequence = shuffle(regionCountries, random)
  const distractorPool = getDistractorPool(regionId, regionCountries)

  return Array.from({ length: questionCount }, (_, index) => {
    const country = countrySequence[index % countrySequence.length]
    const kind = questionKinds[index % questionKinds.length]
    const options = buildOptions(country, kind, distractorPool, random)
    const prompt =
      kind === 'flag-to-country'
        ? '这面国旗属于哪个国家？'
        : kind === 'country-to-flag'
          ? `请选择${country.name.zh}的国旗`
          : `${country.name.zh}的首都是哪里？`

    return {
      id: `${regionId}:${index}:${kind}:${country.code}`,
      kind,
      prompt,
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
