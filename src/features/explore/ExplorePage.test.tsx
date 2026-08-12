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

  it('shows the globe, search, and 3D controls without the intro copy', async () => {
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
    expect(
      screen.getByRole('combobox', { name: '搜索国家' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('world-mini-map')).toBeInTheDocument()
  })

  it('creates a new camera request when the same country is selected twice', async () => {
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    let search = screen.getByRole('combobox', { name: '搜索国家' })
    await userEvent.type(search, '中国{Enter}')
    const firstRequestId = (
      globePropsMock.mock.lastCall![0] as {
        cameraTarget: { requestId: number }
      }
    ).cameraTarget.requestId

    search = screen.getByRole('combobox', { name: '搜索国家' })
    await userEvent.click(search)
    await userEvent.keyboard('{Enter}')
    const secondRequestId = (
      globePropsMock.mock.lastCall![0] as {
        cameraTarget: { requestId: number }
      }
    ).cameraTarget.requestId

    expect(secondRequestId).toBeGreaterThan(firstRequestId)
  })

  it('renders a useful fallback when WebGL is unavailable', () => {
    supportsWebGLMock.mockReturnValue(false)

    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    expect(screen.getByTestId('webgl-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-globe-scene')).not.toBeInTheDocument()
  })
})
