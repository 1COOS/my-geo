import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { resetGeometryResourceCachesForTests } from '../../data/geometryResources'
import { KnowledgeExtremesPage } from './KnowledgeExtremesPage'

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="extremes-location">
      {location.pathname}
      {location.search}
    </output>
  )
}

function renderExtremes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/knowledge/extremes" element={<KnowledgeExtremesPage />} />
        <Route
          path="/knowledge/extremes/metrics/:metricId"
          element={<KnowledgeExtremesPage />}
        />
        <Route
          path="/knowledge/extremes/:legacyMetricId/:legacyEntryId"
          element={<KnowledgeExtremesPage />}
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('KnowledgeExtremesPage', () => {
  it('shows the unified topic header, category tabs, champion map and metric cards', async () => {
    renderExtremes('/knowledge/extremes')

    expect(
      await screen.findByRole('heading', { name: '世界之最' }),
    ).toHaveClass('sr-only')
    expect(screen.queryByLabelText('世界之最知识范围')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('知识主题')).not.toBeInTheDocument()
    expect(screen.getByTestId('extremes-location')).toHaveTextContent(
      '/knowledge/extremes?category=country-scale',
    )
    expect(screen.getByRole('tab', { name: '国家尺度' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const map = screen.getByTestId('world-extremes-category-map')
    expect(map).toBeVisible()
    expect(map).toHaveAttribute('viewBox', '0 0 720 340')
    await waitFor(() =>
      expect(within(map).getAllByRole('button')).toHaveLength(4),
    )
    expect(map.querySelectorAll('text')).toHaveLength(0)
    expect(
      Array.from(map.querySelectorAll('[data-geometry-kind]'), (overlay) =>
        overlay.getAttribute('data-geometry-kind'),
      ),
    ).toEqual(['surface', 'microstate', 'surface', 'microstate'])
    const metricLinks = within(
      screen.getByLabelText('国家尺度指标'),
    ).getAllByRole('link')
    expect(metricLinks).toHaveLength(4)
    expect(
      metricLinks.every(
        (link) => link.querySelector(':scope > [aria-hidden="true"]') === null,
      ),
    ).toBe(true)
    const cardColors = metricLinks.map((link) =>
      getComputedStyle(link)
        .getPropertyValue('--knowledge-earth-line-color')
        .trim(),
    )
    const overlayColors = Array.from(
      map.querySelectorAll('.world-extremes-category-visible'),
      (overlay) => overlay.getAttribute('fill'),
    )
    expect(overlayColors).toEqual(cardColors)
    expect(new Set(cardColors).size).toBe(4)
    const vaticanMarkers = map.querySelectorAll(
      '[data-entry-id="vatican-city"]',
    )
    expect(vaticanMarkers).toHaveLength(2)
    expect(vaticanMarkers[0].getAttribute('transform')).not.toBe(
      vaticanMarkers[1].getAttribute('transform'),
    )
  })

  it('switches categories and opens a champion from the category map', async () => {
    const user = userEvent.setup()
    renderExtremes('/knowledge/extremes?category=country-scale')

    await user.click(screen.getByRole('tab', { name: '高山荒漠' }))
    expect(screen.getByTestId('extremes-location')).toHaveTextContent(
      '/knowledge/extremes?category=mountains-deserts',
    )
    const map = screen.getByTestId('world-extremes-category-map')
    await waitFor(() =>
      expect(within(map).getAllByRole('button')).toHaveLength(3),
    )
    expect(
      Array.from(map.querySelectorAll('[data-entity-kind]'), (overlay) =>
        overlay.getAttribute('data-entity-kind'),
      ),
    ).toEqual(['mountainRange', 'mountainRange', 'desert'])
    expect(
      Array.from(map.querySelectorAll('[data-geometry-kind]'), (overlay) =>
        overlay.getAttribute('data-geometry-kind'),
      ),
    ).toEqual(['linear', 'linear', 'surface'])
    const champion = within(map).getByRole('button', {
      name: '查看海拔最高的山峰冠军珠穆朗玛峰',
    })
    champion.focus()
    await user.keyboard('{Enter}')

    expect(await screen.findByLabelText('珠穆朗玛峰世界之最详情')).toBeVisible()
    expect(screen.getByTestId('extremes-location')).toHaveTextContent(
      '/knowledge/extremes/metrics/highest-peak?entry=mount-everest',
    )
    expect(
      screen.getByTestId('world-extreme-entry-mount-everest'),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('renders river, lake, ocean and trench champions with real geometry', async () => {
    const user = userEvent.setup()
    renderExtremes('/knowledge/extremes?category=country-scale')

    await user.click(screen.getByRole('tab', { name: '江河湖泊' }))
    const map = screen.getByTestId('world-extremes-category-map')
    await waitFor(() =>
      expect(within(map).getAllByRole('button')).toHaveLength(3),
    )
    expect(
      Array.from(map.querySelectorAll('[data-entity-kind]'), (overlay) =>
        overlay.getAttribute('data-entity-kind'),
      ),
    ).toEqual(['linearFeature', 'waterbody', 'waterbody'])
    expect(
      Array.from(map.querySelectorAll('[data-geometry-kind]'), (overlay) =>
        overlay.getAttribute('data-geometry-kind'),
      ),
    ).toEqual(['linear', 'surface', 'surface'])

    await user.click(screen.getByRole('tab', { name: '海洋深处' }))
    await waitFor(() =>
      expect(within(map).getAllByRole('button')).toHaveLength(2),
    )
    expect(
      Array.from(map.querySelectorAll('[data-geometry-kind]'), (overlay) =>
        overlay.getAttribute('data-geometry-kind'),
      ),
    ).toEqual(['surface', 'linear'])
  })

  it('uses persistent metric and object knowledge cards', async () => {
    const user = userEvent.setup()
    renderExtremes('/knowledge/extremes/metrics/deepest-lake')

    expect(screen.getByLabelText('最深的湖泊指标知识')).toBeVisible()
    expect(
      screen.getByLabelText('最深的湖泊指标知识').getAttribute('style'),
    ).toContain('--knowledge-card-accent: #8b8cff')
    expect(screen.getByLabelText('最深的湖泊前三名单')).toHaveTextContent(
      '贝加尔湖',
    )
    expect(
      within(screen.getByLabelText('江河湖泊指标')).getAllByRole('link'),
    ).toHaveLength(3)
    const entryLinks = within(
      screen.getByLabelText('最深的湖泊前三名'),
    ).getAllByRole('link')
    expect(entryLinks).toHaveLength(3)
    expect(
      entryLinks.map(
        (link) =>
          link.querySelector(':scope > [aria-hidden="true"]')?.textContent,
      ),
    ).toEqual(['1', '2', '3'])

    await user.click(screen.getByTestId('world-extreme-entry-lake-tanganyika'))
    expect(await screen.findByLabelText('坦噶尼喀湖世界之最详情')).toBeVisible()
    expect(screen.getByTestId('extremes-location')).toHaveTextContent(
      '/knowledge/extremes/metrics/deepest-lake?entry=lake-tanganyika',
    )
    expect(
      screen.queryByRole('button', {
        name: '关闭坦噶尼喀湖世界之最详情',
      }),
    ).not.toBeInTheDocument()
  })

  it('keeps metric cards available and retries failed category geometry', async () => {
    resetGeometryResourceCachesForTests()
    const user = userEvent.setup()
    const fixtureFetch = globalThis.fetch
    let desertFails = true
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url =
          input instanceof Request
            ? input.url
            : input instanceof URL
              ? input.href
              : input
        if (desertFails && url.includes('desert-geometries')) {
          return Promise.resolve(new Response(null, { status: 503 }))
        }
        return fixtureFetch(input)
      }),
    )

    renderExtremes('/knowledge/extremes?category=mountains-deserts')
    expect(
      within(screen.getByLabelText('高山荒漠指标')).getAllByRole('link'),
    ).toHaveLength(3)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '指标卡仍可继续使用',
    )

    desertFails = false
    await user.click(screen.getByRole('button', { name: '重新加载' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    await waitFor(() =>
      expect(
        within(screen.getByTestId('world-extremes-category-map')).getAllByRole(
          'button',
        ),
      ).toHaveLength(3),
    )
  })

  it('redirects legacy and invalid extreme URLs', async () => {
    let view = renderExtremes('/knowledge/extremes/highest-peak/mount-everest')
    expect(await screen.findByLabelText('珠穆朗玛峰世界之最详情')).toBeVisible()
    expect(screen.getByTestId('extremes-location')).toHaveTextContent(
      '/knowledge/extremes/metrics/highest-peak?entry=mount-everest',
    )

    view.unmount()
    view = renderExtremes(
      '/knowledge/extremes?category=country-scale&metric=deepest-lake',
    )
    expect(await screen.findByLabelText('最深的湖泊指标知识')).toBeVisible()
    expect(screen.getByTestId('extremes-location')).toHaveTextContent(
      '/knowledge/extremes/metrics/deepest-lake',
    )

    view.unmount()
    renderExtremes('/knowledge/extremes/metrics/unknown?entry=unknown')
    await waitFor(() =>
      expect(screen.getByTestId('extremes-location')).toHaveTextContent(
        '/knowledge/extremes?category=country-scale',
      ),
    )
  })
})
