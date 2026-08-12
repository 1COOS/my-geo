type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
}

type StandaloneNavigator = Navigator & {
  standalone?: boolean
}

export interface LandscapeState {
  isPortrait: boolean
  isTouchDevice: boolean
}

function isMobileOrTabletNavigator(navigatorRef: Navigator) {
  return (
    /Android|iPhone|iPad|iPod/i.test(navigatorRef.userAgent) ||
    (navigatorRef.platform === 'MacIntel' && navigatorRef.maxTouchPoints > 1)
  )
}

export function readLandscapeState(windowRef: Window = window): LandscapeState {
  const portraitQuery = windowRef.matchMedia('(orientation: portrait)')
  const coarsePointerQuery = windowRef.matchMedia('(pointer: coarse)')

  return {
    isPortrait: portraitQuery.matches,
    isTouchDevice:
      coarsePointerQuery.matches ||
      isMobileOrTabletNavigator(windowRef.navigator),
  }
}

export function isStandalonePwa(windowRef: Window = window) {
  return (
    windowRef.matchMedia('(display-mode: standalone)').matches ||
    (windowRef.navigator as StandaloneNavigator).standalone === true
  )
}

export async function tryLockLandscape(windowRef: Window = window) {
  const { isTouchDevice } = readLandscapeState(windowRef)
  if (!isTouchDevice || !isStandalonePwa(windowRef)) return false

  const orientation = windowRef.screen.orientation as
    LockableScreenOrientation | undefined
  if (typeof orientation?.lock !== 'function') return false

  try {
    await orientation.lock('landscape')
    return true
  } catch {
    return false
  }
}
