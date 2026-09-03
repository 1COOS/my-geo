import { useEffect, useState, type PropsWithChildren } from 'react'

import {
  readViewportSize,
  resolveViewportProfile,
  ViewportProfileContext,
} from '../hooks/useViewportProfile'

export function ViewportProfileProvider({ children }: PropsWithChildren) {
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

  return (
    <ViewportProfileContext.Provider value={profile}>
      {children}
    </ViewportProfileContext.Provider>
  )
}
