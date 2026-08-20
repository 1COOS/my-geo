const syncEveryFrameByQuality = {
  balanced: true,
  low: true,
} as const

export function shouldLayoutGlobeLabelsThisFrame(
  quality: 'balanced' | 'low',
  cameraChangedThisFrame: boolean,
) {
  return cameraChangedThisFrame && syncEveryFrameByQuality[quality]
}
