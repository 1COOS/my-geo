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
  it('places the question hub below knowledge and keeps its descendants active', () => {
    installFullscreenHarness({ enabled: false })
    renderNavigation('/questions/asia/easy')

    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['探索', '问答'])
    expect(screen.getByRole('button', { name: '知识体系' })).not.toHaveClass(
      'is-active',
    )
    expect(screen.getByRole('link', { name: '知识问答' })).toHaveClass(
      'is-active',
    )
  })
})

describe('AppNavigation knowledge submenu', () => {
  it('opens on click and closes with Escape while restoring focus', async () => {
    const user = userEvent.setup()
    installFullscreenHarness({ enabled: false })
    renderNavigation('/knowledge/countries/east-asia')

    const trigger = screen.getByRole('button', { name: '知识体系' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('知识二级菜单')).not.toBeInTheDocument()

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen
        .getAllByRole('link', { name: /地球经纬|国家首都|世界之最|江河湖海/ })
        .map((link) => link.textContent),
    ).toEqual(['地球经纬', '国家首都', '世界之最', '江河湖海'])

    await user.tab()
    expect(screen.getByRole('link', { name: '地球经纬' })).toHaveFocus()
    await user.keyboard('{Escape}')

    expect(screen.queryByLabelText('知识二级菜单')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes on outside interaction and when a topic is selected', async () => {
    const user = userEvent.setup()
    installFullscreenHarness({ enabled: false })
    renderNavigation()

    const trigger = screen.getByRole('button', { name: '知识体系' })
    await user.click(trigger)
    await user.click(document.body)
    expect(screen.queryByLabelText('知识二级菜单')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.click(screen.getByRole('link', { name: '江河湖海' }))
    expect(screen.queryByLabelText('知识二级菜单')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveClass('is-active')
  })

  it.each([
    ['/knowledge/earth/lines/equator', '地球经纬'],
    ['/knowledge/countries/east-asia', '国家首都'],
    ['/knowledge/extremes/metrics/highest-point', '世界之最'],
    ['/knowledge/water/groups/ocean-seas', '江河湖海'],
  ])('marks %s as the active %s route family', async (path, title) => {
    const user = userEvent.setup()
    installFullscreenHarness({ enabled: false })
    renderNavigation(path)

    const trigger = screen.getByRole('button', { name: '知识体系' })
    expect(trigger).toHaveClass('is-active')
    await user.click(trigger)
    expect(screen.getByRole('link', { name: title })).toHaveAttribute(
      'aria-current',
      'page',
    )
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

    await user.click(screen.getByRole('button', { name: '知识体系' }))
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
