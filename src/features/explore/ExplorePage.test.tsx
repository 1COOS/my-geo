import * as Tooltip from '@radix-ui/react-tooltip'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../app/i18n'
import { ExplorePage } from './ExplorePage'

vi.mock('../../scene/GlobeScene', () => ({
  GlobeScene: () => <div data-testid="mock-globe-scene">3D globe</div>,
}))

const supportsWebGLMock = vi.fn<() => boolean>()

vi.mock('../../shared/lib/webgl', () => ({
  supportsWebGL: () => supportsWebGLMock(),
}))

describe('ExplorePage', () => {
  beforeEach(() => {
    supportsWebGLMock.mockReturnValue(true)
  })

  it('shows the product introduction and 3D controls', async () => {
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    expect(
      screen.getByRole('heading', {
        name: '转动地球，发现每一片土地',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByTestId('mock-globe-scene')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: '地球显示控制' }),
    ).toBeInTheDocument()
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
