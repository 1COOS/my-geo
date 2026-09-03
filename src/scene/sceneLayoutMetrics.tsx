import { useEffect, useState, type ReactNode, type RefObject } from 'react'

import { resolveViewportProfile } from '../shared/hooks/useViewportProfile'
import {
  measuredSceneOverlayRoles,
  sceneOverlayRoles,
  type SceneOverlayRole,
} from '../shared/types/sceneOverlay'
import {
  emptySceneLayoutMetrics,
  SceneLayoutMetricsContext,
  type SceneLayoutMetrics,
} from './sceneLayoutMetricsState'

function isVisible(element: Element, rect: DOMRect) {
  const style = getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    rect.width > 0 &&
    rect.height > 0
  )
}

function clampInset(value: number, available: number) {
  return Math.max(0, Math.min(value, available * 0.42))
}

function sameMetrics(a: SceneLayoutMetrics, b: SceneLayoutMetrics) {
  return (
    a.viewport.width === b.viewport.width &&
    a.viewport.height === b.viewport.height &&
    a.profile === b.profile &&
    a.overlayInsets.top === b.overlayInsets.top &&
    a.overlayInsets.right === b.overlayInsets.right &&
    a.overlayInsets.bottom === b.overlayInsets.bottom &&
    a.overlayInsets.left === b.overlayInsets.left
  )
}

function measureSceneLayout(viewport: HTMLElement): SceneLayoutMetrics {
  const root = viewport.getBoundingClientRect()
  const gap = Math.max(8, Math.min(14, root.width * 0.01))
  const find = (role: SceneOverlayRole) =>
    document.querySelector<HTMLElement>(`[data-scene-overlay="${role}"]`)
  const navigationElement = find(sceneOverlayRoles.navigation)
  const navigationRect = navigationElement?.getBoundingClientRect() ?? null
  const layerRect =
    find(sceneOverlayRoles.layers)?.getBoundingClientRect() ?? null
  const mapElement = find(sceneOverlayRoles.miniMap)
  const mapRect = mapElement?.getBoundingClientRect() ?? null
  const controlsElement = find(sceneOverlayRoles.controls)
  const controlsRect = controlsElement?.getBoundingClientRect() ?? null

  let left = 0
  let top = 0
  let bottom = 0

  if (
    navigationElement &&
    navigationRect &&
    isVisible(navigationElement, navigationRect) &&
    navigationRect.right > root.left &&
    navigationRect.left < root.right
  ) {
    left = navigationRect.right - root.left + gap
  }
  const layerElement = find(sceneOverlayRoles.layers)
  if (
    layerElement &&
    layerRect &&
    isVisible(layerElement, layerRect) &&
    layerRect.bottom > root.top &&
    layerRect.top < root.bottom
  ) {
    top = layerRect.bottom - root.top + gap
  }
  for (const [element, rect] of [
    [mapElement, mapRect],
    [controlsElement, controlsRect],
  ] as const) {
    if (
      element &&
      rect &&
      isVisible(element, rect) &&
      rect.bottom > root.top &&
      rect.top < root.bottom
    ) {
      bottom = Math.max(bottom, root.bottom - rect.top + gap)
    }
  }

  const overlayInsets = {
    top: Math.round(clampInset(top, root.height)),
    right: 0,
    bottom: Math.round(clampInset(bottom, root.height)),
    left: Math.round(clampInset(left, root.width)),
  }
  const width = Math.max(1, Math.round(root.width))
  const height = Math.max(1, Math.round(root.height))
  return {
    viewport: { width, height },
    navigation: navigationRect,
    overlayInsets,
    safeRect: {
      x: overlayInsets.left,
      y: overlayInsets.top,
      width: Math.max(1, width - overlayInsets.left - overlayInsets.right),
      height: Math.max(1, height - overlayInsets.top - overlayInsets.bottom),
    },
    profile: resolveViewportProfile({ width, height }),
  }
}

export function SceneLayoutMetricsProvider({
  viewportRef,
  children,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const [metrics, setMetrics] = useState(emptySceneLayoutMetrics)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    let frame: number | null = null
    const observed = new Set<Element>()
    const resizeObserver = new ResizeObserver(() => schedule())

    const update = () => {
      frame = null
      const elements: HTMLElement[] = [viewport]
      for (const role of measuredSceneOverlayRoles) {
        const element = document.querySelector<HTMLElement>(
          `[data-scene-overlay="${role}"]`,
        )
        if (element) elements.push(element)
      }
      for (const element of elements) {
        if (observed.has(element)) continue
        observed.add(element)
        resizeObserver.observe(element)
      }
      const next = measureSceneLayout(viewport)
      setMetrics((current) => (sameMetrics(current, next) ? current : next))
    }
    const schedule = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(update)
    }
    const mutationObserver = new MutationObserver(schedule)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden'],
    })
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    update()

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
    }
  }, [viewportRef])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const values = {
      '--scene-safe-top': `${metrics.overlayInsets.top}px`,
      '--scene-safe-right': `${metrics.overlayInsets.right}px`,
      '--scene-safe-bottom': `${metrics.overlayInsets.bottom}px`,
      '--scene-safe-left': `${metrics.overlayInsets.left}px`,
    }
    for (const [property, value] of Object.entries(values)) {
      viewport.style.setProperty(property, value)
    }
  }, [metrics.overlayInsets, viewportRef])

  return (
    <SceneLayoutMetricsContext.Provider value={metrics}>
      {children}
    </SceneLayoutMetricsContext.Provider>
  )
}
