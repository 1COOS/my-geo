import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { KnowledgeWaterPage } from './KnowledgeWaterPage'

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="water-location">
      {location.pathname}
      {location.search}
    </output>
  )
}

function renderWaterPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/knowledge/water" element={<KnowledgeWaterPage />} />
        <Route
          path="/knowledge/water/groups/:groupId"
          element={<KnowledgeWaterPage />}
        />
        <Route
          path="/knowledge/water/waterbodies/:waterbodyId"
          element={<KnowledgeWaterPage />}
        />
        <Route
          path="/knowledge/water/linear-features/:linearFeatureId"
          element={<KnowledgeWaterPage />}
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('KnowledgeWaterPage', () => {
  it('renders the earth-style first level with layer tabs, a full map and group cards', async () => {
    renderWaterPage('/knowledge/water')

    expect(
      await screen.findByRole('heading', { name: '江河湖海' }),
    ).toHaveClass('sr-only')
    expect(screen.queryByLabelText('水域知识范围')).toBeNull()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      '海洋',
      '湖泊',
      '海峡·海沟',
      '河流',
    ])
    expect(screen.getByRole('tab', { name: '海洋' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water?layer=ocean',
    )
    await waitFor(() =>
      expect(
        screen
          .getByTestId('knowledge-water-map')
          .querySelectorAll('[data-waterbody-id]'),
      ).toHaveLength(37),
    )
    const groups = screen.getByLabelText('海洋分组')
    expect(within(groups).getAllByRole('link')).toHaveLength(3)
    expect(
      within(groups).getByTestId('knowledge-water-group-ocean-oceans'),
    ).toHaveAttribute('href', '/knowledge/water/groups/ocean-oceans')
    expect(within(groups).getByText('大洋')).toBeVisible()
    expect(within(groups).getByText('海')).toBeVisible()
    expect(within(groups).getByText('海湾')).toBeVisible()
    expect(within(groups).getByText('Oceans')).toBeVisible()
    expect(within(groups).getByText('Seas')).toBeVisible()
    expect(within(groups).getByText('Gulfs and Bays')).toBeVisible()
    expect(within(groups).queryByText(/五大洋彼此连通/)).not.toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('uses one world-lakes group and opens its second-level overview', async () => {
    const user = userEvent.setup()
    renderWaterPage('/knowledge/water?layer=ocean')

    await user.click(screen.getByRole('tab', { name: '湖泊' }))
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water?layer=lake',
    )
    const map = screen.getByTestId('knowledge-water-map')
    await waitFor(() =>
      expect(map.querySelectorAll('[data-waterbody-id]')).toHaveLength(20),
    )
    const groups = screen.getByLabelText('湖泊分组')
    expect(within(groups).getAllByRole('link')).toHaveLength(1)
    const worldLakes = within(groups).getByTestId(
      'knowledge-water-group-world-lakes',
    )
    expect(worldLakes).toHaveTextContent('世界湖泊20 个World Lakes')

    await user.click(worldLakes)
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water/groups/world-lakes',
    )
    expect(screen.queryByLabelText('知识主题')).not.toBeInTheDocument()
    expect(screen.getByLabelText('世界湖泊水域分组知识')).toBeVisible()
    expect(screen.getByLabelText('世界湖泊水域分组知识')).toHaveTextContent(
      '世界代表性湖泊分布在不同气候和地形区',
    )
    expect(screen.getByLabelText('世界湖泊对象名单')).toHaveTextContent(
      '贝加尔湖',
    )
    expect(
      within(screen.getByLabelText('世界湖泊对象')).getAllByRole('link'),
    ).toHaveLength(20)
    expect(
      within(screen.getByLabelText('湖泊分组')).getAllByRole('link'),
    ).toHaveLength(1)
  })

  it('replaces the group overview with a persistent object card', async () => {
    const user = userEvent.setup()
    renderWaterPage('/knowledge/water/groups/ocean-seas')

    expect(screen.getByLabelText('海水域分组知识')).toBeVisible()
    const map = screen.getByTestId('knowledge-water-map')
    expect(map.querySelectorAll('[data-group-member="true"]')).toHaveLength(26)
    expect(map.querySelectorAll('[data-group-member="false"]')).toHaveLength(11)

    await user.click(
      within(screen.getByLabelText('海对象')).getByRole('link', {
        name: /地中海\s+Mediterranean Sea/,
      }),
    )
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water/groups/ocean-seas?object=mediterranean-sea',
    )
    expect(await screen.findByLabelText('地中海海详情')).toBeVisible()
    expect(screen.queryByLabelText('海水域分组知识')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '关闭地中海详情' }),
    ).not.toBeInTheDocument()
  })

  it('moves map-selected objects to their real group and keeps 3D deep links', async () => {
    const user = userEvent.setup()
    renderWaterPage('/knowledge/water/groups/ocean-seas')

    await user.click(
      within(screen.getByTestId('knowledge-water-map')).getByRole('button', {
        name: '查看墨西哥湾详情',
      }),
    )
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water/groups/ocean-bays?object=gulf-of-mexico',
    )
    expect(await screen.findByLabelText('墨西哥湾海湾详情')).toBeVisible()
    expect(
      screen.getByRole('link', { name: /在3D地球上查看/ }),
    ).toHaveAttribute('href', '/explore?waterbody=gulf-of-mexico')
  })

  it('canonicalizes legacy, mismatched and invalid URLs', async () => {
    let view = renderWaterPage('/knowledge/water?layer=lake&group=lake-asia')
    expect(await screen.findByLabelText('世界湖泊水域分组知识')).toBeVisible()
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water/groups/world-lakes',
    )

    view.unmount()
    view = renderWaterPage(
      '/knowledge/water/waterbodies/bering-strait?layer=ocean',
    )
    expect(await screen.findByLabelText('白令海峡海峡详情')).toBeVisible()
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water/groups/waterway-straits?object=bering-strait',
    )

    view.unmount()
    view = renderWaterPage(
      '/knowledge/water/groups/ocean-seas?object=lake-baikal',
    )
    expect(await screen.findByLabelText('贝加尔湖湖泊详情')).toBeVisible()
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water/groups/world-lakes?object=lake-baikal',
    )

    view.unmount()
    renderWaterPage('/knowledge/water/groups/unknown?object=unknown')
    expect(await screen.findByRole('tab', { name: '海洋' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water?layer=ocean',
    )
  })
})
