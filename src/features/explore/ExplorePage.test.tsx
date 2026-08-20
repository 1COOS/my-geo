import * as Tooltip from '@radix-ui/react-tooltip'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../app/i18n'
import type { GeoPosition } from '../../shared/types/geo'
import { ExplorePage } from './ExplorePage'

const globePropsMock = vi.fn()
const climateRasterMocks = vi.hoisted(() => ({
  classify: vi.fn(),
  display: vi.fn(),
  preload: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../data/climateRaster', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../data/climateRaster')>()
  return {
    ...actual,
    classifyClimatePosition: climateRasterMocks.classify,
    loadClimateDisplayAssets: climateRasterMocks.display,
    preloadClimateRaster: climateRasterMocks.preload,
  }
})

vi.mock('../../scene/GlobeScene', () => ({
  GlobeScene: (props: unknown) => {
    const grouped = props as Record<string, Record<string, unknown>>
    globePropsMock({
      ...grouped.geometry,
      ...grouped.view,
      ...grouped.layers,
      ...grouped.climate,
      ...grouped.selection,
      ...grouped.hover,
      ...grouped.events,
    })
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
    climateRasterMocks.display.mockReset()
    climateRasterMocks.display.mockImplementation(
      (quality: 'balanced' | 'low', climateTypeId: string | null) => {
        const width = quality === 'balanced' ? 2048 : 1024
        const height = quality === 'balanced' ? 1024 : 512
        const raster = {
          url: climateTypeId
            ? `/climate/highlights-v2/${quality}/${climateTypeId}.png`
            : `/climate/climate-types-${width}.png`,
          width,
          height,
          bytes: 1,
          sha256: '0'.repeat(64),
        }
        return Promise.resolve({
          raster,
          boundary: climateTypeId
            ? {
                ...raster,
                url: `/climate/highlight-boundaries/${quality}/${climateTypeId}.png`,
              }
            : null,
        })
      },
    )
    climateRasterMocks.preload.mockClear()
    climateRasterMocks.classify.mockReset()
    climateRasterMocks.classify.mockResolvedValue({
      position: { latitude: 39.9, longitude: 116.4 },
      climateTypeId: 'temperate-monsoon',
      period: '1991–2020',
    })
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
    expect(
      screen.getByRole('button', { name: '世界气候类型教学图层' }),
    ).toHaveAttribute('aria-pressed', 'false')
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
        name: '湖泊图层：世界著名淡水与咸水湖泊',
      }),
    ).toHaveAttribute('aria-pressed', 'false')
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
    expect(
      screen.getByRole('button', {
        name: '沙漠图层：世界主要沙漠与荒漠景观',
      }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByRole('button', {
        name: '名胜古迹图层：世界著名文化与历史遗产',
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

    await user.click(screen.getByRole('button', { name: '关闭国家知识卡' }))
    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    await user.clear(screen.getByRole('combobox', { name: '搜索地点' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索地点' }),
      '赤道{Enter}',
    )
    expect(screen.getByLabelText('经纬网知识卡')).toBeInTheDocument()
    expect(screen.getByText('重要纬线与东西半球界线示意')).toBeInTheDocument()
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
        showLakeLayer: boolean
        showWaterwayLayer: boolean
        selectedWaterbodyId: string | null
        selectedCountryCode: string | null
      }

    await user.click(screen.getByRole('button', { name: '海洋' }))
    expect(getProps()).toMatchObject({
      showOceanLayer: true,
      showLakeLayer: false,
      showWaterwayLayer: false,
    })
    const lakeToggle = screen.getByRole('button', {
      name: '湖泊图层：世界著名淡水与咸水湖泊',
    })
    await user.click(lakeToggle)
    expect(getProps()).toMatchObject({
      showOceanLayer: true,
      showLakeLayer: true,
      showWaterwayLayer: false,
    })
    await user.click(screen.getByRole('button', { name: '水域' }))
    expect(getProps()).toMatchObject({
      showOceanLayer: true,
      showLakeLayer: true,
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
    expect(screen.queryByText(/不代表领海/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const bohaiSearch = screen.getByRole('combobox', { name: '搜索地点' })
    await user.clear(bohaiSearch)
    await user.type(bohaiSearch, '渤海{Enter}')
    expect(await screen.findByLabelText('渤海水域知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({ selectedWaterbodyId: 'bohai-sea' })
    expect(screen.getByText('中国东北部沿海、黄海西北部')).toBeInTheDocument()

    await user.click(lakeToggle)
    expect(getProps()).toMatchObject({ showLakeLayer: false })
    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const lakeSearch = screen.getByRole('combobox', { name: '搜索地点' })
    await user.clear(lakeSearch)
    await user.type(lakeSearch, '贝加尔湖{Enter}')
    expect(
      await screen.findByLabelText('贝加尔湖水域知识卡'),
    ).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      showLakeLayer: true,
      selectedWaterbodyId: 'lake-baikal',
    })
    expect(screen.getByText('1,642 m')).toBeInTheDocument()
    expect(
      screen.queryByText(/水位、季节和长期环境变化/),
    ).not.toBeInTheDocument()

    await user.click(lakeToggle)
    expect(getProps()).toMatchObject({
      showLakeLayer: false,
      selectedWaterbodyId: 'lake-baikal',
    })
    expect(screen.getByLabelText('贝加尔湖水域知识卡')).toBeInTheDocument()

    await user.click(lakeToggle)
    await user.click(screen.getByRole('button', { name: '关闭水域知识卡' }))
    expect(getProps()).toMatchObject({
      showLakeLayer: true,
      selectedWaterbodyId: null,
    })
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

  it('activates the desert layer on search and hides it without closing the card', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showDesertLayer: boolean
        selectedDesertId: string | null
        selectedMountainRangeId: string | null
        selectedCountryCode: string | null
      }

    const toggle = screen.getByRole('button', {
      name: '沙漠图层：世界主要沙漠与荒漠景观',
    })
    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, '撒哈拉{Enter}')
    expect(await screen.findByLabelText('撒哈拉沙漠知识卡')).toBeInTheDocument()
    expect(screen.getByText(/9,200,000 km²/)).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(getProps()).toMatchObject({
      showDesertLayer: true,
      selectedDesertId: 'sahara',
      selectedMountainRangeId: null,
      selectedCountryCode: null,
    })

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('撒哈拉沙漠知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      showDesertLayer: false,
      selectedDesertId: 'sahara',
    })
  })

  it('activates the landmark layer on search and hides it without closing the card', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showLandmarkLayer: boolean
        selectedLandmarkId: string | null
        selectedDesertId: string | null
        selectedCountryCode: string | null
      }

    const toggle = screen.getByRole('button', {
      name: '名胜古迹图层：世界著名文化与历史遗产',
    })
    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, '长城{Enter}')

    expect(await screen.findByLabelText('长城古迹知识卡')).toBeInTheDocument()
    expect(screen.getByText('公元前7世纪至明代')).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(getProps()).toMatchObject({
      showLandmarkLayer: true,
      selectedLandmarkId: 'great-wall',
      selectedDesertId: null,
      selectedCountryCode: null,
    })

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('长城古迹知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      showLandmarkLayer: false,
      selectedLandmarkId: 'great-wall',
    })
  })

  it('opens the geography learning card, keeps it after hiding the layer, and updates committed interpretation', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showGeographyLearningLayer: boolean
        selectedGeographyTopicId: string | null
        selectedReferenceLineId: string | null
        onViewCenterChange: (view: {
          position: { latitude: number; longitude: number }
          distance: number
        }) => void
        onViewCenterCommit: (view: {
          position: { latitude: number; longitude: number }
          distance: number
        }) => void
      }

    const toggle = screen.getByRole('button', {
      name: '经纬教学图层：经纬网判读、半球、纬度分区与地球五带',
    })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    act(() =>
      getProps().onViewCenterChange({
        position: { latitude: 23.5, longitude: -20 },
        distance: 320,
      }),
    )
    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('经纬网知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      showGeographyLearningLayer: true,
      selectedGeographyTopicId: 'grid-reading',
      selectedReferenceLineId: null,
    })
    expect(screen.getByLabelText('当前中心判读')).toHaveTextContent(
      '热带与温带分界线上',
    )

    act(() =>
      getProps().onViewCenterCommit({
        position: { latitude: -66.5, longitude: 160 },
        distance: 320,
      }),
    )
    expect(screen.getByLabelText('当前中心判读')).toHaveTextContent(
      '东西半球分界线上',
    )
    expect(screen.getByLabelText('当前中心判读')).toHaveTextContent(
      '温带与寒带分界线上',
    )

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('经纬网知识卡')).toBeInTheDocument()
  })

  it('opens the climate overview, keeps the card after hiding, and classifies globe clicks', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showClimateLayer: boolean
        selectedClimateTypeId: string | null
        climateBoundaryRasterUrl: string | null
        selectedClimatePosition: GeoPosition | null
        onSelectClimatePosition: (position: GeoPosition) => void
      }
    const toggle = screen.getByRole('button', {
      name: '世界气候类型教学图层',
    })

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('世界气候类型知识卡')).toBeInTheDocument()
    expect(screen.getByLabelText('13类世界气候图例')).toBeInTheDocument()
    expect(getProps().showClimateLayer).toBe(true)
    expect(getProps().selectedClimateTypeId).toBeNull()

    act(() =>
      getProps().onSelectClimatePosition({
        latitude: 39.9,
        longitude: 116.4,
      }),
    )
    expect(
      await screen.findByRole('heading', { name: '温带季风气候' }),
    ).toBeInTheDocument()
    expect(getProps().selectedClimatePosition).toEqual({
      latitude: 39.9,
      longitude: 116.4,
    })
    expect(getProps().selectedClimateTypeId).toBe('temperate-monsoon')
    await waitFor(() =>
      expect(getProps().climateBoundaryRasterUrl).toBe(
        '/climate/highlight-boundaries/balanced/temperate-monsoon.png',
      ),
    )

    await user.click(screen.getByRole('button', { name: '查看13类气候图例' }))
    expect(getProps().selectedClimateTypeId).toBeNull()
    await waitFor(() => expect(getProps().climateBoundaryRasterUrl).toBeNull())

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('世界气候类型知识卡')).toBeInTheDocument()
  })

  it('searches climate knowledge, activates the layer, and lets a country replace the card', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showClimateLayer: boolean
        selectedClimateTypeId: string | null
        climateBoundaryRasterUrl: string | null
        cameraTarget: { position: GeoPosition }
      }

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索地点' }),
      '热带雨林气候{Enter}',
    )
    expect(screen.getByLabelText('世界气候类型知识卡')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '热带雨林气候' }),
    ).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      showClimateLayer: true,
      selectedClimateTypeId: 'tropical-rainforest',
      cameraTarget: { position: { latitude: -3.1, longitude: -60 } },
    })
    await waitFor(() =>
      expect(getProps().climateBoundaryRasterUrl).toBe(
        '/climate/highlight-boundaries/balanced/tropical-rainforest.png',
      ),
    )

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    await user.clear(screen.getByRole('combobox', { name: '搜索地点' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索地点' }),
      '中国{Enter}',
    )
    expect(
      screen.queryByLabelText('世界气候类型知识卡'),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('中国国家知识卡')).toBeInTheDocument()
    expect(getProps().showClimateLayer).toBe(true)
    expect(getProps().selectedClimateTypeId).toBeNull()
    await waitFor(() => expect(getProps().climateBoundaryRasterUrl).toBeNull())
    await user.click(screen.getByRole('button', { name: '关闭国家知识卡' }))
  })

  it('searches a reference line, activates its layer, and replaces it with a country card', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip.Provider>
        <ExplorePage />
      </Tooltip.Provider>,
    )
    const getProps = () =>
      globePropsMock.mock.lastCall![0] as {
        showGeographyLearningLayer: boolean
        selectedGeographyTopicId: string | null
        selectedReferenceLineId: string | null
        cameraTarget: { position: { latitude: number; longitude: number } }
      }

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索地点' }),
      '北回归线',
    )
    await screen.findByRole('option', { name: /北回归线/ })
    await user.keyboard('{Enter}')

    expect(screen.getByLabelText('经纬网知识卡')).toBeInTheDocument()
    expect(screen.getAllByText('北回归线 23.5°N').length).toBeGreaterThan(0)
    expect(getProps()).toMatchObject({
      showGeographyLearningLayer: true,
      selectedGeographyTopicId: 'earth-zones',
      selectedReferenceLineId: 'tropic-of-cancer',
      cameraTarget: {
        position: { latitude: 23.5, longitude: 105 },
      },
    })

    await user.click(screen.getByRole('button', { name: '搜索地点' }))
    await user.clear(screen.getByRole('combobox', { name: '搜索地点' }))
    await user.type(
      screen.getByRole('combobox', { name: '搜索地点' }),
      '中国{Enter}',
    )
    expect(screen.queryByLabelText('经纬网知识卡')).not.toBeInTheDocument()
    expect(screen.getByLabelText('中国国家知识卡')).toBeInTheDocument()
    expect(getProps()).toMatchObject({
      showGeographyLearningLayer: true,
      selectedGeographyTopicId: null,
      selectedReferenceLineId: null,
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
