import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import {
  NavLink,
  NavigationType,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom'

import {
  BackIcon,
  BookIcon,
  GlobeIcon,
  SearchIcon,
} from '../shared/components/AppNavigationIcons'

import {
  isDocumentFullscreen,
  isManualFullscreenAvailable,
  toggleDocumentFullscreen,
} from './fullscreenPlatform'
import {
  getNavigationBackFallback,
  primaryNavigationPaths,
} from './navigationRoutes'

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

function AtlasNavigationLink() {
  const location = useLocation()
  const atlasActive =
    location.pathname === '/knowledge' ||
    location.pathname.startsWith('/knowledge/') ||
    location.pathname === '/questions' ||
    location.pathname.startsWith('/questions/')

  return (
    <NavLink
      to="/knowledge"
      className={
        atlasActive ? 'app-navigation-link is-active' : 'app-navigation-link'
      }
      aria-label="图鉴"
      aria-current={atlasActive ? 'page' : undefined}
    >
      <BookIcon />
      <span>图鉴</span>
    </NavLink>
  )
}

function NavigationBrand() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()

  if (primaryNavigationPaths.has(location.pathname)) {
    return (
      <div className="app-navigation-brand" aria-hidden="true">
        <img src="/icons/my-geo-mark.svg" alt="" draggable={false} />
      </div>
    )
  }

  return (
    <button
      type="button"
      className="app-navigation-brand app-navigation-back"
      aria-label="返回上页"
      onClick={() => {
        if (navigationType === NavigationType.Push) void navigate(-1)
        else
          void navigate(getNavigationBackFallback(location.pathname), {
            replace: true,
          })
      }}
    >
      <BackIcon />
    </button>
  )
}

export function AppNavigation() {
  return (
    <nav
      className="app-navigation"
      data-scene-overlay="navigation"
      aria-label="My Geo 主导航"
    >
      <NavigationBrand />
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
      <AtlasNavigationLink />
      <NavLink
        to="/search"
        className={({ isActive }) =>
          isActive ? 'app-navigation-link is-active' : 'app-navigation-link'
        }
        aria-label="搜索"
      >
        <SearchIcon />
        <span>搜索</span>
      </NavLink>
      <FullscreenControl />
    </nav>
  )
}
