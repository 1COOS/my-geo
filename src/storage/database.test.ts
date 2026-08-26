import { describe, expect, it } from 'vitest'

import {
  loadExperiencePreferences,
  loadQuestionProgress,
  mergeQuestionChallengeResult,
  questionChallengeProgressSchema,
  saveExperiencePreferences,
  saveQuestionChallengeResult,
} from './database'

describe('knowledge progress', () => {
  it('keeps the best score while recording the latest attempt', () => {
    const first = mergeQuestionChallengeResult(undefined, 'asia:easy', 90, 1000)
    const second = mergeQuestionChallengeResult(first, 'asia:easy', 60, 2000)

    expect(first.passedAt).toBe(1000)
    expect(second).toEqual({
      challengeId: 'asia:easy',
      bestScore: 90,
      lastScore: 60,
      attemptCount: 2,
      passedAt: 1000,
      updatedAt: 2000,
    })
  })

  it('uses safe defaults and rejects malformed persisted records', () => {
    const progress = mergeQuestionChallengeResult(
      undefined,
      'africa:normal',
      79.6,
      3000,
    )

    expect(progress.bestScore).toBe(80)
    expect(progress.passedAt).toBe(3000)
    expect(questionChallengeProgressSchema.safeParse(progress).success).toBe(
      true,
    )
    expect(
      questionChallengeProgressSchema.safeParse({
        ...progress,
        attemptCount: -1,
      }).success,
    ).toBe(false)
  })

  it('falls back to memory-only outcomes when IndexedDB is unavailable', async () => {
    expect((await loadExperiencePreferences()).status).toBe('memory-only')
    expect((await loadQuestionProgress()).status).toBe('memory-only')
    expect(
      (
        await saveExperiencePreferences({
          autoRotate: false,
          quality: 'low',
        })
      ).status,
    ).toBe('memory-only')
    expect((await saveQuestionChallengeResult('asia:easy', 90)).status).toBe(
      'memory-only',
    )
  })
})
