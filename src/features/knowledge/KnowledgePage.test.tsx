import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { KnowledgeEarthLineDetailPage } from './KnowledgeEarthLineDetailPage'
import { KnowledgeEarthPage } from './KnowledgeEarthPage'
import { KnowledgePage } from './KnowledgePage'
import { KnowledgeRegionPage } from './KnowledgeRegionPage'

function getMapCountryPath(countryCode: string) {
  const path = document.querySelector(
    `.knowledge-region-map-countries path[data-country-code="${countryCode}"]`,
  )
  expect(path).not.toBeNull()
  return path!
}

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location-search">
      {location.pathname}
      {location.search}
    </output>
  )
}

describe('knowledge pages', () => {
  it('shows the country topic and switches continent region catalogs', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/knowledge']}>
        <KnowledgePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '国家首都', level: 1 }),
    ).toHaveClass('sr-only')
    expect(screen.queryByLabelText('国家知识范围')).toBeNull()
    expect(screen.queryByLabelText('知识主题')).not.toBeInTheDocument()
    expect(screen.queryByText('气候')).toBeNull()
    expect(screen.queryByText('地形')).toBeNull()
    expect(screen.queryByText('已开放')).toBeNull()
    expect(screen.queryByText('即将开放')).toBeNull()
    expect(document.querySelector('.knowledge-region-index')).toBeNull()
    expect(screen.getByTestId('knowledge-region-east-asia')).toBeVisible()
    expect(screen.queryByText('尚未挑战')).toBeNull()
    expect(document.querySelector('.knowledge-map-summary')).toBeNull()
    expect(document.querySelector('.knowledge-region-progress')).toBeNull()
    await waitFor(() => expect(getMapCountryPath('CN')).toBeInTheDocument())
    expect(
      document.querySelector('[data-landmass-id="antarctica"]'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-country-code="AQ"]'),
    ).not.toBeInTheDocument()
    expect(getMapCountryPath('CN')).toHaveClass('is-continent')
    expect(getMapCountryPath('IN')).toHaveClass('is-continent')
    expect(getMapCountryPath('FR')).not.toHaveClass('is-continent')
    expect(
      (getMapCountryPath('CN') as SVGPathElement).style.getPropertyValue(
        '--knowledge-region-accent',
      ),
    ).toBe('#4cc9f0')
    expect(
      (getMapCountryPath('JP') as SVGPathElement).style.getPropertyValue(
        '--knowledge-region-accent',
      ),
    ).toBe('#4cc9f0')
    expect(
      (getMapCountryPath('IN') as SVGPathElement).style.getPropertyValue(
        '--knowledge-region-accent',
      ),
    ).toBe('#8b8cff')
    expect(
      (getMapCountryPath('FR') as SVGPathElement).style.getPropertyValue(
        '--knowledge-region-accent',
      ),
    ).toBe('')

    await user.click(getMapCountryPath('FR'))
    expect(screen.getByTestId('knowledge-region-north-europe')).toBeVisible()
    expect(screen.getByRole('tab', { name: /欧洲/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByTestId('knowledge-region-east-asia')).toBeNull()
    expect(getMapCountryPath('CN')).not.toHaveClass('is-continent')
    expect(getMapCountryPath('FR')).toHaveClass('is-continent')
    expect(
      (getMapCountryPath('FR') as SVGPathElement).style.getPropertyValue(
        '--knowledge-region-accent',
      ),
    ).toBe('#ff8a5b')
  })

  it('colors the active earth lines, removes positioning, and switches topics from the map', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/knowledge/earth?topic=hemispheres']}>
        <Routes>
          <Route path="/knowledge/earth" element={<KnowledgeEarthPage />} />
          <Route
            path="/knowledge/earth/lines/:lineId"
            element={<KnowledgeEarthLineDetailPage />}
          />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '地球经纬', level: 1 }),
    ).toHaveClass('sr-only')
    expect(screen.queryByLabelText('地球知识范围')).toBeNull()
    expect(screen.getByRole('tab', { name: '半球界线' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByText('当前定位')).toBeNull()
    expect(screen.queryByLabelText('当前位置判读')).toBeNull()
    expect(document.querySelector('.knowledge-earth-map-marker')).toBeNull()
    const referenceLines = screen.getByLabelText('重点经纬线')
    expect(within(referenceLines).getAllByRole('link')).toHaveLength(3)
    const equatorLink = within(referenceLines).getByRole('link', {
      name: /赤道.*0°/,
    })
    expect(equatorLink).toHaveAttribute(
      'href',
      '/knowledge/earth/lines/equator',
    )
    expect(
      equatorLink.style.getPropertyValue('--knowledge-earth-line-color'),
    ).toBe('#62d9ff')
    expect(screen.queryByText('核心规则')).toBeNull()
    expect(screen.queryByText('容易混淆')).toBeNull()
    expect(screen.queryByText('判读示例')).toBeNull()
    expect(screen.queryByRole('link', { name: /在3D地球中观察/ })).toBeNull()
    expect(document.querySelector('.knowledge-earth-lesson')).toBeNull()
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '/knowledge/earth?topic=hemispheres',
    )

    const map = screen.getByTestId('knowledge-earth-map')
    await waitFor(() =>
      expect(
        map.querySelector('[data-landmass-id="antarctica"]'),
      ).toBeInTheDocument(),
    )
    expect(
      map.querySelectorAll(
        '.knowledge-earth-map-reference-lines > .is-topic-line',
      ),
    ).toHaveLength(3)
    expect(
      map.querySelectorAll(
        '.knowledge-earth-map-reference-lines > .is-background-line',
      ),
    ).toHaveLength(10)
    expect(
      map.querySelectorAll('.knowledge-earth-reference-label'),
    ).toHaveLength(3)
    expect(map.querySelectorAll('[data-coverage-region-id]')).toHaveLength(2)
    expect(
      map.querySelectorAll('.knowledge-earth-coverage-label'),
    ).toHaveLength(2)
    expect(
      map.querySelectorAll(
        '[data-coverage-region-id="western-hemisphere"] .knowledge-earth-coverage-area',
      ),
    ).toHaveLength(2)
    const easternHemisphereCoverage = map.querySelector(
      '[data-coverage-region-id="eastern-hemisphere"]',
    )!
    expect(
      easternHemisphereCoverage.querySelector('.knowledge-earth-coverage-area'),
    ).toHaveAttribute('fill', 'currentColor')
    expect(
      easternHemisphereCoverage.querySelector(
        '.knowledge-earth-coverage-label',
      ),
    ).toHaveAttribute('fill', 'currentColor')
    expect(map.querySelector('.knowledge-earth-map-coverage')).toHaveStyle({
      pointerEvents: 'none',
    })
    expect(
      Array.from(
        map.querySelectorAll(
          '.knowledge-earth-map-reference-lines > .is-topic-line .knowledge-earth-reference-visible',
        ),
      ).map((line) => line.getAttribute('stroke-width')),
    ).toEqual(['1.8', '1.8', '1.8'])
    expect(
      new Set(
        Array.from(
          map.querySelectorAll(
            '.knowledge-earth-map-reference-lines > .is-background-line .knowledge-earth-reference-visible',
          ),
        ).map((line) => line.getAttribute('stroke-width')),
      ),
    ).toEqual(new Set(['0.8']))
    expect(map).not.toHaveAttribute('tabindex')
    expect(map).not.toHaveAttribute('role', 'application')

    const equatorMapLine = map.querySelector<SVGGElement>(
      '[data-reference-line-id="equator"]',
    )!
    expect(
      equatorMapLine.style.getPropertyValue('--knowledge-earth-line-color'),
    ).toBe('#62d9ff')

    await user.click(screen.getByRole('tab', { name: '经度基准' }))
    expect(map.querySelectorAll('[data-coverage-region-id]')).toHaveLength(2)
    expect(map.querySelector('[data-coverage-label="西经区域"]')).not.toBeNull()
    expect(map.querySelector('[data-coverage-label="东经区域"]')).not.toBeNull()

    await user.click(screen.getByRole('tab', { name: '纬度分区' }))
    expect(map.querySelectorAll('[data-coverage-region-id]')).toHaveLength(3)
    expect(map.querySelector('[data-coverage-label="低纬度"]')).not.toBeNull()
    expect(map.querySelector('[data-coverage-label="中纬度"]')).not.toBeNull()
    expect(map.querySelector('[data-coverage-label="高纬度"]')).not.toBeNull()

    await user.click(
      screen.getByRole('button', {
        name: '切换到北回归线所属用途',
      }),
    )
    expect(screen.getByRole('tab', { name: '五带界线' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(referenceLines).getAllByRole('link')).toHaveLength(4)
    expect(
      map.querySelectorAll('.knowledge-earth-reference-label'),
    ).toHaveLength(4)
    expect(map.querySelectorAll('[data-coverage-region-id]')).toHaveLength(5)
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '/knowledge/earth?topic=earth-zones',
    )
  })

  it('redirects legacy earth-line URLs and renders sourced line details', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={[
          '/knowledge/earth?topic=earth-zones&line=tropic-of-cancer',
        ]}
      >
        <Routes>
          <Route path="/knowledge/earth" element={<KnowledgeEarthPage />} />
          <Route
            path="/knowledge/earth/lines/:lineId"
            element={<KnowledgeEarthLineDetailPage />}
          />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText('北回归线经纬线详情')).toBeVisible()
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '/knowledge/earth/lines/tropic-of-cancer',
    )
    expect(screen.getAllByText('Tropic of Cancer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('23.5°N').length).toBeGreaterThan(0)
    expect(screen.getByText(/热带与北温带/)).toBeVisible()
    expect(screen.getByText('核心规则')).toBeVisible()
    expect(screen.getByText('容易混淆')).toBeVisible()
    expect(screen.getByText('判读示例')).toBeVisible()
    expect(screen.queryByText('资料来源')).toBeNull()
    expect(
      screen.getByRole('link', { name: /在3D地球上查看/ }),
    ).toHaveAttribute(
      'href',
      '/explore?geography=earth-zones&line=tropic-of-cancer',
    )
    expect(screen.queryByLabelText('知识主题')).toBeNull()
    expect(
      within(screen.getByLabelText('五带分界线同组经纬线')).getAllByRole(
        'link',
      ),
    ).toHaveLength(4)
    expect(
      screen.getByRole('link', { name: /北回归线.*23.5°N/ }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen
        .getByTestId('knowledge-earth-map')
        .querySelectorAll('.knowledge-earth-reference-label'),
    ).toHaveLength(4)
    const detailMap = screen.getByTestId('knowledge-earth-map')
    expect(detailMap.querySelector('.is-selected')).toBeNull()
    expect(
      detailMap.querySelectorAll('[data-coverage-region-id]'),
    ).toHaveLength(5)
    expect(
      new Set(
        Array.from(
          detailMap.querySelectorAll(
            '.is-topic-line .knowledge-earth-reference-visible',
          ),
        ).map((item) => item.getAttribute('stroke-width')),
      ),
    ).toEqual(new Set(['1.8']))

    await user.click(
      screen.getByRole('link', { name: /南极圈.*66.5°S.*Antarctic Circle/ }),
    )
    expect(await screen.findByLabelText('南极圈经纬线详情')).toBeVisible()
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '/knowledge/earth/lines/antarctic-circle',
    )
    expect(screen.getAllByText('Antarctic Circle').length).toBeGreaterThan(0)
  })

  it('falls back from invalid earth and line routes', () => {
    render(
      <MemoryRouter initialEntries={['/knowledge/earth/lines/unknown']}>
        <Routes>
          <Route path="/knowledge/earth" element={<KnowledgeEarthPage />} />
          <Route
            path="/knowledge/earth/lines/:lineId"
            element={<KnowledgeEarthLineDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('tab', { name: '经度基准' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(screen.getByLabelText('重点经纬线')).getAllByRole('link'),
    ).toHaveLength(2)
  })

  it('combines country card fields, opens inline detail, and follows cross-region neighbours', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/knowledge/countries/east-asia']}>
        <Routes>
          <Route
            path="/knowledge/countries/:regionId"
            element={<KnowledgeRegionPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '东亚5国', level: 1 }),
    ).toBeVisible()
    const regionHeader = document.querySelector<HTMLElement>(
      '.knowledge-region-page-header',
    )!
    expect(
      regionHeader.style.getPropertyValue('--knowledge-region-title-accent'),
    ).toBe('#4cc9f0')
    expect(within(regionHeader).getByText('5').tagName).toBe('STRONG')
    expect(
      document
        .querySelector<HTMLElement>('.knowledge-country-grid')!
        .style.getPropertyValue('--knowledge-country-columns-detail'),
    ).toBe('5')
    expect(screen.getByRole('link', { name: '← 返回亚洲' })).toHaveAttribute(
      'href',
      '/knowledge?continent=asia',
    )
    const regionMap = document.querySelector<HTMLElement>(
      '.knowledge-region-map-strip',
    )!
    expect(within(regionMap).queryByRole('link')).toBeNull()
    expect(within(regionMap).queryByText('WORLD POSITION')).toBeNull()
    expect(document.querySelector('.knowledge-region-map-actions')).toBeNull()
    expect(screen.queryByTestId('knowledge-region-best-score')).toBeNull()
    expect(screen.queryByRole('link', { name: '开始区域挑战' })).toBeNull()
    expect(screen.queryByText('Asia · COUNTRY KNOWLEDGE')).toBeNull()
    expect(
      screen.getByText('位于亚洲东部，季风影响显著，人口与城市密集。'),
    ).toBeVisible()
    expect(screen.getByLabelText('东亚区域知识')).toBeVisible()
    expect(screen.getByText('亚洲 · 区域知识')).toBeVisible()
    expect(screen.getByText('自然地理')).toBeVisible()
    expect(screen.getByText('人文地理')).toBeVisible()
    expect(screen.getByText('学习要点')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '关闭东亚区域知识' }),
    ).toBeNull()
    expect(
      screen.getAllByRole('button', { name: /查看.*国家详情/ }),
    ).toHaveLength(5)
    await waitFor(() => expect(getMapCountryPath('CN')).toBeInTheDocument())
    expect(document.querySelectorAll('path.is-region')).toHaveLength(5)
    expect(document.querySelectorAll('path.is-continent')).toHaveLength(0)
    expect(getMapCountryPath('CN')).toHaveClass('is-region')
    expect(getMapCountryPath('JP')).toHaveClass('is-region')
    expect(getMapCountryPath('IN')).not.toHaveClass('is-region')
    expect(screen.queryByText('逐国学习')).toBeNull()
    expect(screen.queryByText('观察国旗，猜一猜首都')).toBeNull()
    expect(screen.queryByRole('button', { name: '揭晓首都' })).toBeNull()

    const chinaCard = screen
      .getByRole('button', { name: '查看中国国家详情' })
      .closest('article')!
    const displayControls = screen.getByRole('group', {
      name: '国家卡显示内容',
    })
    const countryControl = within(displayControls).getByRole('button', {
      name: '国家',
    })
    const flagControl = within(displayControls).getByRole('button', {
      name: '国旗',
    })
    const capitalControl = within(displayControls).getByRole('button', {
      name: '首都',
    })

    expect(
      within(displayControls)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['国旗', '国家', '首都'])
    expect(countryControl).toHaveAttribute('aria-pressed', 'false')
    expect(flagControl).toHaveAttribute('aria-pressed', 'true')
    expect(flagControl).toBeDisabled()
    expect(capitalControl).toHaveAttribute('aria-pressed', 'false')
    const chinaFlag = within(chinaCard).getByRole('img', {
      name: '中国国旗',
    })
    expect(chinaFlag).toHaveClass('country-flag-image')
    expect(chinaFlag.parentElement).toHaveClass('country-flag-frame')
    expect(within(chinaCard).queryByText('中国')).toBeNull()
    expect(within(chinaCard).queryByText('北京')).toBeNull()

    await user.click(capitalControl)
    const capitalField = within(chinaCard)
      .getByText('北京')
      .closest('.knowledge-country-card-capital') as HTMLElement
    expect(capitalField).not.toBeNull()
    expect(within(capitalField).getByText('北京').tagName).toBe('STRONG')
    expect(within(capitalField).getByText('Beijing').tagName).toBe('SMALL')
    expect(within(capitalField).queryByText('首都')).toBeNull()
    expect(
      Array.from(capitalField.children).map((item) => item.tagName),
    ).toEqual(['STRONG', 'SMALL'])
    expect(flagControl).not.toBeDisabled()
    await user.click(countryControl)
    expect(chinaCard).toHaveTextContent('中国')
    expect(chinaCard).toHaveTextContent('China')
    const countryCardFields = Array.from(
      chinaCard.querySelector('.knowledge-country-open')!.children,
    )
    expect(countryCardFields).toHaveLength(3)
    expect(countryCardFields[0]).toHaveClass('country-flag-frame')
    expect(countryCardFields[1]).toHaveClass('knowledge-country-name')
    expect(countryCardFields[2]).toHaveClass('knowledge-country-card-capital')

    await user.click(flagControl)
    expect(within(chinaCard).queryByRole('img')).toBeNull()
    expect(
      Array.from(
        chinaCard.querySelector('.knowledge-country-open')!.children,
      ).map((field) => field.className),
    ).toEqual(['knowledge-country-name', 'knowledge-country-card-capital'])
    await user.click(countryControl)
    expect(within(chinaCard).queryByText('中国')).toBeNull()
    expect(capitalControl).toBeDisabled()
    expect(
      chinaCard.querySelector('.knowledge-country-open')!.children,
    ).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '查看中国国家详情' }))
    expect(screen.queryByLabelText('东亚区域知识')).toBeNull()
    expect(screen.getByLabelText('中国国家学习详情')).toBeVisible()
    expect(screen.getByText(/中华人民共和国/)).toBeVisible()
    expect(screen.queryByText('2025 年')).toBeNull()
    expect(screen.getByText('人民币')).toBeVisible()
    expect(screen.getByText(/CNY/)).toBeVisible()
    expect(screen.queryByText('次区域')).toBeNull()
    expect(screen.queryByText('Eastern Asia')).toBeNull()
    expect(screen.queryByRole('button', { name: '探索城市北京' })).toBeNull()
    expect(
      screen.getByRole('link', { name: /在3D地球上查看/ }),
    ).toHaveAttribute('href', '/explore?country=CN')
    expect(document.querySelectorAll('path.is-country')).toHaveLength(1)
    expect(document.querySelectorAll('path.is-region')).toHaveLength(4)
    expect(getMapCountryPath('CN')).toHaveClass('is-country')
    expect(getMapCountryPath('JP')).toHaveClass('is-region')
    expect(
      screen.queryByRole('button', { name: '关闭国家学习详情' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '探索邻国阿富汗' }))
    expect(
      screen.getByRole('heading', { name: '南亚9国', level: 1 }),
    ).toBeVisible()
    expect(screen.getByLabelText('阿富汗国家学习详情')).toBeVisible()
    expect(document.querySelectorAll('path.is-country')).toHaveLength(1)
    expect(getMapCountryPath('AF')).toHaveClass('is-country')
    expect(getMapCountryPath('IN')).toHaveClass('is-region')
    expect(getMapCountryPath('CN')).not.toHaveClass('is-region')
  })

  it('matches small-region grid columns to the number of countries', () => {
    render(
      <MemoryRouter initialEntries={['/knowledge/countries/east-europe']}>
        <Routes>
          <Route
            path="/knowledge/countries/:regionId"
            element={<KnowledgeRegionPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    const grid = document.querySelector<HTMLElement>('.knowledge-country-grid')
    expect(grid).not.toBeNull()
    expect(
      grid!.style.getPropertyValue('--knowledge-country-columns-wide'),
    ).toBe('4')
    expect(
      grid!.style.getPropertyValue('--knowledge-country-columns-detail'),
    ).toBe('4')
    expect(
      grid!.style.getPropertyValue('--knowledge-country-columns-tablet'),
    ).toBe('3')
    expect(
      grid!.style.getPropertyValue('--knowledge-country-columns-compact'),
    ).toBe('2')
  })

  it('keeps multiple capital translations in matching display order', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/knowledge/countries/southern-africa']}>
        <Routes>
          <Route
            path="/knowledge/countries/:regionId"
            element={<KnowledgeRegionPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: '首都' }))
    const southAfricaCard = screen
      .getByRole('button', { name: '查看南非国家详情' })
      .closest('article')!
    const capitalField = southAfricaCard.querySelector<HTMLElement>(
      '.knowledge-country-card-capital',
    )!

    expect(
      within(capitalField).getByText('比勒陀利亚、布隆方丹、开普敦'),
    ).toBeVisible()
    expect(
      within(capitalField).getByText('Pretoria / Bloemfontein / Cape Town'),
    ).toBeVisible()
  })
})
