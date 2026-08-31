import { createContext, useContext } from 'react'

import type { ViewportProfile } from '../shared/hooks/useViewportProfile'

export type SceneInsets = {
  top: number
  right: number
  bottom: number
  left: number
}

export type SceneLayoutMetrics = {
  viewport: { width: number; height: number }
  navigation: DOMRectReadOnly | null
  overlayInsets: SceneInsets
  safeRect: { x: number; y: number; width: number; height: number }
  profile: ViewportProfile
}

export const emptySceneLayoutMetrics: SceneLayoutMetrics = {
  viewport: { width: 0, height: 0 },
  navigation: null,
  overlayInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  safeRect: { x: 0, y: 0, width: 0, height: 0 },
  profile: 'balanced',
}

export const SceneLayoutMetricsContext = createContext(emptySceneLayoutMetrics)

export function useSceneLayoutMetrics() {
  return useContext(SceneLayoutMetricsContext)
}
