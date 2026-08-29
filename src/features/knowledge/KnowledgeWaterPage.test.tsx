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

function getObjectGroups() {
  return screen.getByLabelText('水域对象分类')
}

describe('KnowledgeWaterPage', () => {
  it('matches the country and earth overview contract with complete ocean groups', async () => {
    renderWaterPage('/knowledge/water')

    expect(
      screen.getByRole('heading', { name: '水域', level: 1 }),
    ).toBeVisible()
    expect(screen.getByLabelText('水域知识范围')).toHaveTextContent(
      '4图层111对象',
    )
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      '海洋',
      '湖泊',
      '水域',
      '河流',
    ])
    expect(screen.getByRole('tab', { name: '海洋' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByTestId('knowledge-water-map')).toBeVisible()
    expect(
      screen.getByTestId('knowledge-water-map').closest('.knowledge-map-card'),
    ).toHaveClass('knowledge-earth-map-card')

    await waitFor(() =>
      expect(
        screen
          .getByTestId('knowledge-water-map')
          .querySelectorAll('[data-waterbody-id]'),
      ).toHaveLength(37),
    )
    const groups = getObjectGroups()
    expect(within(groups).getAllByRole('heading', { level: 2 })).toHaveLength(3)
    expect(within(groups).getByRole('heading', { name: '大洋' })).toBeVisible()
    expect(within(groups).getByRole('heading', { name: '海' })).toBeVisible()
    expect(within(groups).getByRole('heading', { name: '海湾' })).toBeVisible()
    expect(within(groups).getAllByRole('link')).toHaveLength(37)
    expect(
      within(groups).getByRole('link', { name: /太平洋\s+Pacific Ocean/ }),
    ).toHaveAttribute(
      'href',
      '/knowledge/water/waterbodies/pacific-ocean?layer=ocean',
    )
  })

  it('groups every lake by world region and synchronizes the layer URL', async () => {
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
    const groups = getObjectGroups()
    expect(
      within(groups)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲'])
    expect(within(groups).getAllByRole('link')).toHaveLength(20)
    expect(within(groups).getByText('7 个对象')).toBeVisible()
    expect(
      within(groups).getByRole('link', { name: /贝加尔湖\s+Lake Baikal/ }),
    ).toHaveAttribute(
      'href',
      '/knowledge/water/waterbodies/lake-baikal?layer=lake',
    )
  })

  it('uses the same waterway and river divisions as the 3D layer deck', async () => {
    const user = userEvent.setup()
    renderWaterPage('/knowledge/water?layer=waterway')

    let map = screen.getByTestId('knowledge-water-map')
    await waitFor(() =>
      expect(map.querySelectorAll('[data-waterbody-id]')).toHaveLength(14),
    )
    expect(
      within(getObjectGroups())
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['海峡', '海沟'])

    await user.click(screen.getByRole('tab', { name: '河流' }))
    map = screen.getByTestId('knowledge-water-map')
    await waitFor(() =>
      expect(
        map.querySelectorAll('[data-linear-feature-kind="river"]'),
      ).toHaveLength(30),
    )
    expect(
      map.querySelectorAll('[data-linear-feature-kind="canal"]'),
    ).toHaveLength(10)
    expect(
      map.querySelector('[data-linear-feature-id="suez-canal"] path'),
    ).toHaveAttribute('stroke-dasharray', '3 2')
    expect(
      within(getObjectGroups())
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['河流', '运河'])
    expect(within(getObjectGroups()).getAllByRole('link')).toHaveLength(40)
  })

  it('opens an earth-style detail with the map on the left and fixed knowledge card on the right', async () => {
    const user = userEvent.setup()
    renderWaterPage('/knowledge/water?layer=river')

    await user.click(
      within(getObjectGroups()).getByRole('link', {
        name: /亚马孙河\s+Amazon River/,
      }),
    )
    expect(await screen.findByLabelText('亚马孙河河流详情')).toBeVisible()
    expect(screen.queryByLabelText('知识主题')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← 返回河流' })).toHaveAttribute(
      'href',
      '/knowledge/water?layer=river',
    )
    expect(screen.getByText('所属图层')).toBeVisible()
    expect(screen.getByText('核心知识')).toBeVisible()
    expect(screen.getByText('地图判读')).toBeVisible()
    expect(screen.getByText('河流与运河')).toBeVisible()
    expect(screen.getByText('容易混淆')).toBeVisible()
    expect(
      screen.getByRole('link', { name: /在3D地球上查看/ }),
    ).toHaveAttribute('href', '/explore?linearFeature=amazon-system')
    expect(
      screen
        .getByTestId('knowledge-water-map')
        .querySelector('[data-linear-feature-id="amazon-system"]'),
    ).toHaveAttribute('aria-current', 'true')

    await user.click(screen.getByRole('button', { name: '关闭亚马孙河详情' }))
    expect(screen.getByLabelText('知识主题')).toBeVisible()
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water?layer=river',
    )
  })

  it('canonicalizes legacy, mismatched and invalid URLs', async () => {
    let view = renderWaterPage('/knowledge/water?topic=lakes-and-wetlands')
    expect(await screen.findByRole('tab', { name: '湖泊' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water?layer=lake',
    )

    view.unmount()
    view = renderWaterPage(
      '/knowledge/water/waterbodies/bering-strait?layer=ocean',
    )
    expect(await screen.findByLabelText('白令海峡海峡详情')).toBeVisible()
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water/waterbodies/bering-strait?layer=waterway',
    )

    view.unmount()
    renderWaterPage('/knowledge/water/linear-features/unknown?layer=river')
    expect(await screen.findByRole('tab', { name: '河流' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByTestId('water-location')).toHaveTextContent(
      '/knowledge/water?layer=river',
    )
  })
})
