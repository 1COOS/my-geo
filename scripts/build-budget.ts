export type BudgetThreshold = {
  soft: number
  hard: number
}

export type BudgetMeasurement = {
  label: string
  actual: number
  threshold: BudgetThreshold
}

export type BudgetEvaluation = BudgetMeasurement & {
  status: 'ok' | 'warning' | 'failure'
}

export function formatKiB(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

export function evaluateBudget(
  measurement: BudgetMeasurement,
): BudgetEvaluation {
  const { actual, threshold } = measurement
  return {
    ...measurement,
    status:
      actual > threshold.hard
        ? 'failure'
        : actual > threshold.soft
          ? 'warning'
          : 'ok',
  }
}

export function evaluateBudgets(measurements: BudgetMeasurement[]) {
  const evaluations = measurements.map(evaluateBudget)
  return {
    evaluations,
    warnings: evaluations.filter((item) => item.status === 'warning'),
    failures: evaluations.filter((item) => item.status === 'failure'),
  }
}

export function formatBudgetEvaluation(evaluation: BudgetEvaluation) {
  const { label, actual, threshold } = evaluation
  return `${label} ${formatKiB(actual)} (soft ${formatKiB(threshold.soft)}, hard ${formatKiB(threshold.hard)}, hard headroom ${formatKiB(threshold.hard - actual)})`
}
