import { describe, expect, it } from 'vitest'

import {
  evaluateBudget,
  evaluateBudgets,
  formatBudgetEvaluation,
} from './build-budget'

const threshold = { soft: 112 * 1024, hard: 128 * 1024 }

describe('evaluateBudget', () => {
  it('passes below the soft target', () => {
    expect(
      evaluateBudget({ label: 'CSS raw', actual: 100 * 1024, threshold }),
    ).toMatchObject({ status: 'ok' })
  })

  it('warns between the soft target and hard limit', () => {
    expect(
      evaluateBudget({ label: 'CSS raw', actual: 120 * 1024, threshold }),
    ).toMatchObject({ status: 'warning' })
  })

  it('fails above the hard limit', () => {
    expect(
      evaluateBudget({ label: 'CSS raw', actual: 129 * 1024, threshold }),
    ).toMatchObject({ status: 'failure' })
  })

  it('reports actual, soft, hard, and remaining hard headroom', () => {
    expect(
      formatBudgetEvaluation(
        evaluateBudget({
          label: 'CSS raw',
          actual: 100 * 1024,
          threshold,
        }),
      ),
    ).toBe(
      'CSS raw 100.0 KiB (soft 112.0 KiB, hard 128.0 KiB, hard headroom 28.0 KiB)',
    )
  })
})

describe('evaluateBudgets', () => {
  it('collects multiple warnings and failures independently', () => {
    const result = evaluateBudgets([
      { label: 'CSS raw', actual: 120 * 1024, threshold },
      {
        label: 'CSS gzip',
        actual: 25 * 1024,
        threshold: { soft: 20 * 1024, hard: 24 * 1024 },
      },
      { label: 'Other', actual: 1, threshold: { soft: 2, hard: 3 } },
    ])

    expect(result.warnings.map((item) => item.label)).toEqual(['CSS raw'])
    expect(result.failures.map((item) => item.label)).toEqual(['CSS gzip'])
  })
})
