import * as Tooltip from '@radix-ui/react-tooltip'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../app/i18n'
import { ExplorePage } from './ExplorePage'

const globePropsMock = vi.fn()

vi.mock('../../scene/GlobeScene', () => ({
  GlobeScene: (props: unknown) => {
    globePropsMock(props)
    return <div data-testid="mock-globe-scene">3D globe</div>
  },
}))

const supportsWebGLMock = vi.fn<() => boolean>()

vi.mock('../../shared/lib/webgl', () => ({
  supportsWebGL: () => supportsWebGLMock(),
}))

describe('ExplorePage', () => {
  beforeEach(() => {
    supportsWebGLMock.mockReturnValue(true)
    globePropsMock.mockClear()
  })

  it('shows the globe and control deck without page chrome or an open search field', async () => {
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    expect(
      screen.queryByRole('heading', {
        name: '转动地球，发现每一片土地',
      }),
    ).not.toBeInTheDocument()
    expect(await screen.findByTestId('mock-globe-scene')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: '地球显示控制' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '搜索国家' })).toBeInTheDocument()
    expect(
      screen.queryByRole('combobox', { name: '搜索国家' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'My Geo 首页' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('MY GEO · EARTH EXPLORATION LAB'),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('world-mini-map')).toBeInTheDocument()
  })

  it('opens, focuses, and closes the search dialog from the control deck', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    const trigger = screen.getByRole('button', { name: '搜索国家' })
    await user.click(trigger)

    const search = screen.getByRole('combobox', { name: '搜索国家' })
    expect(search).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('combobox', { name: '搜索国家' }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes the search dialog when the globe area is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    const trigger = screen.getByRole('button', { name: '搜索国家' })
    await user.click(trigger)
    expect(
      screen.getByRole('combobox', { name: '搜索国家' }),
    ).toBeInTheDocument()

    await user.click(await screen.findByTestId('mock-globe-scene'))
    expect(
      screen.queryByRole('combobox', { name: '搜索国家' }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('creates a new camera request when the same country is selected twice', async () => {
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    await userEvent.click(screen.getByRole('button', { name: '搜索国家' }))
    let search = screen.getByRole('combobox', { name: '搜索国家' })
    await userEvent.type(search, '中国{Enter}')
    const firstRequestId = (
      globePropsMock.mock.lastCall![0] as {
        cameraTarget: { requestId: number }
      }
    ).cameraTarget.requestId

    await userEvent.click(screen.getByRole('button', { name: '搜索国家' }))
    search = screen.getByRole('combobox', { name: '搜索国家' })
    await userEvent.keyboard('{Enter}')
    const secondRequestId = (
      globePropsMock.mock.lastCall![0] as {
        cameraTarget: { requestId: number }
      }
    ).cameraTarget.requestId

    expect(secondRequestId).toBeGreaterThan(firstRequestId)
  })

  it('keeps country search available when WebGL is unavailable', async () => {
    supportsWebGLMock.mockReturnValue(false)
    const user = userEvent.setup()

    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    expect(screen.getByTestId('webgl-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-globe-scene')).not.toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: '地球显示控制' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '搜索国家' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索国家' }),
      '中国{Enter}',
    )
    expect(screen.getByLabelText('中国国家知识卡')).toBeInTheDocument()
  })
})
