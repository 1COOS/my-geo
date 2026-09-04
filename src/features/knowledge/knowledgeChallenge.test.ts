import { describe, expect, it } from 'vitest'

import {
  createKnowledgeChallenge,
  getChallengeScore,
  hasPassedKnowledgeChallenge,
  knowledgeChallengeQuestionCount,
} from './knowledgeChallenge'

describe('knowledge challenge', () => {
  it('builds ten choice questions when independent format draws are low', () => {
    const questions = createKnowledgeChallenge('asia', 'easy', () => 0)

    expect(questions).toHaveLength(knowledgeChallengeQuestionCount)
    expect(questions.every((question) => question.format === 'choice')).toBe(
      true,
    )
    for (const question of questions) {
      if (question.format !== 'choice') throw new Error('Expected choice')
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((option) => option.id)).size).toBe(4)
      expect(
        question.options.some(
          (option) => option.id === question.correctOptionId,
        ),
      ).toBe(true)
      expect(question.scope).toBe('asia')
      expect(question.difficulty).toBe('easy')
    }
  })

  it('builds ten fill questions when independent format draws are high', () => {
    const questions = createKnowledgeChallenge('oceania', 'hard', () => 0.99)

    expect(
      questions.every((question) => question.format === 'character-fill'),
    ).toBe(true)
    for (const question of questions) {
      if (question.format !== 'character-fill') {
        throw new Error('Expected fill question')
      }
      expect(question.characterBank).toHaveLength(12)
      expect(new Set(question.characterBank.map((item) => item.id)).size).toBe(
        12,
      )
      expect(question.acceptedAnswers).toContain(question.answerText)
      const bankCharacters = question.characterBank.map(
        (item) => item.character,
      )
      for (const answerCharacter of [...question.answerText]) {
        const answerOccurrences = [...question.answerText].filter(
          (character) => character === answerCharacter,
        ).length
        const bankOccurrences = bankCharacters.filter(
          (character) => character === answerCharacter,
        ).length
        expect(bankOccurrences).toBe(answerOccurrences)
      }
    }
  })

  it('keeps subjects and choice distractors inside the selected pool', () => {
    const questions = createKnowledgeChallenge('oceania', 'hard', () => 0)
    const hardOceaniaCodes = new Set(['VU', 'PW', 'KI', 'TV', 'NR'])

    expect(
      questions.every(
        (question) =>
          hardOceaniaCodes.has(question.countryCode) &&
          question.format === 'choice' &&
          question.options.every((option) => hardOceaniaCodes.has(option.id)),
      ),
    ).toBe(true)
  })

  it('draws a world round from every country in the selected difficulty pool', () => {
    const questions = createKnowledgeChallenge('world', 'easy', () => 0)

    expect(questions.every((question) => question.scope === 'world')).toBe(true)
    expect(
      new Set(questions.map((question) => question.countryCode)).size,
    ).toBe(10)
  })

  it('uses one South Africa capital while accepting all three capitals', () => {
    const questions = createKnowledgeChallenge('africa', 'easy', () => 0.99)
    const southAfrica = questions.find(
      (question) => question.countryCode === 'ZA',
    )

    expect(southAfrica?.format).toBe('character-fill')
    if (southAfrica?.format !== 'character-fill') {
      throw new Error('Expected South Africa fill question')
    }
    expect(southAfrica.kind).toBe('country-to-capital')
    expect(southAfrica.prompt).toBe('南非的首都之一是哪里？')
    expect(southAfrica.answerText).toBe('开普敦')
    expect(southAfrica.acceptedAnswers).toEqual([
      '比勒陀利亚',
      '布隆方丹',
      '开普敦',
    ])
  })

  it('uses the 80 percent pass mark', () => {
    expect(getChallengeScore(8, 10)).toBe(80)
    expect(hasPassedKnowledgeChallenge(8, 10)).toBe(true)
    expect(hasPassedKnowledgeChallenge(7, 10)).toBe(false)
  })
})
