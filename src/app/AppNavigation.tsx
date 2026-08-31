import * as Tooltip from '@radix-ui/react-tooltip'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { BookIcon, GlobeIcon } from '../shared/components/AppNavigationIcons'
import {
  getActiveKnowledgeTopic,
  knowledgeTopics,
  type KnowledgeTopicId,
} from '../features/knowledge/knowledgeTopics'

import {
  isDocumentFullscreen,
  isManualFullscreenAvailable,
  toggleDocumentFullscreen,
} from './fullscreenPlatform'

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5h14v10H9l-4 3z" />
      <path d="M9.4 9a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2-2.6 3.4M12 15.8h.01" />
    </svg>
  )
}

function KnowledgeTopicIcon({ topicId }: { topicId: KnowledgeTopicId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {topicId === 'earth' ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" />
        </>
      ) : topicId === 'countries' ? (
        <>
          <path d="M6 21V4" />
          <path d="M7 5h10l-2 3 2 3H7" />
        </>
      ) : topicId === 'extremes' ? (
        <>
          <path d="M8 4h8v4a4 4 0 0 1-8 0zM10 14h4M9 20h6M12 12v8" />
          <path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4" />
        </>
      ) : (
        <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      )}
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

function KnowledgeMenu() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activeTopic = getActiveKnowledgeTopic(location.pathname)
  const knowledgeActive =
    location.pathname === '/knowledge' ||
    location.pathname.startsWith('/knowledge/')

  const closeMenu = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeMenu()
    }

    document.addEventListener('click', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMenu, open])

  return (
    <div ref={containerRef} className="app-navigation-knowledge">
      <button
        ref={triggerRef}
        type="button"
        className={
          knowledgeActive
            ? 'app-navigation-link app-navigation-knowledge-trigger is-active'
            : 'app-navigation-link app-navigation-knowledge-trigger'
        }
        aria-label="知识体系"
        aria-expanded={open}
        aria-controls="knowledge-subnavigation"
        onClick={() => setOpen((current) => !current)}
      >
        <BookIcon />
        <span>知识</span>
      </button>

      {open ? (
        <nav
          id="knowledge-subnavigation"
          className="knowledge-subnavigation"
          aria-label="知识二级菜单"
        >
          {knowledgeTopics.map((topic) => (
            <Link
              key={topic.id}
              className={
                topic.id === activeTopic?.id
                  ? 'knowledge-subnavigation-link is-active'
                  : 'knowledge-subnavigation-link'
              }
              aria-current={topic.id === activeTopic?.id ? 'page' : undefined}
              to={topic.to}
              onClick={closeMenu}
            >
              <KnowledgeTopicIcon topicId={topic.id} />
              <span>{topic.title}</span>
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
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
      <KnowledgeMenu />
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
