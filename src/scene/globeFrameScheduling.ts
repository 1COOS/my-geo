const collisionLayoutIntervalByQuality = {
  balanced: 1 / 15,
  low: 1 / 10,
} as const

export function advanceGlobeLabelFrame(
  accumulatedSeconds: number,
  deltaSeconds: number,
  quality: 'balanced' | 'low',
  cameraChangedThisFrame: boolean,
) {
  if (!cameraChangedThisFrame) {
    return {
      shouldTrackPositions: false,
      shouldReconcileLayout: false,
      accumulatedSeconds: 0,
    }
  }

  const intervalSeconds = collisionLayoutIntervalByQuality[quality]
  const nextAccumulatedSeconds = accumulatedSeconds + deltaSeconds
  const elapsedIntervals = Math.floor(
    (nextAccumulatedSeconds + Number.EPSILON) / intervalSeconds,
  )
  return {
    shouldTrackPositions: true,
    shouldReconcileLayout: elapsedIntervals > 0,
    accumulatedSeconds:
      elapsedIntervals > 0
        ? Math.max(
            0,
            nextAccumulatedSeconds - elapsedIntervals * intervalSeconds,
          )
        : nextAccumulatedSeconds,
  }
}
