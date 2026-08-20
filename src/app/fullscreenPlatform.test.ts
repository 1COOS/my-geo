import { describe, expect, it, vi } from 'vitest'

import {
  isDocumentFullscreen,
  isFullscreenDisplayMode,
  isManualFullscreenAvailable,
  toggleDocumentFullscreen,
} from './fullscreenPlatform'

function createWindowRef(fullscreenDisplayMode: boolean) {
  return {
    matchMedia: (query: string) => ({
      matches: query === '(display-mode: fullscreen)' && fullscreenDisplayMode,
    }),
  } as unknown as Window
}

function createDocumentRef({
  active = false,
  enabled = true,
  rejects = false,
}: {
  active?: boolean
  enabled?: boolean
  rejects?: boolean
} = {}) {
  const requestFullscreen = rejects
    ? vi.fn().mockRejectedValue(new DOMException('Not allowed'))
    : vi.fn().mockResolvedValue(undefined)
  const exitFullscreen = rejects
    ? vi.fn().mockRejectedValue(new DOMException('Not allowed'))
    : vi.fn().mockResolvedValue(undefined)
  const documentRef = {
    fullscreenEnabled: enabled,
    fullscreenElement: active ? {} : null,
    documentElement: { requestFullscreen },
    exitFullscreen,
  } as unknown as Document

  return { documentRef, exitFullscreen, requestFullscreen }
}

describe('fullscreen platform helpers', () => {
  it('detects manifest fullscreen mode and manual API availability', () => {
    const { documentRef } = createDocumentRef()

    expect(isFullscreenDisplayMode(createWindowRef(true))).toBe(true)
    expect(
      isManualFullscreenAvailable(documentRef, createWindowRef(true)),
    ).toBe(false)
    expect(
      isManualFullscreenAvailable(documentRef, createWindowRef(false)),
    ).toBe(true)
  })

  it('enters fullscreen when inactive', async () => {
    const { documentRef, requestFullscreen } = createDocumentRef()

    expect(isDocumentFullscreen(documentRef)).toBe(false)
    await expect(toggleDocumentFullscreen(documentRef)).resolves.toBe(true)
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('exits fullscreen when active', async () => {
    const { documentRef, exitFullscreen } = createDocumentRef({ active: true })

    expect(isDocumentFullscreen(documentRef)).toBe(true)
    await expect(toggleDocumentFullscreen(documentRef)).resolves.toBe(true)
    expect(exitFullscreen).toHaveBeenCalledTimes(1)
  })

  it('returns false when a fullscreen request is rejected', async () => {
    const { documentRef } = createDocumentRef({ rejects: true })

    await expect(toggleDocumentFullscreen(documentRef)).resolves.toBe(false)
  })
})
