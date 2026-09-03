import { expect, test } from '@playwright/test'

const viewports = [
  { name: '1440 desktop', width: 1440, height: 900 },
  { name: 'iPad landscape', width: 1194, height: 834 },
  { name: 'phone landscape', width: 844, height: 390 },
]

const pages = [
  {
    name: 'earth',
    topic: '地球经纬',
    url: '/knowledge/earth?topic=grid-reading',
    tabs: '地球经纬线用途',
  },
  {
    name: 'countries',
    topic: '国家首都',
    url: '/knowledge/countries?continent=asia',
    tabs: '大洲',
  },
  {
    name: 'extremes',
    topic: '世界之最',
    url: '/knowledge/extremes?category=country-scale',
    tabs: '世界之最类别',
  },
  {
    name: 'water',
    topic: '江河湖海',
    url: '/knowledge/water?layer=ocean',
    tabs: '水域图层',
  },
]

for (const viewport of viewports) {
  test(`keeps all four knowledge overviews visually identical on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    const measurements: Array<{
      name: string
      map: { width: number; height: number }
      tabs: {
        height: number
        background: string
        underline: string
        flexGrow: string
        flexBasis: string
        minWidth: string
      }
      card: { height: number; radius: string; leftBorder: string }
    }> = []

    for (const definition of pages) {
      await page.goto(definition.url)
      await expect(page.locator('.knowledge-topic-card')).toHaveCount(0)

      const knowledgeNavigation = page.getByRole('link', {
        name: '图鉴',
      })
      await expect(knowledgeNavigation).toHaveClass(/is-active/)
      await expect(
        page.getByRole('navigation', { name: '知识二级菜单' }),
      ).toHaveCount(0)

      const tablist = page.getByRole('tablist', { name: definition.tabs })
      const activeTab = tablist.locator('[aria-selected="true"]')
      const tabs = await activeTab.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        background: getComputedStyle(element).backgroundColor,
        underline: getComputedStyle(element, '::after').backgroundColor,
        flexGrow: getComputedStyle(element).flexGrow,
        flexBasis: getComputedStyle(element).flexBasis,
        minWidth: getComputedStyle(element).minWidth,
      }))
      expect(tabs.background).toBe('rgba(0, 0, 0, 0)')
      expect(tabs.underline).toBe('rgb(121, 200, 212)')
      expect(tabs.flexGrow).toBe('0')
      expect(tabs.flexBasis).toBe('auto')
      expect(tabs.minWidth).toBe('max-content')

      const [controlsBox, mapBox] = await Promise.all([
        page.locator('.knowledge-map-workbench-controls').boundingBox(),
        page.locator('.knowledge-map-card').boundingBox(),
      ])
      const categoryCards = page.locator('.knowledge-category-grid')
      const firstCard = categoryCards.getByRole('link').first()
      const card = await firstCard.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        radius: getComputedStyle(element).borderRadius,
        leftBorder: getComputedStyle(element).borderLeftWidth,
      }))
      expect(controlsBox).not.toBeNull()
      expect(mapBox).not.toBeNull()
      expect(controlsBox!.width).toBeGreaterThanOrEqual(mapBox!.width)
      expect(controlsBox!.y + controlsBox!.height).toBeLessThanOrEqual(
        mapBox!.y,
      )
      expect(mapBox!.width / mapBox!.height).toBeCloseTo(36 / 17, 1)
      await expectNoPageScroll(page)
      measurements.push({
        name: definition.name,
        map: { width: mapBox!.width, height: mapBox!.height },
        tabs,
        card,
      })
    }

    expectSpreadWithin(
      measurements.map((item) => item.map.width),
      1,
    )
    expectSpreadWithin(
      measurements.map((item) => item.map.height),
      1,
    )
    expectSpreadWithin(
      measurements.map((item) => item.tabs.height),
      1,
    )
    expectSpreadWithin(
      measurements.map((item) => item.card.height),
      1,
    )
    expect(new Set(measurements.map((item) => item.card.radius))).toEqual(
      new Set(['6px']),
    )
    expect(new Set(measurements.map((item) => item.card.leftBorder))).toEqual(
      new Set(['3px']),
    )
  })
}

const detailPages = [
  {
    name: 'country',
    mode: 'flow',
    url: '/knowledge/countries/east-asia?country=CN',
    detailLabel: '中国国家学习详情',
  },
  {
    name: 'earth line',
    mode: 'flow',
    url: '/knowledge/earth/lines/equator',
    detailLabel: '赤道经纬线详情',
  },
  {
    name: 'water object',
    mode: 'fixed-workbench',
    url: '/knowledge/water/groups/ocean-seas?object=mediterranean-sea',
    detailLabel: '地中海海详情',
  },
  {
    name: 'world extreme',
    mode: 'fixed-workbench',
    url: '/knowledge/extremes/metrics/highest-peak?entry=mount-everest',
    detailLabel: '珠穆朗玛峰世界之最详情',
  },
] as const

for (const viewport of viewports) {
  test(`keeps all knowledge detail layouts aligned on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    const detailWidths: number[] = []

    for (const definition of detailPages) {
      await page.goto(definition.url)
      const shell = page.locator('.knowledge-detail-layout')
      const study = page.locator('.knowledge-detail-study')
      const detail = page.getByLabel(definition.detailLabel)
      await expect(shell).toBeVisible()
      await expect(shell).toHaveAttribute(
        'data-page-scroll',
        definition.mode === 'fixed-workbench' ? 'locked' : 'auto',
      )
      await expect(study).toBeVisible()
      await expect(detail).toBeVisible()
      await expect
        .poll(() =>
          detail.evaluate((element) =>
            element
              .getAnimations()
              .every((animation) => animation.playState === 'finished'),
          ),
        )
        .toBe(true)

      const [shellBox, studyBox, detailBox] = await Promise.all([
        shell.boundingBox(),
        study.boundingBox(),
        detail.boundingBox(),
      ])
      expect(shellBox).not.toBeNull()
      expect(studyBox).not.toBeNull()
      expect(detailBox).not.toBeNull()
      expect(studyBox!.x + studyBox!.width).toBeLessThanOrEqual(
        detailBox!.x + 1,
      )
      expect(detailBox!.x + detailBox!.width).toBeLessThanOrEqual(
        viewport.width + 1,
      )
      detailWidths.push(detailBox!.width)

      if (definition.mode === 'fixed-workbench') {
        await expect(shell).toHaveClass(/is-fixed-workbench/)
        await expectNoPageScroll(page)
      } else {
        await expect(shell).not.toHaveClass(/is-fixed-workbench/)
      }
      await expectNoRootOverflow(page)
    }

    expectSpreadWithin(detailWidths, 1)
  })
}

function expectSpreadWithin(values: number[], tolerance: number) {
  expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(
    tolerance,
  )
}

async function expectNoPageScroll(page: import('@playwright/test').Page) {
  const scroll = await page.locator('main').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }))
  expect(scroll.scrollHeight).toBeLessThanOrEqual(scroll.clientHeight)
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - innerWidth,
    root: document.documentElement.scrollWidth - innerWidth,
  }))
  expect(overflow.body).toBeLessThanOrEqual(0)
  expect(overflow.root).toBeLessThanOrEqual(0)
}

async function expectNoRootOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - innerWidth,
    root: document.documentElement.scrollWidth - innerWidth,
  }))
  expect(overflow.body).toBeLessThanOrEqual(0)
  expect(overflow.root).toBeLessThanOrEqual(0)
}
