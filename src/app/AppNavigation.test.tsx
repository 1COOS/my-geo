import * as Tooltip from '@radix-ui/react-tooltip'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AppNavigation } from './AppNavigation'

type FullscreenHarness = {
  exitFullscreen: ReturnType<typeof vi.fn>
  requestFullscreen: ReturnType<typeof vi.fn>
  setFullscreenElement: (element: Element | null) => void
}

function createMatchMedia(fullscreenDisplayMode = false) {
  return vi.fn((query: string) => ({
    matches: query === '(display-mode: fullscreen)' && fullscreenDisplayMode,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function installFullscreenHarness({
  enabled = true,
  fullscreenDisplayMode = false,
  requestRejects = false,
}: {
  enabled?: boolean
  fullscreenDisplayMode?: boolean
  requestRejects?: boolean
} = {}): FullscreenHarness {
  let fullscreenElement: Element | null = null
  const dispatchChange = () =>
    document.dispatchEvent(new Event('fullscreenchange'))
  const requestFullscreen = vi.fn(() => {
    if (requestRejects) {
      return Promise.reject(new DOMException('Not allowed'))
    }
    fullscreenElement = document.documentElement
    dispatchChange()
    return Promise.resolve()
  })
  const exitFullscreen = vi.fn(() => {
    fullscreenElement = null
    dispatchChange()
    return Promise.resolve()
  })

  vi.stubGlobal('matchMedia', createMatchMedia(fullscreenDisplayMode))
  Object.defineProperty(document, 'fullscreenEnabled', {
    configurable: true,
    value: enabled,
  })
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  })
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: requestFullscreen,
  })
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: exitFullscreen,
  })

  return {
    exitFullscreen,
    requestFullscreen,
    setFullscreenElement: (element) => {
      fullscreenElement = element
      dispatchChange()
    },
  }
}

function renderNavigation() {
  return render(
    <Tooltip.Provider delayDuration={0}>
      <MemoryRouter initialEntries={['/explore']}>
        <AppNavigation />
      </MemoryRouter>
    </Tooltip.Provider>,
  )
}

afterEach(() => {
  Reflect.deleteProperty(document, 'fullscreenEnabled')
  Reflect.deleteProperty(document, 'fullscreenElement')
  Reflect.deleteProperty(document, 'exitFullscreen')
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen')
})

describe('AppNavigation fullscreen control', () => {
  it('hides the control when the Fullscreen API is unavailable', () => {
    installFullscreenHarness({ enabled: false })
    renderNavigation()

    expect(
      screen.queryByRole('button', { name: '进入全屏' }),
    ).not.toBeInTheDocument()
  })

  it('hides the manual control in manifest fullscreen display mode', () => {
    installFullscreenHarness({ fullscreenDisplayMode: true })
    renderNavigation()

    expect(
      screen.queryByRole('button', { name: '进入全屏' }),
    ).not.toBeInTheDocument()
  })

  it('enters and exits fullscreen while staying active across routes', async () => {
    const user = userEvent.setup()
    const fullscreen = installFullscreenHarness()
    renderNavigation()

    await user.click(screen.getByRole('button', { name: '进入全屏' }))
    expect(fullscreen.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '退出全屏' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('link', { name: '知识体系' }))
    expect(screen.getByRole('button', { name: '退出全屏' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '退出全屏' }))
    expect(fullscreen.exitFullscreen).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '进入全屏' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('synchronizes when the browser exits fullscreen externally', async () => {
    const user = userEvent.setup()
    const fullscreen = installFullscreenHarness()
    renderNavigation()

    await user.click(screen.getByRole('button', { name: '进入全屏' }))
    fullscreen.setFullscreenElement(null)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '进入全屏' }),
      ).toBeInTheDocument(),
    )
  })

  it('keeps the normal state when the browser rejects the request', async () => {
    const user = userEvent.setup()
    const fullscreen = installFullscreenHarness({ requestRejects: true })
    renderNavigation()

    await user.click(screen.getByRole('button', { name: '进入全屏' }))

    expect(fullscreen.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '进入全屏' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
