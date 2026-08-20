import { type PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { readLandscapeState, tryLockLandscape } from './landscapePlatform'
import { shouldPreventTouchContextMenu } from './touchContextMenu'

type OrientationMediaQuery = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

function listenToMediaQuery(
  query: OrientationMediaQuery,
  listener: (event: MediaQueryListEvent) => void,
) {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }

  query.addListener?.(listener)
  return () => query.removeListener?.(listener)
}

function LandscapePrompt() {
  const { t } = useTranslation()
  const promptRef = useRef<HTMLElement>(null)

  useEffect(() => {
    promptRef.current?.focus()
  }, [])

  return (
    <section
      ref={promptRef}
      className="landscape-prompt"
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-prompt-title"
      aria-describedby="landscape-prompt-description landscape-prompt-hint"
      tabIndex={-1}
      data-testid="landscape-prompt"
    >
      <div className="landscape-prompt-card">
        <div className="landscape-prompt-visual" aria-hidden="true">
          <svg className="landscape-prompt-device" viewBox="0 0 92 92">
            <rect x="28" y="13" width="36" height="66" rx="8" />
            <path d="M42 20h8" />
            <circle cx="46" cy="71" r="2" />
          </svg>
          <svg className="landscape-prompt-arrow" viewBox="0 0 64 64">
            <path d="M15 38a20 20 0 0 1 30-20" />
            <path d="m42 10 5 9-10 2" />
          </svg>
        </div>
        <p className="landscape-prompt-eyebrow">横屏浏览</p>
        <h1 id="landscape-prompt-title">{t('landscapeTitle')}</h1>
        <p id="landscape-prompt-description">{t('landscapeDescription')}</p>
        <p id="landscape-prompt-hint" className="landscape-prompt-hint">
          {t('landscapeHint')}
        </p>
      </div>
    </section>
  )
}

export function LandscapeGuard({ children }: PropsWithChildren) {
  const [landscapeState, setLandscapeState] = useState(() =>
    readLandscapeState(),
  )
  const shouldBlock = landscapeState.isTouchDevice && landscapeState.isPortrait
  const [hasEnteredLandscape, setHasEnteredLandscape] = useState(
    () => !shouldBlock,
  )
  const lockAttemptedRef = useRef(false)

  useEffect(() => {
    const portraitQuery = window.matchMedia('(orientation: portrait)')
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')
    const updateState = () => {
      const nextState = readLandscapeState()
      if (!nextState.isTouchDevice || !nextState.isPortrait) {
        setHasEnteredLandscape(true)
      }
      setLandscapeState((currentState) =>
        currentState.isPortrait === nextState.isPortrait &&
        currentState.isTouchDevice === nextState.isTouchDevice
          ? currentState
          : nextState,
      )
    }

    const removePortraitListener = listenToMediaQuery(
      portraitQuery,
      updateState,
    )
    const removePointerListener = listenToMediaQuery(
      coarsePointerQuery,
      updateState,
    )
    window.addEventListener('resize', updateState)

    return () => {
      removePortraitListener()
      removePointerListener()
      window.removeEventListener('resize', updateState)
    }
  }, [])

  useEffect(() => {
    if (lockAttemptedRef.current) return
    lockAttemptedRef.current = true
    void tryLockLandscape()
  }, [])

  return (
    <div
      className={[
        'landscape-runtime',
        landscapeState.isTouchDevice && 'is-touch-device',
        shouldBlock && 'is-orientation-blocked',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="landscape-runtime"
      onContextMenuCapture={(event) => {
        if (
          shouldPreventTouchContextMenu(
            event.target,
            landscapeState.isTouchDevice,
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      {hasEnteredLandscape ? (
        <div
          className="landscape-app"
          inert={shouldBlock}
          aria-hidden={shouldBlock || undefined}
        >
          {children}
        </div>
      ) : null}
      {shouldBlock ? <LandscapePrompt /> : null}
    </div>
  )
}
