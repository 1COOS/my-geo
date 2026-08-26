import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

import {
  isDocumentFullscreen,
  isManualFullscreenAvailable,
  toggleDocumentFullscreen,
} from './fullscreenPlatform'

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.2c2.9-.7 5.5-.2 8 1.5v12c-2.5-1.7-5.1-2.2-8-1.5zM20 5.2c-2.9-.7-5.5-.2-8 1.5v12c2.5-1.7 5.1-2.2 8-1.5z" />
    </svg>
  )
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5h14v10H9l-4 3z" />
      <path d="M9.4 9a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2-2.6 3.4M12 15.8h.01" />
    </svg>
  )
}

function FullscreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 4v5.2H4M14.8 4v5.2H20M9.2 20v-5.2H4M14.8 20v-5.2H20" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 4H4v5.2M14.8 4H20v5.2M9.2 20H4v-5.2M14.8 20H20v-5.2" />
    </svg>
  )
}

function FullscreenControl() {
  const [available] = useState(() => isManualFullscreenAvailable())
  const [active, setActive] = useState(() => isDocumentFullscreen())

  useEffect(() => {
    if (!available) return

    const syncFullscreenState = () => setActive(isDocumentFullscreen())
    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () =>
      document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [available])

  if (!available) return null

  const label = active ? '退出全屏' : '进入全屏'

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className={
            active
              ? 'app-navigation-link app-navigation-action is-pressed'
              : 'app-navigation-link app-navigation-action'
          }
          aria-label={label}
          aria-pressed={active}
          onClick={() => {
            void toggleDocumentFullscreen().then(() =>
              setActive(isDocumentFullscreen()),
            )
          }}
        >
          <FullscreenIcon active={active} />
          <span>{active ? '退出' : '全屏'}</span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="app-navigation-tooltip"
          side="right"
          sideOffset={8}
        >
          {label}
          <Tooltip.Arrow className="app-navigation-tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function AppNavigation() {
  return (
    <nav className="app-navigation" aria-label="My Geo 主导航">
      <div className="app-navigation-brand" aria-hidden="true">
        <img src="/icons/my-geo-mark.svg" alt="" draggable={false} />
      </div>
      <NavLink
        to="/explore"
        className={({ isActive }) =>
          isActive ? 'app-navigation-link is-active' : 'app-navigation-link'
        }
        aria-label="探索地球"
      >
        <GlobeIcon />
        <span>探索</span>
      </NavLink>
      <NavLink
        to="/knowledge"
        className={({ isActive }) =>
          isActive ? 'app-navigation-link is-active' : 'app-navigation-link'
        }
        aria-label="知识体系"
      >
        <BookIcon />
        <span>知识</span>
      </NavLink>
      <NavLink
        to="/questions"
        className={({ isActive }) =>
          isActive ? 'app-navigation-link is-active' : 'app-navigation-link'
        }
        aria-label="知识问答"
      >
        <QuestionIcon />
        <span>问答</span>
      </NavLink>
      <FullscreenControl />
    </nav>
  )
}
