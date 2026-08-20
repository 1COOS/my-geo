export function advanceLabelLayoutFrame(
  accumulatedSeconds: number,
  deltaSeconds: number,
  quality: 'balanced' | 'low',
  layoutRequested: boolean,
) {
  const nextAccumulatedSeconds = accumulatedSeconds + deltaSeconds
  const intervalSeconds = quality === 'low' ? 1 / 30 : 1 / 60
  if (!layoutRequested || nextAccumulatedSeconds < intervalSeconds) {
    return { shouldLayout: false, accumulatedSeconds: nextAccumulatedSeconds }
  }
  return {
    shouldLayout: true,
    accumulatedSeconds: nextAccumulatedSeconds % intervalSeconds,
  }
}
