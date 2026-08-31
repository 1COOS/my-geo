import { useEffect, useState } from 'react'

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

function readViewportSize(): ViewportSize {
  const viewport = window.visualViewport
  return {
    width: Math.round(viewport?.width ?? window.innerWidth),
    height: Math.round(viewport?.height ?? window.innerHeight),
  }
}

export function useViewportProfile(): ViewportProfile {
  const [profile, setProfile] = useState(() =>
    resolveViewportProfile(readViewportSize()),
  )

  useEffect(() => {
    const update = () =>
      setProfile((current) => {
        const next = resolveViewportProfile(readViewportSize())
        return next === current ? current : next
      })

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return profile
}
