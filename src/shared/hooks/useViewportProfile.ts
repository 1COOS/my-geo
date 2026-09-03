import { createContext, useContext } from 'react'

export type ViewportProfile = 'wide' | 'balanced' | 'compact-landscape'

export type ViewportSize = {
  width: number
  height: number
}

export function resolveViewportProfile({
  width,
  height,
}: ViewportSize): ViewportProfile {
  if (width > height && height <= 600) return 'compact-landscape'
  if (width >= 1280 && height >= 720) return 'wide'
  return 'balanced'
}

export function readViewportSize(): ViewportSize {
  const viewport = window.visualViewport
  return {
    width: Math.round(viewport?.width ?? window.innerWidth),
    height: Math.round(viewport?.height ?? window.innerHeight),
  }
}

export function useViewportProfile(): ViewportProfile {
  return useContext(ViewportProfileContext)
}

export const ViewportProfileContext = createContext<ViewportProfile>('balanced')
