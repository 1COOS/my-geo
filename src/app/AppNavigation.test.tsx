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

function renderNavigation(initialEntry = '/explore') {
  return render(
    <Tooltip.Provider delayDuration={0}>
      <MemoryRouter initialEntries={[initialEntry]}>
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

describe('AppNavigation brand', () => {
  it('uses the existing My Geo logo instead of the temporary letter', () => {
    installFullscreenHarness({ enabled: false })
    const { container } = renderNavigation()
    const brand = container.querySelector('.app-navigation-brand')
    const logo = brand?.querySelector('img')

    expect(logo).toHaveAttribute('src', '/icons/my-geo-mark.svg')
    expect(logo).toHaveAttribute('alt', '')
    expect(brand).not.toHaveTextContent('M')
  })
})

describe('AppNavigation routes', () => {
  it.each([
    '/knowledge',
    '/knowledge/earth/lines/equator',
    '/knowledge/countries/east-asia',
    '/knowledge/extremes/metrics/highest-point',
    '/knowledge/water/groups/ocean-seas',
    '/questions',
    '/questions/asia/easy',
  ])('uses the unified knowledge link for %s', (path) => {
    installFullscreenHarness({ enabled: false })
    renderNavigation(path)

    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['探索', '知识'])
    expect(screen.getByRole('link', { name: '知识中心' })).toHaveClass(
      'is-active',
    )
    expect(screen.queryByLabelText('知识二级菜单')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '知识问答' })).toBeNull()
  })
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

    await user.click(screen.getByRole('link', { name: '知识中心' }))
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
