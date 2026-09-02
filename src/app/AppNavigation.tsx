import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { BookIcon, GlobeIcon } from '../shared/components/AppNavigationIcons'

import {
  isDocumentFullscreen,
  isManualFullscreenAvailable,
  toggleDocumentFullscreen,
} from './fullscreenPlatform'

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

function KnowledgeNavigationLink() {
  const location = useLocation()
  const knowledgeActive =
    location.pathname === '/knowledge' ||
    location.pathname.startsWith('/knowledge/') ||
    location.pathname === '/questions' ||
    location.pathname.startsWith('/questions/')

  return (
    <NavLink
      to="/knowledge"
      className={
        knowledgeActive
          ? 'app-navigation-link is-active'
          : 'app-navigation-link'
      }
      aria-label="知识中心"
      aria-current={knowledgeActive ? 'page' : undefined}
    >
      <BookIcon />
      <span>知识</span>
    </NavLink>
  )
}

export function AppNavigation() {
  return (
    <nav
      className="app-navigation"
      data-scene-overlay="navigation"
      aria-label="My Geo 主导航"
    >
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
      <KnowledgeNavigationLink />
      <FullscreenControl />
    </nav>
  )
}
