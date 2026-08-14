import * as Tooltip from '@radix-ui/react-tooltip'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../app/i18n'
import type { GeoPosition } from '../../shared/types/geo'
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
    expect(screen.getByRole('button', { name: '搜索地点' })).toBeInTheDocument()
    expect(
      screen.queryByRole('combobox', { name: '搜索地点' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'My Geo 首页' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('MY GEO · EARTH EXPLORATION LAB'),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('world-mini-map')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '地球图层控制' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '首都' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '城市' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '海洋' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '水域' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(
      screen.getByRole('button', {
        name: '河流图层：世界重要河流与人工运河',
      }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByRole('button', { name: '运河图层：重要人工运河' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: '山脉图层：世界著名山脉与最高峰',
      }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('海洋：大洋、海与海湾')).toBeInTheDocument()
    expect(screen.getByText('水域：海峡与海沟')).toBeInTheDocument()
  })

  it('opens, focuses, and closes the search dialog from the control deck', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    const trigger = screen.getByRole('button', { name: '搜索地点' })
    await user.click(trigger)

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    expect(search).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('combobox', { name: '搜索地点' }),
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

    const trigger = screen.getByRole('button', { name: '搜索地点' })
    await user.click(trigger)
    expect(
      screen.getByRole('combobox', { name: '搜索地点' }),
    ).toBeInTheDocument()

    await user.click(await screen.findByTestId('mock-globe-scene'))
    expect(
      screen.queryByRole('combobox', { name: '搜索地点' }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('creates a new camera request when the same country is selected twice', async () => {
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    await userEvent.click(screen.getByRole('button', { name: '搜索地点' }))
    let search = screen.getByRole('combobox', { name: '搜索地点' })
    await userEvent.type(search, '中国{Enter}')
    const firstRequestId = (
      globePropsMock.mock.lastCall![0] as {
        cameraTarget: { requestId: number }
      }
    ).cameraTarget.requestId

    await userEvent.click(screen.getByRole('button', { name: '搜索地点' }))
    search = screen.getByRole('combobox', { name: '搜索地点' })
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
    expect(
      screen.queryByRole('region', { name: '地球图层控制' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索地点' }),
      '中国{Enter}',
    )
    expect(screen.getByLabelText('中国国家知识卡')).toBeInTheDocument()
  })

  it('opens a city knowledge card and requests the closer city camera distance', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索地点' }),
      '中国{Enter}',
    )
    await user.click(screen.getByRole('button', { name: '探索城市上海' }))

    expect(screen.getByLabelText('上海城市知识卡')).toBeInTheDocument()
    expect(
      (
        globePropsMock.mock.lastCall![0] as {
          cameraTarget: { distance: number; position: GeoPosition }
          selectedCityId: string | null
        }
      ).cameraTarget.distance,
    ).toBe(190)
    expect(
      (
        globePropsMock.mock.lastCall![0] as {
          selectedCityId: string | null
        }
      ).selectedCityId,
    ).toBe('cn-shanghai')

    await user.click(screen.getByRole('button', { name: '← 返回中国' }))
    expect(screen.getByLabelText('中国国家知识卡')).toBeInTheDocument()
  })

  it('toggles capital and non-capital city layers independently', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showCapitals: boolean
        showCities: boolean
      }

    expect(getProps()).toMatchObject({ showCapitals: false, showCities: false })

    await user.click(screen.getByRole('button', { name: '首都' }))
    expect(getProps()).toMatchObject({ showCapitals: true, showCities: false })
    expect(screen.getByRole('button', { name: '首都' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: '城市' }))
    expect(getProps()).toMatchObject({ showCapitals: true, showCities: true })

    await user.click(screen.getByRole('button', { name: '首都' }))
    expect(getProps()).toMatchObject({ showCapitals: false, showCities: true })

    unmount()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    expect(getProps()).toMatchObject({ showCapitals: false, showCities: false })
  })

  it('toggles waterbody layers and opens a searched waterbody card', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showOceanLayer: boolean
        showWaterwayLayer: boolean
        selectedWaterbodyId: string | null
        selectedCountryCode: string | null
      }

    await user.click(screen.getByRole('button', { name: '海洋' }))
    expect(getProps()).toMatchObject({
      showOceanLayer: true,
      showWaterwayLayer: false,
    })
    await user.click(screen.getByRole('button', { name: '水域' }))
    expect(getProps()).toMatchObject({
      showOceanLayer: true,
      showWaterwayLayer: true,
    })

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.clear(search)
    await user.type(search, '太平洋{Enter}')
    expect(await screen.findByLabelText('太平洋水域知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      selectedWaterbodyId: 'pacific-ocean',
      selectedCountryCode: null,
    })
    expect(screen.getByText(/不代表领海/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const bohaiSearch = screen.getByRole('combobox', { name: '搜索地点' })
    await user.clear(bohaiSearch)
    await user.type(bohaiSearch, '渤海{Enter}')
    expect(await screen.findByLabelText('渤海水域知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({ selectedWaterbodyId: 'bohai-sea' })
    expect(screen.getByText('中国东北部沿海、黄海西北部')).toBeInTheDocument()
  })

  it('toggles river and canal layers and keeps all place selection mutually exclusive', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showRiverAndCanalLayer: boolean
        selectedLinearFeatureId: string | null
        selectedWaterbodyId: string | null
        selectedCountryCode: string | null
      }

    await user.click(
      screen.getByRole('button', {
        name: '河流图层：世界重要河流与人工运河',
      }),
    )
    expect(getProps()).toMatchObject({
      showRiverAndCanalLayer: true,
    })
    expect(
      screen.queryByRole('button', { name: '运河图层：重要人工运河' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, '长江{Enter}')
    expect(await screen.findByLabelText('长江知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      selectedLinearFeatureId: 'yangtze-system',
      selectedWaterbodyId: null,
      selectedCountryCode: null,
    })

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const nextSearch = screen.getByRole('combobox', { name: '搜索地点' })
    await user.clear(nextSearch)
    await user.type(nextSearch, '苏伊士运河{Enter}')
    expect(await screen.findByLabelText('苏伊士运河知识卡')).toBeInTheDocument()
    expect(screen.queryByLabelText('长江知识卡')).not.toBeInTheDocument()
  })

  it('toggles the mountain layer and opens a highest-peak knowledge card', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showMountainLayer: boolean
        selectedMountainRangeId: string | null
        selectedLinearFeatureId: string | null
        selectedCountryCode: string | null
      }

    const toggle = screen.getByRole('button', {
      name: '山脉图层：世界著名山脉与最高峰',
    })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(getProps()).toMatchObject({ showMountainLayer: true })

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, '珠穆朗玛峰{Enter}')
    expect(
      await screen.findByLabelText('喜马拉雅山脉知识卡'),
    ).toBeInTheDocument()
    expect(screen.getByText('珠穆朗玛峰')).toBeInTheDocument()
    expect(screen.getByText(/8,849 m/)).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      selectedMountainRangeId: 'himalayas',
      selectedLinearFeatureId: null,
      selectedCountryCode: null,
    })
  })

  it('does not reveal city layers when the committed globe view changes', () => {
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    const props = globePropsMock.mock.lastCall![0] as {
      showCapitals: boolean
      showCities: boolean
      onViewCenterCommit: (view: {
        position: { latitude: number; longitude: number }
        distance: number
      }) => void
    }

    props.onViewCenterCommit({
      position: { latitude: 35, longitude: 105 },
      distance: 240,
    })
    expect(globePropsMock.mock.lastCall![0]).toMatchObject({
      showCapitals: false,
      showCities: false,
    })
  })

  it('clears a hovered city when its layer is switched off', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )

    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        hoveredCityId: string | null
        onHoverCity: (cityId: string | null) => void
      }

    await user.click(screen.getByRole('button', { name: '城市' }))
    act(() => getProps().onHoverCity('cn-shanghai'))
    expect(getProps().hoveredCityId).toBe('cn-shanghai')

    await user.click(screen.getByRole('button', { name: '城市' }))
    expect(getProps().hoveredCityId).toBeNull()
  })
})
