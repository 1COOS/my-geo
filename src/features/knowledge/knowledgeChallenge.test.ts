import { describe, expect, it } from 'vitest'

import {
  createKnowledgeChallenge,
  getChallengeQuestionCount,
  getChallengeScore,
  hasPassedKnowledgeChallenge,
} from './knowledgeChallenge'

function deterministicRandom() {
  let seed = 7
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

describe('knowledge challenge', () => {
  it('builds a deterministic mixed East Asia round', () => {
    const questions = createKnowledgeChallenge(
      'east-asia',
      deterministicRandom(),
    )

    expect(questions).toHaveLength(10)
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
    }
  })

  it('uses same-continent distractors for a two-country region', () => {
    const questions = createKnowledgeChallenge(
      'australia-new-zealand',
      deterministicRandom(),
    )

    expect(questions).toHaveLength(4)
    expect(questions.every((question) => question.options.length === 4)).toBe(
      true,
    )
  })

  it('applies adaptive question counts and the 80 percent pass mark', () => {
    expect(getChallengeQuestionCount(2)).toBe(4)
    expect(getChallengeQuestionCount(5)).toBe(10)
    expect(getChallengeQuestionCount(17)).toBe(10)
    expect(getChallengeScore(8, 10)).toBe(80)
    expect(hasPassedKnowledgeChallenge(8, 10)).toBe(true)
    expect(hasPassedKnowledgeChallenge(7, 10)).toBe(false)
  })
})
