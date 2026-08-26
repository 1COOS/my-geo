import { describe, expect, it } from 'vitest'

import {
  createKnowledgeChallenge,
  getChallengeScore,
  hasPassedKnowledgeChallenge,
  knowledgeChallengeQuestionCount,
} from './knowledgeChallenge'

function deterministicRandom() {
  let seed = 7
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

describe('knowledge challenge', () => {
  it('builds a deterministic mixed easy Asia round', () => {
    const questions = createKnowledgeChallenge(
      'asia',
      'easy',
      deterministicRandom(),
    )

    expect(questions).toHaveLength(knowledgeChallengeQuestionCount)
    expect(new Set(questions.map((question) => question.kind))).toEqual(
      new Set(['flag-to-country', 'country-to-flag', 'country-to-capital']),
    )
    for (const question of questions) {
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((option) => option.id)).size).toBe(4)
      expect(
        question.options.some(
          (option) => option.id === question.correctOptionId,
        ),
      ).toBe(true)
      expect(question.continentId).toBe('asia')
      expect(question.difficulty).toBe('easy')
    }
  })

  it('keeps subjects and distractors inside the selected difficulty pool', () => {
    const questions = createKnowledgeChallenge(
      'oceania',
      'hard',
      deterministicRandom(),
    )
    const hardOceaniaCodes = new Set(['VU', 'PW', 'KI', 'TV', 'NR'])

    expect(questions).toHaveLength(10)
    expect(questions.every((question) => question.options.length === 4)).toBe(
      true,
    )
    expect(
      questions.every(
        (question) =>
          hardOceaniaCodes.has(question.countryCode) &&
          question.options.every((option) => hardOceaniaCodes.has(option.id)),
      ),
    ).toBe(true)
  })

  it('uses the 80 percent pass mark', () => {
    expect(getChallengeScore(8, 10)).toBe(80)
    expect(hasPassedKnowledgeChallenge(8, 10)).toBe(true)
    expect(hasPassedKnowledgeChallenge(7, 10)).toBe(false)
  })
})
