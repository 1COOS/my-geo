import { describe, expect, it } from 'vitest'

import {
  knowledgeRegionProgressSchema,
  mergeKnowledgeChallengeResult,
} from './database'

describe('knowledge progress', () => {
  it('keeps the best score while recording the latest attempt', () => {
    const first = mergeKnowledgeChallengeResult(
      undefined,
      'east-asia',
      90,
      1000,
    )
    const second = mergeKnowledgeChallengeResult(first, 'east-asia', 60, 2000)

    expect(first.passedAt).toBe(1000)
    expect(second).toEqual({
      regionId: 'east-asia',
      bestScore: 90,
      lastScore: 60,
      attemptCount: 2,
      passedAt: 1000,
      updatedAt: 2000,
    })
  })

  it('uses safe defaults and rejects malformed persisted records', () => {
    const progress = mergeKnowledgeChallengeResult(
      undefined,
      'west-africa',
      79.6,
      3000,
    )

    expect(progress.bestScore).toBe(80)
    expect(progress.passedAt).toBe(3000)
    expect(knowledgeRegionProgressSchema.safeParse(progress).success).toBe(true)
    expect(
      knowledgeRegionProgressSchema.safeParse({
        ...progress,
        attemptCount: -1,
      }).success,
    ).toBe(false)
  })
})
