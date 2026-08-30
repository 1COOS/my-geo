import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

async function openCountrySearch(page: Page) {
  const trigger = page.getByRole('button', { name: '搜索地点' })
  await trigger.click()
  const search = page.getByRole('combobox', { name: '搜索地点' })
  await expect(search).toBeFocused()
  return search
}

async function waitForKnowledgeCardSettled(card: Locator) {
  await expect
    .poll(() =>
      card.evaluate((element) =>
        element
          .getAnimations()
          .every((animation) => animation.playState === 'finished'),
      ),
    )
    .toBe(true)
}

async function expectFramedFlag(
  frame: Locator,
  expectedNaturalAspectRatio?: number,
) {
  await expect(frame).toBeVisible()
  const metrics = await frame.evaluate((element) => {
    const image = element.querySelector('img')
    if (!image) throw new Error('Flag frame is missing its image')
    const frameBox = element.getBoundingClientRect()
    const imageBox = image.getBoundingClientRect()
    const style = getComputedStyle(image)
    const ratioFallbackStyle = getComputedStyle(element, '::before')
    return {
      fallbackContent: ratioFallbackStyle.content,
      fallbackHeight: Number.parseFloat(ratioFallbackStyle.paddingTop),
      frameLayoutWidth: element.clientWidth,
      frameAspectRatio: frameBox.width / frameBox.height,
      frameHeight: frameBox.height,
      frameWidth: frameBox.width,
      imageAspectRatio: imageBox.width / imageBox.height,
      imageHeight: imageBox.height,
      imageWidth: imageBox.width,
      centerDeltaX: Math.abs(
        imageBox.x + imageBox.width / 2 - (frameBox.x + frameBox.width / 2),
      ),
      centerDeltaY: Math.abs(
        imageBox.y + imageBox.height / 2 - (frameBox.y + frameBox.height / 2),
      ),
      naturalAspectRatio: image.naturalWidth / image.naturalHeight,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      borderRightWidth: style.borderRightWidth,
      borderTopWidth: style.borderTopWidth,
      boxShadow: style.boxShadow,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
    }
  })

  expect(metrics.fallbackContent).not.toBe('none')
  expect(
    Math.abs(metrics.fallbackHeight - metrics.frameLayoutWidth * (2 / 3)),
  ).toBeLessThan(1)
  expect(metrics.frameAspectRatio).toBeCloseTo(3 / 2, 2)
  expect(metrics.frameHeight).toBeGreaterThan(1)
  expect(metrics.imageAspectRatio).toBeCloseTo(metrics.naturalAspectRatio, 2)
  expect(metrics.imageWidth).toBeLessThanOrEqual(metrics.frameWidth + 0.5)
  expect(metrics.imageHeight).toBeLessThanOrEqual(metrics.frameHeight + 0.5)
  expect(
    Math.max(
      metrics.imageWidth / metrics.frameWidth,
      metrics.imageHeight / metrics.frameHeight,
    ),
  ).toBeGreaterThan(0.95)
  expect(metrics.centerDeltaX).toBeLessThanOrEqual(0.75)
  expect(metrics.centerDeltaY).toBeLessThanOrEqual(0.75)
  expect(metrics.borderBottomWidth).toBe('0px')
  expect(metrics.borderLeftWidth).toBe('0px')
  expect(metrics.borderRightWidth).toBe('0px')
  expect(metrics.borderTopWidth).toBe('0px')
  expect(metrics.boxShadow).not.toBe('none')
  expect(metrics.boxShadow).toContain('rgba(244, 248, 248, 0.76)')
  expect(metrics.boxShadow).toContain('rgba(0, 0, 0, 0.52)')
  expect(metrics.objectFit).toBe('contain')
  expect(metrics.objectPosition).toBe('50% 50%')
  if (expectedNaturalAspectRatio !== undefined) {
    expect(metrics.naturalAspectRatio).toBeCloseTo(
      expectedNaturalAspectRatio,
      2,
    )
  }
}

async function waitForSceneOrFallback(page: Page) {
  const scene = page.getByTestId('globe-scene')
  const fallback = page.getByTestId('webgl-fallback')
  await expect(scene.or(fallback)).toBeVisible({ timeout: 15_000 })
  return { scene, fallback }
}

async function installFullscreenApiMock(page: Page) {
  await page.addInitScript(() => {
    let fullscreenElement: Element | null = null
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    })
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value() {
        fullscreenElement = document.documentElement
        document.dispatchEvent(new Event('fullscreenchange'))
        return Promise.resolve()
      },
    })
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value() {
        fullscreenElement = null
        document.dispatchEvent(new Event('fullscreenchange'))
        return Promise.resolve()
      },
    })
  })
}

async function selectPlace(page: Page, query: string) {
  const search = await openCountrySearch(page)
  await search.fill(query)
  await search.press('Enter')
}

async function expectSelectedLinearFeatureRoute(
  page: Page,
  featureId: string,
  labelName: string,
) {
  const overlay = page.getByTestId('selected-linear-feature-overlay')
  const route = page.getByTestId('selected-linear-feature-route')
  const start = page.getByTestId('selected-linear-feature-start')
  const end = page.getByTestId('selected-linear-feature-end')
  const label = page.locator(
    `[data-linear-feature-id="${featureId}"].linear-feature-label`,
  )

  await expect(overlay).toHaveAttribute('data-linear-feature-id', featureId)
  await expect(overlay).toBeVisible()
  await expect(route).toHaveAttribute('d', /M[-\d.]+,[-\d.]+ L/)
  await expect(route).toHaveCSS('stroke-width', /^(8|9)px$/)
  await expect(start).toHaveAttribute('cx', /\d/)
  await expect(start).toHaveAttribute('cy', /\d/)
  await expect(end).toHaveAttribute('points', /\d/)
  await expect(label).toBeVisible()
  await expect(label).toHaveText(labelName)

  const [routeBox, labelBox] = await Promise.all([
    route.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return { x: box.x, y: box.y, width: box.width, height: box.height }
    }),
    label.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return { x: box.x, y: box.y, width: box.width, height: box.height }
    }),
  ])
  expect(Math.max(routeBox.width, routeBox.height)).toBeGreaterThan(0.5)
  const routeCenter = {
    x: routeBox.x + routeBox.width / 2,
    y: routeBox.y + routeBox.height / 2,
  }
  expect(
    routeCenter.x >= labelBox.x &&
      routeCenter.x <= labelBox.x + labelBox.width &&
      routeCenter.y >= labelBox.y &&
      routeCenter.y <= labelBox.y + labelBox.height,
  ).toBe(false)
}

async function expectSelectedMountainRoute(
  page: Page,
  rangeId: string,
  labelName: string,
) {
  const overlay = page.getByTestId('selected-mountain-overlay')
  const route = page.getByTestId('selected-mountain-route')
  const peak = page.getByTestId('selected-mountain-peak')
  const label = page.locator(`[data-map-label-id="${rangeId}"]`)

  await expect(overlay).toHaveAttribute('data-mountain-range-id', rangeId)
  await expect(overlay).toHaveAttribute('data-mountain-detail', 'high')
  await expect(overlay).toBeVisible()
  await expect(route).toHaveAttribute('d', /M[-\d.]+,[-\d.]+ L/)
  await expect(peak).toBeVisible()
  await expect(label).toBeVisible()
  await expect(label).toHaveText(labelName)
}

async function expectLayerToolbarSingleLine(page: Page) {
  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const layout = await layerControl.evaluate((element) => {
    const options = element.querySelector<HTMLElement>(
      '.layer-control-options',
    )!
    const buttonTops = Array.from(
      options.querySelectorAll<HTMLButtonElement>('button'),
      (button) => button.getBoundingClientRect().top,
    )
    return {
      clientWidth: options.clientWidth,
      scrollWidth: options.scrollWidth,
      buttonCount: buttonTops.length,
      rowSpread: Math.max(...buttonTops) - Math.min(...buttonTops),
    }
  })
  expect(layout.buttonCount).toBe(11)
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1)
  expect(layout.rowSpread).toBeLessThan(2)
}

function parseMiniMapTransform(transform: string | null) {
  const match = transform?.match(/translate\(([-\d.]+)(?:\s|,)\s*([-\d.]+)\)/)
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null
}

async function readMapHighlightStyle(page: Page, selector: string) {
  const target = page.locator(selector).first()
  await expect(target).toBeAttached({ timeout: 15_000 })
  return target.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      filter: style.filter,
    }
  })
}

test('loads the responsive My Geo exploration shell', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '转动地球，发现每一片土地' }),
  ).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'My Geo 首页' })).toHaveCount(0)
  await expect(page.getByText('MY GEO · EARTH EXPLORATION LAB')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '搜索地点' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: '搜索地点' })).toHaveCount(0)

  const { scene } = await waitForSceneOrFallback(page)

  if (await scene.isVisible()) {
    await expect(page.getByTestId('world-mini-map')).toBeVisible()
    await expect(
      page.locator(
        '.world-mini-map-landmasses [data-landmass-id="antarctica"]',
      ),
    ).toHaveCount(1)
    await expect(page.locator('[data-country-code="AQ"]')).toHaveCount(0)
    const layerControl = page.getByRole('region', { name: '地球图层控制' })
    const capitals = layerControl.getByRole('button', { name: '首都' })
    const cities = layerControl.getByRole('button', { name: '城市' })
    const rivers = layerControl.getByRole('button', {
      name: '河流图层：世界重要河流与人工运河',
    })
    const mountains = layerControl.getByRole('button', {
      name: '山脉图层：世界著名山脉与最高峰',
    })
    await expect(layerControl).toBeVisible()
    await expect(capitals).toHaveAttribute('aria-pressed', 'false')
    await expect(cities).toHaveAttribute('aria-pressed', 'false')
    await expect(rivers).toHaveAttribute('aria-pressed', 'false')
    await expect(
      layerControl.getByRole('button', { name: '运河图层：重要人工运河' }),
    ).toHaveCount(0)
    await expect(mountains).toHaveAttribute('aria-pressed', 'false')
    await expect(
      page.getByRole('navigation', { name: '地球显示控制' }),
    ).toBeVisible()
    await page.getByRole('button', { name: '自动旋转：开' }).click()
    await expect(
      page.getByRole('button', { name: '自动旋转：关' }),
    ).toBeVisible()
    await page.getByRole('button', { name: '重置视角' }).click()
  }
})

test('switches between exploration and knowledge without scene teardown errors', async ({
  page,
}) => {
  test.setTimeout(60_000)
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  const { scene, fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return
  await expect(scene).toBeVisible()

  const knowledgeLink = page.getByRole('link', { name: '知识体系' })
  const exploreLink = page.getByRole('link', { name: '探索地球' })
  await knowledgeLink.click()
  await expect(
    page.getByRole('heading', { name: '国家首都', level: 1 }),
  ).toBeVisible()

  await exploreLink.click()
  await waitForSceneOrFallback(page)
  await expect(page.getByTestId('globe-scene')).toBeVisible()

  await knowledgeLink.click()
  await expect(
    page.getByRole('heading', { name: '国家首都', level: 1 }),
  ).toBeVisible()

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('navigates the country knowledge atlas and deep-links back to the globe', async ({
  page,
}) => {
  await page.goto('/knowledge')

  await expect(
    page.getByRole('heading', { name: '国家首都', level: 1 }),
  ).toBeVisible()
  await expect(page.getByTestId('knowledge-region-east-asia')).toContainText(
    '5 国',
  )
  await page.getByTestId('knowledge-region-east-asia').click()

  await expect(
    page.getByRole('heading', { name: '东亚', level: 1 }),
  ).toBeVisible()
  const knowledgeMap = page.locator('.knowledge-region-map')
  await expect(
    knowledgeMap.locator('[data-landmass-id="antarctica"]'),
  ).toHaveCount(1)
  await expect(knowledgeMap.locator('path.is-region')).toHaveCount(5)
  await expect(knowledgeMap.locator('path.is-continent')).toHaveCount(0)
  const chinaCard = page
    .getByRole('button', { name: '查看中国国家详情' })
    .locator('..')
  const displayControls = page.getByRole('group', {
    name: '国家卡显示内容',
  })
  await expect(
    displayControls.getByRole('button', { name: '国旗' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(chinaCard.getByText('中国', { exact: true })).toHaveCount(0)
  await displayControls.getByRole('button', { name: '国家' }).click()
  await displayControls.getByRole('button', { name: '首都' }).click()
  await expect(chinaCard).toContainText('中国')
  await expect(chinaCard).toContainText('北京')

  await page.getByRole('button', { name: '查看中国国家详情' }).click()
  await expect(knowledgeMap.locator('path.is-country')).toHaveCount(1)
  await expect(
    knowledgeMap.locator('path[data-country-code="CN"].is-country'),
  ).toHaveCount(1)
  await expect(knowledgeMap.locator('path.is-region')).toHaveCount(4)
  const detail = page.getByLabel('中国国家学习详情')
  await expect(detail).toBeVisible()
  await detail.getByRole('link', { name: /在3D地球上查看/ }).click()
  await expect(page).toHaveURL(/\/explore\?country=CN$/)
  await waitForSceneOrFallback(page)
  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
})

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900, touch: false },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
]) {
  test(`keeps native flag proportions inside 3:2 slots on ${viewport.name}`, async ({
    page,
  }) => {
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })

    for (const flagCase of [
      {
        route: '/knowledge/countries/west-europe',
        alt: '德国国旗',
        naturalAspectRatio: 5 / 3,
      },
      {
        route: '/knowledge/countries/west-europe',
        alt: '瑞士国旗',
        naturalAspectRatio: 1,
      },
      {
        route: '/knowledge/countries/west-asia',
        alt: '卡塔尔国旗',
        naturalAspectRatio: 28 / 11,
      },
      {
        route: '/knowledge/countries/south-asia',
        alt: '尼泊尔国旗',
        naturalAspectRatio: 71.571 / 87.246,
      },
    ]) {
      await page.goto(flagCase.route)
      await expectFramedFlag(
        page.getByAltText(flagCase.alt).locator('..'),
        flagCase.naturalAspectRatio,
      )
    }
  })
}

test('resets scroll and keeps the result card visible on phone landscape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/questions/asia/easy')

  for (let index = 0; index < 10; index += 1) {
    await page.locator('.knowledge-question-option').first().click()
    if (index === 9) {
      await page
        .locator('.knowledge-challenge-shell')
        .evaluate((shell) => (shell.scrollTop = 100))
    }
    await page
      .getByRole('button', {
        name: index === 9 ? '查看成绩' : '下一题',
      })
      .click()
  }

  const geometry = await page
    .locator('.knowledge-challenge-result')
    .evaluate((result) => {
      const rect = result.getBoundingClientRect()
      const shell = result.closest('.knowledge-challenge-shell')!
      return {
        top: rect.top,
        bottom: rect.bottom,
        scrollTop: shell.scrollTop,
        viewportHeight: document.documentElement.clientHeight,
      }
    })
  expect(geometry.scrollTop).toBe(0)
  expect(geometry.top).toBeGreaterThanOrEqual(0)
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1)
})

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900, touch: false },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
]) {
  test(`keeps earth learning interactive on ${viewport.name}`, async ({
    page,
  }) => {
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize(viewport)

    await page.goto('/knowledge/countries/east-asia?country=CN')
    const countryDetailMap = page.locator('.knowledge-region-map-strip')
    const countryDetailCard = page.getByLabel('中国国家学习详情')
    await expect(countryDetailMap).toBeVisible()
    await expect(countryDetailCard).toBeVisible()
    await waitForKnowledgeCardSettled(countryDetailCard)
    const [countryDetailMapBox, countryDetailCardBox] = await Promise.all([
      countryDetailMap.boundingBox(),
      countryDetailCard.boundingBox(),
    ])

    await page.goto('/knowledge')
    const countryMapCard = page.locator('.knowledge-map-card')
    await expect(
      countryMapCard.locator('.knowledge-region-map-countries path').first(),
    ).toBeVisible()
    const countryMapBox = await countryMapCard.boundingBox()

    await page.goto('/knowledge/earth?topic=hemispheres')

    await expect(
      page.getByRole('heading', { name: '地球经纬', level: 1 }),
    ).toBeVisible()
    await expect(page.locator('.knowledge-topic-card')).toHaveCount(4)
    await expect(
      page.getByRole('tab', { name: '半球界线', exact: true }),
    ).toHaveAttribute('aria-selected', 'true')
    const referenceLines = page.getByLabel('重点经纬线')
    await expect(referenceLines.getByRole('link')).toHaveCount(3)
    await expect(
      referenceLines.getByRole('link', { name: /赤道\s*0°/ }),
    ).toHaveAttribute('href', '/knowledge/earth/lines/equator')
    await expect(page.getByText('当前定位')).toHaveCount(0)
    await expect(page.getByLabel('当前位置判读')).toHaveCount(0)
    await expect(page.locator('.knowledge-earth-map-marker')).toHaveCount(0)
    const map = page.getByTestId('knowledge-earth-map')
    await expect(map).toBeVisible()
    await expect(
      map.locator('.knowledge-earth-map-reference-lines > .is-topic-line'),
    ).toHaveCount(3)
    await expect(
      map.locator('.knowledge-earth-map-reference-lines > .is-background-line'),
    ).toHaveCount(10)
    await expect(map.locator('.knowledge-earth-reference-label')).toHaveCount(3)
    const coverageRegions = map.locator('[data-coverage-region-id]')
    await expect(coverageRegions).toHaveCount(2)
    await expect(
      map.locator(
        '[data-coverage-region-id="western-hemisphere"] .knowledge-earth-coverage-area',
      ),
    ).toHaveCount(2)
    await expect(map.locator('.knowledge-earth-coverage-label')).toHaveCount(2)

    const coverageColorContract = await coverageRegions.evaluateAll((regions) =>
      regions.every((region) => {
        const area = region.querySelector('.knowledge-earth-coverage-area')
        const label = region.querySelector('.knowledge-earth-coverage-label')
        if (!area || !label) return false
        return (
          getComputedStyle(area).fill === getComputedStyle(label).fill &&
          getComputedStyle(area).fillOpacity === '0.12'
        )
      }),
    )
    expect(coverageColorContract).toBe(true)

    const lineWidths = await map
      .locator('.knowledge-earth-reference-visible')
      .evaluateAll((lines) =>
        Array.from(
          new Set(lines.map((line) => line.getAttribute('stroke-width'))),
        ).sort(),
      )
    expect(lineWidths).toEqual(['0.8', '1.8'])

    const currentTopicLine = map.locator('[data-reference-line-id="equator"]')
    await currentTopicLine.focus()
    await expect(currentTopicLine).toHaveCSS('outline-style', 'none')
    await expect(
      currentTopicLine.locator('.knowledge-earth-reference-visible'),
    ).toHaveCSS('stroke-width', '1.8px')

    const homepageColors = await Promise.all([
      map
        .locator('[data-reference-line-id="equator"]')
        .evaluate((element) =>
          getComputedStyle(element)
            .getPropertyValue('--knowledge-earth-line-color')
            .trim(),
        ),
      referenceLines
        .getByRole('link', { name: /赤道\s*0°/ })
        .evaluate((element) =>
          getComputedStyle(element)
            .getPropertyValue('--knowledge-earth-line-color')
            .trim(),
        ),
    ])
    expect(homepageColors).toEqual(['#62d9ff', '#62d9ff'])

    await map
      .locator('[data-reference-line-id="tropic-of-cancer"]')
      .press('Enter')
    await expect(
      page.getByRole('tab', { name: '五带界线', exact: true }),
    ).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/\/knowledge\/earth\?topic=earth-zones$/)
    await expect(referenceLines.getByRole('link')).toHaveCount(4)
    await expect(map.locator('.knowledge-earth-reference-label')).toHaveCount(4)
    await expect(coverageRegions).toHaveCount(5)

    const geometry = await page.evaluate(() => {
      const mapCard = document
        .querySelector('.knowledge-earth-map-card')!
        .getBoundingClientRect()
      const map = document
        .querySelector('.knowledge-earth-map')!
        .getBoundingClientRect()
      const lineButtons = Array.from(
        document.querySelectorAll('.knowledge-earth-reference-grid a'),
      ).map((button) => button.getBoundingClientRect())
      const labels = Array.from(
        document.querySelectorAll(
          '.knowledge-earth-reference-label, .knowledge-earth-coverage-label',
        ),
      ).map((label) => label.getBoundingClientRect())
      const tablist = document.querySelector('.knowledge-primary-tabs')!
      const tab = tablist.querySelector('button')!
      return {
        mapCard: {
          x: mapCard.x,
          y: mapCard.y,
          width: mapCard.width,
          height: mapCard.height,
        },
        map: { x: map.x, y: map.y, width: map.width, height: map.height },
        minLineButtonHeight: Math.min(
          ...lineButtons.map((button) => button.height),
        ),
        firstRowLineCount: lineButtons.filter(
          (button) => Math.abs(button.y - lineButtons[0].y) < 1,
        ).length,
        labelsInsideMap: labels.every(
          (label) =>
            label.x >= mapCard.x &&
            label.y >= mapCard.y &&
            label.right <= mapCard.right &&
            label.bottom <= mapCard.bottom,
        ),
        tablistBorderBottomWidth: getComputedStyle(tablist).borderBottomWidth,
        tabDisplay: getComputedStyle(tab).display,
        tabFontSize: getComputedStyle(tab.querySelector('strong')!).fontSize,
        pageOverflows:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      }
    })
    expect(countryMapBox).not.toBeNull()
    expect(geometry.mapCard.width).toBeCloseTo(countryMapBox!.width, 0)
    expect(geometry.mapCard.width / geometry.mapCard.height).toBeCloseTo(
      720 / 340,
      2,
    )
    expect(geometry.map.x).toBeCloseTo(geometry.mapCard.x + 1, 0)
    expect(geometry.map.y).toBeCloseTo(geometry.mapCard.y + 1, 0)
    expect(geometry.map.width).toBeCloseTo(geometry.mapCard.width - 2, 0)
    expect(geometry.map.height).toBeCloseTo(geometry.mapCard.height - 2, 0)
    expect(geometry.minLineButtonHeight).toBeGreaterThanOrEqual(
      viewport.height <= 520 ? 56 : 64,
    )
    expect(geometry.firstRowLineCount).toBe(4)
    expect(geometry.labelsInsideMap).toBe(true)
    expect(geometry.tablistBorderBottomWidth).toBe('0px')
    expect(geometry.tabDisplay).toBe('flex')
    expect(geometry.tabFontSize).toBe('15px')
    expect(geometry.pageOverflows).toBe(false)

    await referenceLines.getByRole('link', { name: '北回归线 23.5°N' }).click()
    await expect(page).toHaveURL(/\/knowledge\/earth\/lines\/tropic-of-cancer$/)
    const earthDetailMap = page.locator('.knowledge-earth-map-card')
    const earthDetailCard = page.getByRole('complementary', {
      name: '北回归线经纬线详情',
    })
    const siblingLines = page.getByLabel('五带分界线同组经纬线')
    await expect(earthDetailMap).toBeVisible()
    await expect(earthDetailCard).toBeVisible()
    await waitForKnowledgeCardSettled(earthDetailCard)
    await expect(page.getByLabel('知识主题')).toHaveCount(0)
    await expect(page.getByText('资料来源')).toHaveCount(0)
    await expect(
      earthDetailCard.getByRole('link', { name: /在3D地球上查看/ }),
    ).toHaveAttribute(
      'href',
      '/explore?geography=earth-zones&line=tropic-of-cancer',
    )
    await expect(page.getByRole('link', { name: '← 返回五带界线' })).toHaveCSS(
      'font-weight',
      '400',
    )
    await expect(siblingLines.getByRole('link')).toHaveCount(4)
    await expect(
      earthDetailMap.locator('[data-coverage-region-id]'),
    ).toHaveCount(5)
    await expect(earthDetailMap.locator('.is-selected')).toHaveCount(0)
    expect(
      await earthDetailMap
        .locator('.is-topic-line .knowledge-earth-reference-visible')
        .evaluateAll((lines) =>
          Array.from(
            new Set(lines.map((line) => line.getAttribute('stroke-width'))),
          ),
        ),
    ).toEqual(['1.8'])
    await expect(
      siblingLines.getByRole('link', { name: '北回归线 23.5°N' }),
    ).toHaveAttribute('aria-current', 'page')

    const [earthDetailMapBox, earthDetailCardBox, detailLayoutBefore] =
      await Promise.all([
        earthDetailMap.boundingBox(),
        earthDetailCard.boundingBox(),
        page.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll('.knowledge-earth-reference-grid a'),
          ).map((button) => button.getBoundingClientRect())
          return {
            firstRowLineCount: buttons.filter(
              (button) => Math.abs(button.y - buttons[0].y) < 1,
            ).length,
            pageOverflows:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
          }
        }),
      ])
    expect(countryDetailMapBox).not.toBeNull()
    expect(countryDetailCardBox).not.toBeNull()
    expect(earthDetailMapBox).not.toBeNull()
    expect(earthDetailCardBox).not.toBeNull()
    expect(earthDetailMapBox!.width).toBeCloseTo(countryDetailMapBox!.width, 0)
    expect(earthDetailMapBox!.width / earthDetailMapBox!.height).toBeCloseTo(
      720 / 340,
      2,
    )
    expect(earthDetailCardBox!.width).toBeCloseTo(
      countryDetailCardBox!.width,
      0,
    )
    expect(detailLayoutBefore.firstRowLineCount).toBe(4)
    expect(detailLayoutBefore.pageOverflows).toBe(false)

    await siblingLines.getByRole('link', { name: '南极圈 66.5°S' }).click()
    await expect(page).toHaveURL(/\/knowledge\/earth\/lines\/antarctic-circle$/)
    await expect(
      page.getByRole('complementary', { name: '南极圈经纬线详情' }),
    ).toBeVisible()
    const [earthDetailMapAfter, earthDetailCardAfter] = await Promise.all([
      earthDetailMap.boundingBox(),
      page
        .getByRole('complementary', { name: '南极圈经纬线详情' })
        .boundingBox(),
    ])
    expect(earthDetailMapAfter!.width).toBeCloseTo(earthDetailMapBox!.width, 0)
    expect(earthDetailCardAfter!.width).toBeCloseTo(
      earthDetailCardBox!.width,
      0,
    )
  })
}

test('redirects legacy earth-line URLs and rejects unknown line details', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/knowledge/earth?topic=earth-zones&line=tropic-of-cancer')
  await expect(page).toHaveURL(/\/knowledge\/earth\/lines\/tropic-of-cancer$/)
  await expect(
    page.getByRole('complementary', { name: '北回归线经纬线详情' }),
  ).toBeVisible()
  await expect(page.getByText('资料来源')).toHaveCount(0)
  await expect(
    page.locator(
      '.knowledge-earth-map-reference-lines [data-reference-line-id="tropic-of-cancer"]',
    ),
  ).toHaveClass(/is-topic-line/)
  await expect(
    page.locator('.knowledge-earth-map-reference-lines .is-selected'),
  ).toHaveCount(0)

  await page.goto('/knowledge/earth/lines/unknown')
  await expect(page).toHaveURL(/\/knowledge\/earth$/)
  await expect(
    page.getByRole('tab', { name: '经度基准', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
})

test('uses the contained flag contract across learning and exploration surfaces', async ({
  page,
}) => {
  await page.goto('/knowledge/countries/east-asia')
  await expectFramedFlag(page.getByAltText('中国国旗').locator('..'))

  await page.getByRole('button', { name: '查看中国国家详情' }).click()
  await expectFramedFlag(
    page.locator('.country-knowledge-card .knowledge-country-detail-flag'),
  )
  await expectFramedFlag(
    page
      .locator('.country-knowledge-card .country-border-list')
      .locator('.country-flag-frame')
      .first(),
  )

  await page.goto('/questions/asia/easy')
  await expectFramedFlag(page.locator('.knowledge-question-flag'))
  await page.locator('.knowledge-question-options button').first().click()
  await page.getByRole('button', { name: '下一题' }).click()
  await expectFramedFlag(
    page.locator('.knowledge-question-options .country-flag-frame').first(),
  )

  await page.goto('/explore?country=CH')
  await waitForSceneOrFallback(page)
  await expectFramedFlag(page.locator('.knowledge-country-detail-flag'))
  await expectFramedFlag(
    page.locator('.country-border-list .country-flag-frame').first(),
  )

  const search = await openCountrySearch(page)
  await search.fill('卡塔尔')
  await expectFramedFlag(
    page.locator('.country-search-popover .country-flag-frame').first(),
    28 / 11,
  )

  await search.fill('撒哈拉沙漠')
  await search.press('Enter')
  const desertCard = page.getByRole('complementary', {
    name: '撒哈拉沙漠知识卡',
  })
  await expect(desertCard).toBeVisible()
  await expectFramedFlag(
    desertCard.locator('.country-border-list .country-flag-frame').first(),
  )
})

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900, touch: false },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
  { name: 'small landscape', width: 667, height: 375, touch: true },
]) {
  test(`keeps country knowledge cards identical on ${viewport.name}`, async ({
    page,
  }) => {
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize(viewport)
    await page.goto('/knowledge/countries/east-asia')
    await page.getByRole('button', { name: '查看中国国家详情' }).click()

    const knowledgeCard = page.getByRole('complementary', {
      name: '中国国家学习详情',
    })
    await waitForKnowledgeCardSettled(knowledgeCard)
    const knowledgeBox = await knowledgeCard.boundingBox()
    const knowledgeLayout = await knowledgeCard.evaluate((element) => {
      const content = element.querySelector<HTMLElement>(
        '.knowledge-card-content',
      )!
      return {
        documentOverflows:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        contentClientHeight: content.clientHeight,
        contentScrollHeight: content.scrollHeight,
      }
    })
    expect(knowledgeBox).not.toBeNull()
    expect(knowledgeBox!.x).toBeGreaterThanOrEqual(0)
    expect(knowledgeBox!.y).toBeGreaterThanOrEqual(0)
    expect(knowledgeBox!.x + knowledgeBox!.width).toBeLessThanOrEqual(
      viewport.width + 1,
    )
    expect(knowledgeBox!.y + knowledgeBox!.height).toBeLessThanOrEqual(
      viewport.height + 1,
    )
    expect(knowledgeLayout.documentOverflows).toBe(false)
    expect(knowledgeLayout.contentScrollHeight).toBeGreaterThanOrEqual(
      knowledgeLayout.contentClientHeight,
    )
    const knowledgeContent = await knowledgeCard
      .locator('.knowledge-card-content')
      .innerText()
    const typography = await knowledgeCard.evaluate((element) => {
      const fontSize = (selector: string) => {
        const target = element.querySelector(selector)
        if (!target) throw new Error(`Missing typography target: ${selector}`)
        return Number.parseFloat(getComputedStyle(target).fontSize)
      }

      return {
        body: fontSize('.knowledge-country-highlights li'),
        factLabel: fontSize('.knowledge-country-facts dt'),
        factValue: fontSize('.knowledge-country-facts dd'),
        officialName: fontSize('.knowledge-country-detail-heading small'),
      }
    })
    expect(typography.officialName).toBeGreaterThanOrEqual(12)
    expect(typography.factLabel).toBeGreaterThanOrEqual(12)
    expect(typography.factValue).toBeGreaterThanOrEqual(13)
    expect(typography.body).toBeGreaterThanOrEqual(14)
    await expect(knowledgeCard.getByText('次区域')).toHaveCount(0)
    await expect(knowledgeCard.getByText('Eastern Asia')).toHaveCount(0)
    await expect(
      knowledgeCard.locator('.knowledge-country-facts > div > dt'),
    ).toHaveText(['首都', '人口', '货币', '面积', '语言'])
    const [factsBox, currencyBox, areaBox, languagesBox] = await Promise.all([
      knowledgeCard.locator('.knowledge-country-facts').boundingBox(),
      knowledgeCard
        .locator('.knowledge-country-fact.is-currency')
        .boundingBox(),
      knowledgeCard.locator('.knowledge-country-fact.is-area').boundingBox(),
      knowledgeCard
        .locator('.knowledge-country-fact.is-languages')
        .boundingBox(),
    ])
    expect(factsBox).not.toBeNull()
    expect(currencyBox).not.toBeNull()
    expect(areaBox).not.toBeNull()
    expect(languagesBox).not.toBeNull()
    expect(currencyBox!.x).toBeLessThan(areaBox!.x)
    expect(currencyBox!.y).toBeCloseTo(areaBox!.y, 0)
    expect(languagesBox!.x).toBeCloseTo(factsBox!.x + 1, 0)
    expect(languagesBox!.width).toBeCloseTo(factsBox!.width - 2, 0)
    await expect(
      knowledgeCard.getByRole('link', { name: /在3D地球上查看/ }),
    ).toHaveAttribute('href', '/explore?country=CN')
    await expect(
      knowledgeCard.getByRole('button', { name: /探索城市/ }),
    ).toHaveCount(0)

    await page.goto('/explore?country=CN')
    await waitForSceneOrFallback(page)
    const globeCard = page.getByRole('complementary', {
      name: '中国国家知识卡',
    })
    await waitForKnowledgeCardSettled(globeCard)
    const globeBox = await globeCard.boundingBox()
    const globeContent = await globeCard
      .locator('.knowledge-card-content')
      .innerText()

    expect(knowledgeBox).not.toBeNull()
    expect(globeBox).not.toBeNull()
    expect(globeContent).toBe(knowledgeContent)
    expect(globeBox!.width).toBeCloseTo(knowledgeBox!.width, 0)
    expect(globeBox!.height).toBeCloseTo(knowledgeBox!.height, 0)
    expect(globeBox!.x).toBeCloseTo(knowledgeBox!.x, 0)
    await expect(
      globeCard.getByRole('link', { name: /在知识体系中学习/ }),
    ).toHaveAttribute('href', '/knowledge/countries/east-asia?country=CN')
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false)
  })
}

test('frames the flag in a globe country hover tooltip', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { scene, fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const search = await openCountrySearch(page)
  await search.fill('德国')
  await search.press('Enter')
  await page.waitForTimeout(1_200)

  const sceneBox = await scene.boundingBox()
  expect(sceneBox).not.toBeNull()
  await page.mouse.move(
    sceneBox!.x + sceneBox!.width / 2,
    sceneBox!.y + sceneBox!.height / 2,
  )

  const tooltip = page.getByRole('tooltip')
  await expect(tooltip).toBeVisible({ timeout: 10_000 })
  await expectFramedFlag(tooltip.locator('.country-flag-frame'))
})

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900, touch: false },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
]) {
  test(`uses the mini-map selection as the knowledge-map highlight standard on ${viewport.name}`, async ({
    page,
  }) => {
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })

    await page.goto('/explore?country=CN')
    const standardHighlight = await readMapHighlightStyle(
      page,
      '.world-mini-map-countries path[data-country-code="CN"].is-selected',
    )
    expect(standardHighlight).toEqual({
      fill: 'rgba(92, 145, 148, 0.82)',
      stroke: 'rgb(121, 200, 212)',
      strokeWidth: '1.15px',
      filter: 'none',
    })

    await page.goto('/knowledge?continent=asia')
    expect(
      await readMapHighlightStyle(
        page,
        '.knowledge-region-map-countries path[data-country-code="CN"].is-continent',
      ),
    ).toEqual({
      fill: 'rgb(76, 201, 240)',
      stroke: 'rgb(76, 201, 240)',
      strokeWidth: '1.15px',
      filter: 'none',
    })

    await page.getByRole('tab', { name: /欧洲/ }).click()
    expect(
      await readMapHighlightStyle(
        page,
        '.knowledge-region-map-countries path[data-country-code="FR"].is-continent',
      ),
    ).toEqual({
      fill: 'rgb(255, 138, 91)',
      stroke: 'rgb(255, 138, 91)',
      strokeWidth: '1.15px',
      filter: 'none',
    })

    await page.goto('/knowledge/countries/east-asia')
    expect(
      await readMapHighlightStyle(
        page,
        '.knowledge-region-map-countries path[data-country-code="CN"].is-region',
      ),
    ).toEqual(standardHighlight)

    await page.getByRole('button', { name: '查看中国国家详情' }).click()
    expect(
      await readMapHighlightStyle(
        page,
        '.knowledge-region-map-countries path[data-country-code="JP"].is-region',
      ),
    ).toEqual(standardHighlight)

    const selectedCountryHighlight = await readMapHighlightStyle(
      page,
      '.knowledge-region-map-countries path[data-country-code="CN"].is-country',
    )
    expect(selectedCountryHighlight).toEqual({
      fill: 'rgb(242, 199, 92)',
      stroke: 'rgb(255, 241, 168)',
      strokeWidth: '1.45px',
      filter: 'none',
    })
  })
}

test('deletes legacy regional progress and redirects legacy challenge routes', async ({
  page,
}) => {
  await page.goto('/icons/my-geo-mark.svg')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const deletion = indexedDB.deleteDatabase('my-geo')
      deletion.onsuccess = () => resolve()
      deletion.onerror = () =>
        reject(new Error(deletion.error?.message ?? 'Database deletion failed'))
    })
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('my-geo', 2)
      request.onupgradeneeded = () => {
        const database = request.result
        database.createObjectStore('preferences', { keyPath: 'id' })
        database.createObjectStore('knowledgeProgress', {
          keyPath: 'regionId',
        })
      }
      request.onsuccess = () => {
        const database = request.result
        const transaction = database.transaction(
          'knowledgeProgress',
          'readwrite',
        )
        transaction.objectStore('knowledgeProgress').put({
          regionId: 'east-asia',
          bestScore: 90,
          lastScore: 90,
          attemptCount: 2,
          passedAt: Date.now(),
          updatedAt: Date.now(),
        })
        transaction.oncomplete = () => {
          database.close()
          resolve()
        }
        transaction.onerror = () =>
          reject(new Error(transaction.error?.message ?? 'Legacy write failed'))
      }
      request.onerror = () =>
        reject(
          new Error(request.error?.message ?? 'Legacy database open failed'),
        )
    })
  })

  await page.goto('/questions')
  await expect(page.getByLabel('知识问答范围')).toContainText('0已通过')
  const stores = await page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open('my-geo')
        request.onsuccess = () => {
          const database = request.result
          resolve(Array.from(database.objectStoreNames))
          database.close()
        }
        request.onerror = () =>
          reject(new Error(request.error?.message ?? 'Database open failed'))
      }),
  )
  expect(stores).toContain('questionProgress')
  expect(stores).not.toContain('knowledgeProgress')

  await page.goto('/knowledge/countries/east-asia/challenge')
  await expect(page).toHaveURL(/\/questions$/)
  await page.goto('/questions/countries/east-asia')
  await expect(page).toHaveURL(/\/questions$/)
})

test('enters continent questions from the global hub and persists the result', async ({
  page,
}) => {
  await page.goto('/explore')

  const questionNavigation = page.getByRole('link', { name: '知识问答' })
  await questionNavigation.click()
  await expect(page).toHaveURL(/\/questions$/)
  await expect(questionNavigation).toHaveClass(/is-active/)
  await expect(
    page.getByRole('heading', { name: '知识问答', level: 1 }),
  ).toBeVisible()
  await expect(page.getByLabel('知识问答范围')).toContainText(
    '195国家5大洲3难度',
  )

  await page.getByRole('tab', { name: /困难.*冷门国家/ }).click()
  await expect(page).toHaveURL(/\/questions\?difficulty=hard$/)
  await page.getByTestId('knowledge-question-continent-asia').click()
  await expect(page).toHaveURL(/\/questions\/asia\/hard$/)
  await expect(questionNavigation).toHaveClass(/is-active/)
  await expect(page.getByText('亚洲 · 困难')).toBeVisible()

  for (let index = 0; index < 10; index += 1) {
    await page.locator('.knowledge-question-options button').first().click()
    await page
      .getByRole('button', {
        name: index === 9 ? '查看成绩' : '下一题',
      })
      .click()
  }

  await expect(page.getByTestId('knowledge-challenge-score')).toBeVisible()
  await expect(page.locator('.knowledge-result-progress')).toBeVisible()
  await expect(page.getByRole('button', { name: '再挑战一次' })).toHaveClass(
    /is-primary/,
  )
  await expect(page.getByRole('link', { name: '返回知识问答' })).toHaveClass(
    /is-secondary/,
  )
  await page.getByRole('link', { name: '返回知识问答' }).click()
  await expect(page).toHaveURL(/\/questions\?difficulty=hard$/)

  const asia = page.getByTestId('knowledge-question-continent-asia')
  await expect(asia).toContainText('1 次挑战')
  await expect(asia).toContainText(/最高 \d+ 分/)
  await page.reload()
  await expect(asia).toContainText('1 次挑战')
})

test('keeps flag choices anonymous in separate iPadOS cards', async ({
  page,
}) => {
  await page.goto('/questions/asia/easy')

  await page.locator('.knowledge-question-option').first().click()
  await page.getByRole('button', { name: '下一题' }).click()
  await expect(page.getByText('选择正确的国旗')).toBeVisible()

  const options = page.locator('.knowledge-question-option.is-flag-choice')
  await expect(options).toHaveCount(4)
  await expect(options.locator('strong')).toHaveCount(0)
  await expect(options.locator('.country-flag-frame')).toHaveCount(4)
  await expect(options.nth(0)).toHaveAttribute('aria-label', '国旗选项 1')
  await expect(options.nth(3)).toHaveAttribute('aria-label', '国旗选项 4')

  const cardLayout = await page
    .locator('.knowledge-question-options')
    .evaluate((grid) => {
      const style = getComputedStyle(grid)
      const cards = Array.from(grid.children).map((card) => {
        const rect = card.getBoundingClientRect()
        const cardStyle = getComputedStyle(card)
        return {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          borderRadius: Number.parseFloat(cardStyle.borderRadius),
          borderWidth: Number.parseFloat(cardStyle.borderWidth),
        }
      })
      return {
        gap: Number.parseFloat(style.gap),
        borderWidth: Number.parseFloat(style.borderWidth),
        cards,
      }
    })
  expect(cardLayout.gap).toBeGreaterThan(0)
  expect(cardLayout.borderWidth).toBe(0)
  expect(cardLayout.cards.every((card) => card.borderRadius > 8)).toBe(true)
  expect(cardLayout.cards.every((card) => card.borderWidth > 0)).toBe(true)
  expect(new Set(cardLayout.cards.map((card) => card.top)).size).toBe(2)
  expect(new Set(cardLayout.cards.map((card) => card.left)).size).toBe(2)

  await options.first().focus()
  await expect(options.first()).toBeFocused()
  await page.keyboard.press('Space')
  await expect(
    page.locator('.knowledge-question-option.is-correct'),
  ).toHaveCount(1)
  await expect(page.getByText(/正确答案：/)).toBeVisible()
  await expect(options.locator('strong')).toHaveCount(0)
})

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900 },
  { name: 'iPad landscape', width: 1194, height: 834 },
  { name: 'phone landscape', width: 844, height: 390 },
]) {
  test(`keeps challenge option cards usable on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto('/questions/asia/easy')

    const geometry = await page
      .locator('.knowledge-question-options')
      .evaluate((grid) => {
        const cards = Array.from(grid.children).map((card) => {
          const rect = card.getBoundingClientRect()
          return {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            right: rect.right,
            bottom: rect.bottom,
          }
        })
        return {
          cards,
          viewportWidth: document.documentElement.clientWidth,
          viewportHeight: document.documentElement.clientHeight,
          documentWidth: document.documentElement.scrollWidth,
        }
      })
    expect(new Set(geometry.cards.map((card) => card.top)).size).toBe(2)
    expect(new Set(geometry.cards.map((card) => card.left)).size).toBe(2)
    expect(geometry.documentWidth).toBeLessThanOrEqual(
      geometry.viewportWidth + 1,
    )
    expect(
      geometry.cards.every(
        (card) =>
          card.right <= geometry.viewportWidth + 1 &&
          card.bottom <= geometry.viewportHeight + 1,
      ),
    ).toBe(true)
  })
}

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900 },
  { name: 'iPad landscape', width: 1194, height: 834 },
  { name: 'phone landscape', width: 844, height: 390 },
]) {
  test(`keeps the question hub and navigation usable on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto('/questions')

    const questionNavigation = page.getByRole('link', { name: '知识问答' })
    await expect(questionNavigation).toBeVisible()
    await expect(questionNavigation).toHaveClass(/is-active/)
    const cards = page.locator('.knowledge-question-continent-card')
    await expect(cards).toHaveCount(5)
    await expect(
      page.getByRole('tab', { name: /简单.*最常见国家/ }),
    ).toBeVisible()

    const geometry = await page
      .locator('.knowledge-question-continent-grid')
      .evaluate((grid) => ({
        viewportWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        gridClientWidth: grid.clientWidth,
        gridScrollWidth: grid.scrollWidth,
        cardTops: Array.from(grid.children).map(
          (card) => card.getBoundingClientRect().top,
        ),
      }))
    expect(geometry.documentScrollWidth).toBeLessThanOrEqual(
      geometry.viewportWidth + 1,
    )
    expect(new Set(geometry.cardTops.map((top) => Math.round(top))).size).toBe(
      1,
    )
    if (viewport.width === 844) {
      expect(geometry.gridScrollWidth).toBeGreaterThan(geometry.gridClientWidth)
    } else {
      expect(geometry.gridScrollWidth).toBeLessThanOrEqual(
        geometry.gridClientWidth + 1,
      )
    }
  })
}

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900, touch: false },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
]) {
  test(`aligns dynamic country grids with the region map on ${viewport.name}`, async ({
    page,
  }) => {
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize(viewport)

    const columnLimit =
      viewport.height <= 520 || viewport.width <= 760
        ? 2
        : viewport.width <= 1080
          ? 3
          : 5
    for (const regionCase of [
      {
        route: '/knowledge/countries/east-europe',
        countryCount: 4,
        title: '东欧4国',
      },
      {
        route: '/knowledge/countries/central-europe',
        countryCount: 6,
        title: '中欧6国',
      },
      {
        route: '/knowledge/countries/australia-new-zealand',
        countryCount: 2,
        title: '澳大利亚和新西兰2国',
      },
      {
        route: '/knowledge/countries/east-asia',
        countryCount: 5,
        title: '东亚5国',
      },
    ]) {
      await page.goto(regionCase.route)
      await expect(
        page.getByRole('heading', { name: regionCase.title, level: 1 }),
      ).toBeVisible()
      await expect(page.locator('.knowledge-country-card')).toHaveCount(
        regionCase.countryCount,
      )

      const geometry = await page.evaluate(() => {
        const map = document
          .querySelector('.knowledge-region-map-strip')!
          .getBoundingClientRect()
        const grid = document
          .querySelector('.knowledge-country-grid')!
          .getBoundingClientRect()
        const cards = Array.from(
          document.querySelectorAll('.knowledge-country-card'),
        ).map((card) => card.getBoundingClientRect())
        const firstRow = cards.filter(
          (card) => Math.abs(card.y - cards[0].y) < 1,
        )
        return {
          mapX: map.x,
          mapRight: map.right,
          gridX: grid.x,
          gridRight: grid.right,
          firstCardX: firstRow[0].x,
          lastCardRight: firstRow.at(-1)!.right,
          firstRowCount: firstRow.length,
          pageOverflows:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        }
      })

      expect(geometry.gridX).toBeCloseTo(geometry.mapX, 0)
      expect(geometry.gridRight).toBeCloseTo(geometry.mapRight, 0)
      expect(geometry.firstCardX).toBeCloseTo(geometry.mapX, 0)
      expect(geometry.lastCardRight).toBeCloseTo(geometry.mapRight, 0)
      expect(geometry.firstRowCount).toBe(
        Math.min(regionCase.countryCount, columnLimit),
      )
      expect(geometry.pageOverflows).toBe(false)
    }
  })
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900, touch: false },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
]) {
  test(`keeps the knowledge atlas usable on ${viewport.name}`, async ({
    page,
  }) => {
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto('/knowledge')

    await expect(
      page.getByRole('heading', { name: '国家首都', level: 1 }),
    ).toBeVisible()
    const geometry = await page
      .locator('.knowledge-shell')
      .evaluate((shell) => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: shell.clientHeight,
        scrollHeight: shell.scrollHeight,
      }))
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1)
    expect(geometry.scrollHeight).toBeGreaterThanOrEqual(geometry.clientHeight)

    await page.getByTestId('knowledge-region-east-asia').click()
    await expect(page.getByRole('link', { name: '开始区域挑战' })).toHaveCount(
      0,
    )
    const regionCard = page.getByLabel('东亚区域知识')
    await waitForKnowledgeCardSettled(regionCard)
    await expect(regionCard).toContainText('自然地理')
    await expect(regionCard).toContainText('人文地理')
    await expect(regionCard).toContainText('学习要点')
    await expect(regionCard.getByRole('button')).toHaveCount(0)
    const displayControls = page.getByRole('group', {
      name: '国家卡显示内容',
    })
    await expect(displayControls).toBeVisible()
    await expect(displayControls.locator('button')).toHaveText([
      '国旗',
      '国家',
      '首都',
    ])
    await expect(
      displayControls.getByRole('button', { name: '国旗' }),
    ).toBeDisabled()
    const map = page.locator('.knowledge-region-map-strip')
    const pageHeader = page.locator('.knowledge-region-page-header')
    const backLink = pageHeader.getByRole('link', { name: '← 返回亚洲' })
    const regionTitle = pageHeader.getByRole('heading', {
      name: '东亚5国',
      level: 1,
    })
    const regionCount = regionTitle.locator('strong')
    await expect(backLink).toHaveAttribute('href', '/knowledge?continent=asia')
    await expect(regionCount).toHaveText('5')
    const regionCountStyle = await regionCount.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        color: style.color,
        fontWeight: Number.parseInt(style.fontWeight, 10),
        marginLeft: Number.parseFloat(style.marginLeft),
        marginRight: Number.parseFloat(style.marginRight),
      }
    })
    expect(regionCountStyle.color).toBe('rgb(76, 201, 240)')
    expect(regionCountStyle.fontWeight).toBeGreaterThanOrEqual(700)
    expect(regionCountStyle.marginLeft).toBeGreaterThan(0)
    expect(regionCountStyle.marginRight).toBeGreaterThan(0)
    await expect(map.getByRole('link')).toHaveCount(0)
    await expect(map.getByText('WORLD POSITION')).toHaveCount(0)
    const mapCountryPaths = map.locator('.knowledge-region-map-countries')
    await expect(mapCountryPaths.locator('path.is-region')).toHaveCount(5)
    await expect(mapCountryPaths.locator('path.is-continent')).toHaveCount(0)
    await expect(page.locator('.knowledge-region-map-actions')).toHaveCount(0)
    await expect(page.getByTestId('knowledge-region-best-score')).toHaveCount(0)
    const countryGrid = page.locator('.knowledge-country-grid')
    const [
      mapBefore,
      headerBox,
      backLinkBox,
      regionTitleBox,
      controlsBox,
      gridBefore,
      regionCardBox,
    ] = await Promise.all([
      map.evaluate((element) => ({
        x: element.getBoundingClientRect().x,
        y: element.getBoundingClientRect().y,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        pathLeft: Math.min(
          ...Array.from(
            element.querySelectorAll('.knowledge-region-map-countries path'),
          ).map((path) => path.getBoundingClientRect().left),
        ),
        pathRight: Math.max(
          ...Array.from(
            element.querySelectorAll('.knowledge-region-map-countries path'),
          ).map((path) => path.getBoundingClientRect().right),
        ),
      })),
      pageHeader.boundingBox(),
      backLink.boundingBox(),
      regionTitle.boundingBox(),
      displayControls.boundingBox(),
      countryGrid.evaluate((element) => {
        const box = element.getBoundingClientRect()
        const cards = Array.from(
          element.querySelectorAll('.knowledge-country-card'),
        ).map((card) => card.getBoundingClientRect())
        return {
          x: box.x,
          right: box.right,
          width: box.width,
          firstRowCount: cards.filter(
            (card) => Math.abs(card.y - cards[0].y) < 1,
          ).length,
        }
      }),
      regionCard.boundingBox(),
    ])
    expect(mapBefore.width / mapBefore.height).toBeCloseTo(720 / 340, 2)
    expect(mapBefore.pathLeft - mapBefore.x).toBeLessThanOrEqual(2.5)
    expect(
      mapBefore.x + mapBefore.width - mapBefore.pathRight,
    ).toBeLessThanOrEqual(2.5)
    expect(headerBox).not.toBeNull()
    expect(backLinkBox).not.toBeNull()
    expect(regionTitleBox).not.toBeNull()
    expect(controlsBox).not.toBeNull()
    expect(regionCardBox).not.toBeNull()
    expect(regionCardBox!.x).toBeGreaterThanOrEqual(0)
    expect(regionCardBox!.x + regionCardBox!.width).toBeLessThanOrEqual(
      viewport.width + 1,
    )
    expect(mapBefore.x + mapBefore.width).toBeLessThanOrEqual(
      regionCardBox!.x + 1,
    )
    expect(headerBox!.x).toBeCloseTo(mapBefore.x, 0)
    expect(headerBox!.width).toBeCloseTo(mapBefore.width, 0)
    expect(regionTitleBox!.x + regionTitleBox!.width / 2).toBeCloseTo(
      headerBox!.x + headerBox!.width / 2,
      0,
    )
    expect(backLinkBox!.y + backLinkBox!.height / 2).toBeCloseTo(
      regionTitleBox!.y + regionTitleBox!.height / 2,
      0,
    )
    expect(mapBefore.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height)
    expect(controlsBox!.x).toBeCloseTo(mapBefore.x, 0)
    expect(controlsBox!.y).toBeGreaterThanOrEqual(
      mapBefore.y + mapBefore.height,
    )
    expect(gridBefore.x).toBeCloseTo(mapBefore.x, 0)
    expect(gridBefore.right).toBeCloseTo(mapBefore.x + mapBefore.width, 0)
    expect(gridBefore.firstRowCount).toBe(
      viewport.height <= 520 ? 2 : viewport.width <= 1080 ? 3 : 5,
    )

    const chinaCard = page
      .getByRole('button', { name: '查看中国国家详情' })
      .locator('..')
    const flagOnlyBox = await chinaCard
      .locator('.country-flag-frame')
      .boundingBox()
    expect(flagOnlyBox).not.toBeNull()
    await displayControls
      .getByRole('button', { name: '国家', exact: true })
      .click()
    await displayControls
      .getByRole('button', { name: '首都', exact: true })
      .click()
    const verticalFields = await chinaCard
      .locator('.knowledge-country-open > *')
      .evaluateAll((fields) =>
        fields.map((field) => {
          const box = field.getBoundingClientRect()
          return {
            className: field.getAttribute('class') ?? '',
            centerX: box.x + box.width / 2,
            y: box.y,
          }
        }),
      )
    expect(verticalFields.map((field) => field.className)).toEqual([
      'country-flag-frame',
      'knowledge-country-name',
      'knowledge-country-card-capital',
    ])
    expect(verticalFields[0].y).toBeLessThan(verticalFields[1].y)
    expect(verticalFields[1].y).toBeLessThan(verticalFields[2].y)
    expect(verticalFields[0].centerX).toBeCloseTo(verticalFields[1].centerX, 0)
    expect(verticalFields[1].centerX).toBeCloseTo(verticalFields[2].centerX, 0)
    const flagWithFieldsBox = await chinaCard
      .locator('.country-flag-frame')
      .boundingBox()
    expect(flagWithFieldsBox).not.toBeNull()
    expect(flagWithFieldsBox!.width).toBeCloseTo(flagOnlyBox!.width, 1)
    expect(flagWithFieldsBox!.height).toBeCloseTo(flagOnlyBox!.height, 1)

    const capitalField = chinaCard.locator('.knowledge-country-card-capital')
    const capitalChinese = capitalField.locator('strong')
    const capitalEnglish = capitalField.locator('small')
    await expect(capitalChinese).toHaveText('北京')
    await expect(capitalEnglish).toHaveText('Beijing')
    await expect(capitalField.getByText('首都', { exact: true })).toHaveCount(0)
    const [capitalChineseBox, capitalEnglishBox] = await Promise.all([
      capitalChinese.boundingBox(),
      capitalEnglish.boundingBox(),
    ])
    expect(capitalChineseBox).not.toBeNull()
    expect(capitalEnglishBox).not.toBeNull()
    expect(capitalChineseBox!.y).toBeLessThan(capitalEnglishBox!.y)

    await page.getByRole('button', { name: '查看中国国家详情' }).click()
    await expect(regionCard).toHaveCount(0)
    await expect(mapCountryPaths.locator('path.is-country')).toHaveCount(1)
    await expect(
      mapCountryPaths.locator('path[data-country-code="CN"].is-country'),
    ).toHaveCount(1)
    await expect(mapCountryPaths.locator('path.is-region')).toHaveCount(4)
    const detail = page.getByLabel('中国国家学习详情')
    await waitForKnowledgeCardSettled(detail)
    const [mapAfter, gridAfter, detailBox] = await Promise.all([
      map.evaluate((element) => ({
        x: element.getBoundingClientRect().x,
        width: element.getBoundingClientRect().width,
      })),
      countryGrid.evaluate((element) => {
        const box = element.getBoundingClientRect()
        const cards = Array.from(
          element.querySelectorAll('.knowledge-country-card'),
        ).map((card) => card.getBoundingClientRect())
        return {
          x: box.x,
          right: box.right,
          width: box.width,
          firstRowCount: cards.filter(
            (card) => Math.abs(card.y - cards[0].y) < 1,
          ).length,
        }
      }),
      detail.boundingBox(),
    ])
    expect(detailBox).not.toBeNull()
    expect(detailBox!.x).toBeGreaterThanOrEqual(0)
    expect(detailBox!.x + detailBox!.width).toBeLessThanOrEqual(
      viewport.width + 1,
    )
    expect(mapAfter.width).toBeCloseTo(mapBefore.width, 0)
    expect(gridAfter.width).toBeCloseTo(gridBefore.width, 0)
    expect(gridAfter.x).toBeCloseTo(mapAfter.x, 0)
    expect(gridAfter.right).toBeCloseTo(mapAfter.x + mapAfter.width, 0)
    expect(gridAfter.firstRowCount).toBe(
      viewport.height <= 520 ? 2 : viewport.width <= 1080 ? 3 : 5,
    )
    expect(mapAfter.x + mapAfter.width).toBeLessThanOrEqual(detailBox!.x + 1)
    expect(gridAfter.x + gridAfter.width).toBeLessThanOrEqual(detailBox!.x + 1)
    expect(detailBox!.width).toBeCloseTo(regionCardBox!.width, 0)

    await page.getByRole('button', { name: '关闭国家学习详情' }).click()
    await expect(page.getByLabel('东亚区域知识')).toBeVisible()
  })
}

test('exposes a valid PWA manifest', async ({ request }) => {
  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBeTruthy()

  const manifest = (await manifestResponse.json()) as {
    name: string
    display: string
    display_override: string[]
    orientation: string
    icons: Array<{ src: string }>
  }

  expect(manifest.name).toContain('My Geo')
  expect(manifest.display).toBe('standalone')
  expect(manifest.display_override).toEqual(['fullscreen', 'standalone'])
  expect(manifest.orientation).toBe('landscape')
  expect(manifest.icons).toHaveLength(3)
})

test('keeps the global fullscreen control active across app routes', async ({
  page,
}) => {
  await installFullscreenApiMock(page)
  await page.goto('/explore')

  await page.getByRole('button', { name: '进入全屏' }).click()
  const exitFullscreen = page.getByRole('button', { name: '退出全屏' })
  await expect(exitFullscreen).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('link', { name: '知识体系' }).click()
  await expect(page).toHaveURL(/\/knowledge$/)
  await expect(exitFullscreen).toBeVisible()

  for (const path of [
    '/knowledge/countries/east-asia',
    '/questions/asia/easy',
  ]) {
    await page.evaluate((nextPath) => {
      window.history.pushState({}, '', nextPath)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, path)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(exitFullscreen).toBeVisible()
  }

  await page.evaluate(() => document.exitFullscreen())
  const enterFullscreen = page.getByRole('button', { name: '进入全屏' })
  await expect(enterFullscreen).toHaveAttribute('aria-pressed', 'false')

  await enterFullscreen.click()
  await expect(exitFullscreen).toBeVisible()
})

for (const viewport of [
  { name: '1440 desktop', width: 1440, height: 900, touch: false },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
]) {
  test(`keeps the global fullscreen control inside navigation on ${viewport.name}`, async ({
    page,
  }) => {
    await installFullscreenApiMock(page)
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto('/explore')

    const navigation = page.getByRole('navigation', {
      name: 'My Geo 主导航',
    })
    await expect(page.getByRole('button', { name: '进入全屏' })).toBeVisible()
    const layout = await navigation.evaluate((element) => {
      const box = element.getBoundingClientRect()
      const items = Array.from(
        element.querySelectorAll<HTMLElement>('.app-navigation-link'),
        (item) => {
          const itemBox = item.getBoundingClientRect()
          return { top: itemBox.top, bottom: itemBox.bottom }
        },
      )
      return {
        top: box.top,
        bottom: box.bottom,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        items,
      }
    })

    expect(layout.top).toBeGreaterThanOrEqual(5)
    expect(layout.bottom).toBeLessThanOrEqual(viewport.height - 5)
    expect(layout.scrollHeight).toBeLessThanOrEqual(layout.clientHeight + 1)
    expect(layout.items).toHaveLength(4)
    for (let index = 1; index < layout.items.length; index += 1) {
      expect(layout.items[index].top).toBeGreaterThanOrEqual(
        layout.items[index - 1].bottom,
      )
    }
  })
}

test('asks touch phones and iPads to rotate before loading the app', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })
    Object.defineProperty(navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    })
  })

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 834, height: 1194 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const prompt = page.getByTestId('landscape-prompt')
    await expect(prompt).toBeVisible()
    await expect(
      prompt.getByRole('heading', { name: '请将设备横过来' }),
    ).toBeVisible()
    await expect(page.getByTestId('globe-scene')).toHaveCount(0)
    await expect(page.getByTestId('webgl-fallback')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '进入全屏' })).toHaveCount(0)
  }
})

test('enters landscape automatically and preserves the mounted experience', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })
    Object.defineProperty(navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByTestId('landscape-prompt')).toBeVisible()

  await page.setViewportSize({ width: 844, height: 390 })
  await expect(page.getByTestId('landscape-prompt')).toHaveCount(0)
  const { scene, fallback } = await waitForSceneOrFallback(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByTestId('landscape-prompt')).toBeVisible()
  await expect(scene.or(fallback)).toBeAttached()

  await page.setViewportSize({ width: 844, height: 390 })
  await expect(page.getByTestId('landscape-prompt')).toHaveCount(0)
  await expect(scene.or(fallback)).toBeVisible({ timeout: 15_000 })
})

test('suppresses touch context menus while preserving search editing', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })
    Object.defineProperty(navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    })
  })

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 1194, height: 834 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const trigger = page.getByRole('button', { name: '搜索地点' })
    const blockedResult = await trigger.evaluate((element) => {
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      })
      return {
        dispatched: element.dispatchEvent(event),
        defaultPrevented: event.defaultPrevented,
      }
    })
    expect(blockedResult).toEqual({
      dispatched: false,
      defaultPrevented: true,
    })

    const runtime = page.getByTestId('landscape-runtime')
    await expect(runtime).toHaveClass(/is-touch-device/)
    expect(
      await runtime.evaluate((element) => getComputedStyle(element).userSelect),
    ).toBe('none')

    const search = await openCountrySearch(page)
    const allowedResult = await search.evaluate((element) => {
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      })
      return {
        dispatched: element.dispatchEvent(event),
        defaultPrevented: event.defaultPrevented,
        userSelect: getComputedStyle(element).userSelect,
      }
    })
    expect(allowedResult).toEqual({
      dispatched: true,
      defaultPrevented: false,
      userSelect: 'text',
    })

    await search.fill('中国')
    await search.selectText()
    expect(
      await search.evaluate((element) => {
        const input = element as HTMLInputElement
        return {
          value: input.value,
          selectionStart: input.selectionStart,
          selectionEnd: input.selectionEnd,
        }
      }),
    ).toEqual({ value: '中国', selectionStart: 0, selectionEnd: 2 })
  }
})

test('keeps phone landscape controls separated and country details usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })
    Object.defineProperty(navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    })
  })
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const map = page.getByTestId('world-mini-map')
  const controls = page.getByRole('navigation', { name: '地球显示控制' })
  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  await expect(map).toBeVisible()
  await expect(page.getByRole('button', { name: '定位图' })).toBeHidden()
  await expect(controls).toBeVisible()
  await expect(layerControl).toBeVisible()

  const mapBox = await map.boundingBox()
  const controlsBox = await controls.boundingBox()
  const layerControlBox = await layerControl.boundingBox()
  expect(mapBox).not.toBeNull()
  expect(controlsBox).not.toBeNull()
  expect(layerControlBox).not.toBeNull()
  expect(mapBox!.x + mapBox!.width).toBeLessThanOrEqual(controlsBox!.x)
  expect(layerControlBox!.x).toBeGreaterThanOrEqual(11)
  expect(layerControlBox!.y).toBeGreaterThanOrEqual(11)
  expect(layerControlBox!.y + layerControlBox!.height).toBeLessThan(mapBox!.y)

  const search = await openCountrySearch(page)
  await expect(search).toBeVisible()
  const dialogBox = await page
    .getByRole('dialog', { name: '搜索地点' })
    .boundingBox()
  const results = page.getByRole('listbox', { name: '地点搜索结果' })
  const popoverBox = await page.locator('.country-search-popover').boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(popoverBox).not.toBeNull()
  await expect(results).toBeVisible()
  expect(dialogBox!.x).toBeGreaterThanOrEqual(mapBox!.x + mapBox!.width)
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(512)
  expect(popoverBox!.y).toBeGreaterThanOrEqual(11)

  await search.fill('中国')
  await search.press('Enter')
  const card = page.getByLabel('中国国家知识卡')
  await expect(card).toBeVisible()
  await expect
    .poll(async () => (await card.boundingBox())?.y ?? Number.POSITIVE_INFINITY)
    .toBeLessThanOrEqual(13)
  const cardBox = await card.boundingBox()
  expect(cardBox).not.toBeNull()
  expect(cardBox!.y).toBeGreaterThanOrEqual(11)
  expect(cardBox!.y).toBeLessThanOrEqual(13)
  expect(cardBox!.y + cardBox!.height).toBeGreaterThanOrEqual(377)
  expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(379)
  expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(cardBox!.x)
  await expect(
    card.getByRole('button', { name: '关闭国家知识卡' }),
  ).toBeVisible()
  await expect(card.getByText('约 14.1亿 人')).toBeVisible()

  const shanghai = card.getByRole('button', { name: '探索城市上海' })
  await expect(shanghai).toBeVisible()
  await shanghai.click({ force: true })
  const cityCard = page.getByLabel('上海城市知识卡')
  await expect(cityCard).toBeVisible()
  await expect(cityCard.getByText('经济中心')).toBeVisible()
  await expect(cityCard.getByText(/31\.1667°N/)).toHaveCount(0)
  const cityCardBox = await cityCard.boundingBox()
  expect(cityCardBox).not.toBeNull()
  expect(cityCardBox!.y).toBeGreaterThanOrEqual(11)
  expect(cityCardBox!.y + cityCardBox!.height).toBeLessThanOrEqual(379)

  await cityCard.getByRole('button', { name: '← 返回中国' }).click()
  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
]) {
  test(`expands a ${viewport.width}px desktop stage until country details open`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const { scene, fallback } = await waitForSceneOrFallback(page)
    if (await fallback.isVisible()) return

    const initialSceneBox = await scene.boundingBox()
    expect(initialSceneBox).not.toBeNull()
    expect(initialSceneBox!.x).toBeLessThanOrEqual(1)
    expect(initialSceneBox!.y).toBeLessThanOrEqual(1)
    expect(initialSceneBox!.height).toBeGreaterThanOrEqual(viewport.height - 1)
    expect(initialSceneBox!.width).toBeGreaterThan(viewport.width * 0.9)

    const search = await openCountrySearch(page)
    await search.fill('中国')
    await search.press('Enter')

    const card = page.getByLabel('中国国家知识卡')
    const controls = page.getByRole('navigation', { name: '地球显示控制' })
    const map = page.getByTestId('world-mini-map')
    await expect
      .poll(
        async () => (await card.boundingBox())?.y ?? Number.POSITIVE_INFINITY,
      )
      .toBeLessThanOrEqual(13)
    const [sceneBox, cardBox, controlsBox, mapBox] = await Promise.all([
      scene.boundingBox(),
      card.boundingBox(),
      controls.boundingBox(),
      map.boundingBox(),
    ])
    expect(sceneBox).not.toBeNull()
    expect(cardBox).not.toBeNull()
    expect(controlsBox).not.toBeNull()
    expect(mapBox).not.toBeNull()
    expect(
      await page.evaluate(() => ({
        page: window.scrollY,
        shell: document.querySelector('.explore-shell')?.scrollTop ?? 0,
      })),
    ).toEqual({ page: 0, shell: 0 })
    expect(sceneBox!.x + sceneBox!.width).toBeLessThanOrEqual(cardBox!.x)
    expect(cardBox!.y + cardBox!.height).toBeGreaterThanOrEqual(
      viewport.height - 13,
    )
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(
      viewport.height - 11,
    )
    expect(mapBox!.x).toBeLessThanOrEqual(13)
    expect(mapBox!.y + mapBox!.height).toBeGreaterThanOrEqual(
      viewport.height - 13,
    )
    expect(mapBox!.x + mapBox!.width).toBeLessThanOrEqual(controlsBox!.x)
    expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(cardBox!.x)

    const middleSlotCenter = (mapBox!.x + mapBox!.width + cardBox!.x) / 2
    const controlsCenter = controlsBox!.x + controlsBox!.width / 2
    expect(Math.abs(controlsCenter - middleSlotCenter)).toBeLessThanOrEqual(2)

    const controlLabels = await controls
      .locator('.control-button > span:last-child')
      .evaluateAll((labels) =>
        labels.map((label) => ({
          width: (label as HTMLElement).getBoundingClientRect().width,
          height: (label as HTMLElement).getBoundingClientRect().height,
        })),
      )
    if (viewport.width <= 1120) {
      expect(
        controlLabels.every(({ width, height }) => width <= 1 && height <= 1),
      ).toBe(true)
    } else {
      expect(
        controlLabels.every(({ width, height }) => width > 1 && height > 1),
      ).toBe(true)
    }
  })
}

test('keeps controls reachable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '转动地球，发现每一片土地' }),
  ).toHaveCount(0)

  const scene = page.getByTestId('globe-scene')
  if (await scene.isVisible()) {
    await expect(page.getByRole('button', { name: '重置视角' })).toBeVisible()
    await expect(page.getByRole('button', { name: '定位图' })).toBeVisible()
  }
})

test('keeps the 2D map synchronized with country and globe navigation', async ({
  page,
}) => {
  await page.goto('/')

  const { scene, fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const map = page.getByTestId('world-mini-map')
  const marker = page.getByTestId('world-mini-map-view-marker')
  const initialTransform = await marker.getAttribute('transform')
  const initialMapBox = await map.boundingBox()
  expect(initialMapBox).not.toBeNull()

  await page.mouse.click(
    initialMapBox!.x + initialMapBox!.width * ((2.3 + 180) / 360),
    initialMapBox!.y + initialMapBox!.height * ((90 - 48.8) / 180),
  )
  await expect(page.getByLabel('法国国家知识卡')).toBeVisible()
  await expect(map.locator('[data-country-code="FR"]')).toHaveClass(
    /is-selected/,
  )
  await expect
    .poll(() => marker.getAttribute('transform'))
    .not.toBe(initialTransform)

  await page.mouse.click(
    initialMapBox!.x + initialMapBox!.width * ((121 + 180) / 360),
    initialMapBox!.y + initialMapBox!.height * ((90 - 23.7) / 180),
  )
  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
  await expect(map.locator('[data-country-code="CN"]')).toHaveClass(
    /is-selected/,
  )

  const sceneBox = await scene.boundingBox()
  expect(sceneBox).not.toBeNull()
  const markerBeforeDrag = await marker.getAttribute('transform')
  await page.mouse.move(
    sceneBox!.x + sceneBox!.width * 0.56,
    sceneBox!.y + sceneBox!.height * 0.48,
  )
  await page.mouse.down()
  await page.mouse.move(
    sceneBox!.x + sceneBox!.width * 0.7,
    sceneBox!.y + sceneBox!.height * 0.55,
    { steps: 8 },
  )
  await page.mouse.up()
  await expect
    .poll(() => marker.getAttribute('transform'))
    .not.toBe(markerBeforeDrag)

  const mapBox = await map.boundingBox()
  expect(mapBox).not.toBeNull()
  await page.mouse.click(
    mapBox!.x + mapBox!.width * (40 / 360),
    mapBox!.y + mapBox!.height * 0.5,
  )
  await expect(page.getByLabel('中国国家知识卡')).toHaveCount(0)
  await expect(map.locator('.is-selected')).toHaveCount(0)
})

test('toggles adaptive capital and city labels and opens a selected city', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const capitalToggle = layerControl.getByRole('button', { name: '首都' })
  const cityToggle = layerControl.getByRole('button', { name: '城市' })
  const labels = page.locator('.city-label:not([hidden])')
  await expect(labels).toHaveCount(0)
  await capitalToggle.click()
  await expect(capitalToggle).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => labels.count()).toBeGreaterThan(0)
  expect(await labels.count()).toBeLessThanOrEqual(30)

  await capitalToggle.click()
  await expect(labels).toHaveCount(0)
  await cityToggle.click()
  await expect(cityToggle).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => labels.count()).toBeGreaterThan(0)
  expect(
    await page.locator('.city-label.is-capital:not([hidden])').count(),
  ).toBe(0)

  await cityToggle.click()
  await expect(labels).toHaveCount(0)

  const search = await openCountrySearch(page)
  await search.fill('中国')
  await search.press('Enter')
  const countryCard = page.getByLabel('中国国家知识卡')
  await expect(
    countryCard.getByRole('button', { name: '探索城市上海' }),
  ).toBeVisible()
  await countryCard.getByRole('button', { name: '探索城市上海' }).click()

  const cityCard = page.getByLabel('上海城市知识卡')
  await expect(cityCard).toBeVisible()
  await expectFramedFlag(cityCard.locator('.knowledge-country-detail-flag'))
  await expect(page.locator('[data-city-id="cn-shanghai"]')).toBeVisible()
  await expect(cityCard.getByRole('heading', { name: '上海' })).toBeVisible()
  await expect(cityCard.getByText('世界知名')).toBeVisible()
  await expect(cityCard.getByText(/资料来源/)).toHaveCount(0)
})

test('toggles waterbody layers, searches a sea, and replaces its selected range', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const oceanToggle = layerControl.getByRole('button', { name: '海洋' })
  const waterwayToggle = layerControl.getByRole('button', { name: '水域' })
  await expect(oceanToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(waterwayToggle).toHaveAttribute('aria-pressed', 'false')
  await oceanToggle.click()
  await waterwayToggle.click()
  await expect
    .poll(() => page.locator('[data-waterbody-id]:not([hidden])').count())
    .toBeGreaterThan(0)

  let search = await openCountrySearch(page)
  await search.fill('地中海')
  await search.press('Enter')
  const mediterraneanCard = page.getByLabel('地中海水域知识卡')
  await expect(mediterraneanCard).toBeVisible()
  await expect(mediterraneanCard.getByText(/不代表领海/)).toHaveCount(0)
  await expect(mediterraneanCard.getByText('代表坐标')).toHaveCount(0)
  await expect(mediterraneanCard.getByText(/资料来源/)).toHaveCount(0)
  await expect(
    page.locator('[data-waterbody-id="mediterranean-sea"]'),
  ).toBeVisible()

  search = await openCountrySearch(page)
  await search.fill('渤海')
  await search.press('Enter')
  await expect(page.getByLabel('渤海水域知识卡')).toBeVisible()
  await expect(page.locator('[data-waterbody-id="bohai-sea"]')).toBeVisible()

  search = await openCountrySearch(page)
  await search.fill('马里亚纳海沟')
  await search.press('Enter')
  await expect(page.getByLabel('马里亚纳海沟水域知识卡')).toBeVisible()
  await expect(mediterraneanCard).toHaveCount(0)

  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
})

test('shows the lake layer and opens the Lake Baikal knowledge card', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const lakeToggle = layerControl.getByRole('button', {
    name: '湖泊图层：世界著名淡水与咸水湖泊',
  })
  await expect(lakeToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.waterbody-label.is-lake')).toHaveCount(0)

  const search = await openCountrySearch(page)
  await search.fill('贝加尔湖')
  await search.press('Enter')

  const card = page.getByRole('complementary', {
    name: '贝加尔湖水域知识卡',
  })
  await expect(card).toBeVisible()
  await expect(card.getByText('31,722 km²')).toBeVisible()
  await expect(card.getByText('1,642 m')).toBeVisible()
  await expect(card.getByText(/水位、季节和长期环境变化/)).toHaveCount(0)
  await expect(lakeToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.waterbody-label.is-lake')).toHaveCount(20)
  await expect
    .poll(() => page.locator('.waterbody-label.is-lake:not([hidden])').count())
    .toBeGreaterThan(0)
  await expect(page.locator('[data-waterbody-id="lake-baikal"]')).toBeVisible()

  await lakeToggle.focus()
  await expect(lakeToggle).toBeFocused()
  await lakeToggle.press('Enter')
  await expect(lakeToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.waterbody-label.is-lake')).toHaveCount(0)
  await expect(card).toBeVisible()

  await lakeToggle.press('Enter')
  await expect(lakeToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.waterbody-label.is-lake')).toHaveCount(20)
  await expect(page.locator('[data-waterbody-id="lake-baikal"]')).toBeVisible()

  await card.getByRole('button', { name: '关闭水域知识卡' }).click()
  await expect(card).toHaveCount(0)
  await expect(lakeToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.waterbody-label.is-lake')).toHaveCount(20)
  await page.getByRole('button', { name: '自动旋转：开' }).click()
  await expect(page.getByRole('button', { name: '自动旋转：关' })).toBeVisible()

  for (const lake of [
    { id: 'qinghai-lake', name: '青海湖' },
    { id: 'dead-sea', name: '死海' },
    { id: 'tonle-sap', name: '洞里萨湖' },
  ]) {
    await selectPlace(page, lake.name)

    const lakeCard = page.getByRole('complementary', {
      name: `${lake.name}水域知识卡`,
    })
    const lakeLabel = page.locator(
      `[data-waterbody-id="${lake.id}"].waterbody-label.is-lake`,
    )
    await expect(lakeCard).toBeVisible()
    await expect(lakeLabel).toBeVisible()
    await expect(lakeLabel).toHaveClass(/is-selected/)
    const leader = await lakeLabel.evaluate((element) => {
      const labelStyle = getComputedStyle(element)
      const leaderStyle = getComputedStyle(element, '::after')
      return {
        length: Number.parseFloat(
          labelStyle.getPropertyValue('--lake-label-leader-length'),
        ),
        width: Number.parseFloat(leaderStyle.width),
        content: leaderStyle.content,
      }
    })
    expect(leader.length).toBeGreaterThan(10)
    expect(leader.width).toBeGreaterThan(10)
    expect(leader.content).not.toBe('none')

    await lakeCard.getByRole('button', { name: '关闭水域知识卡' }).click()
    await expect(lakeCard).toHaveCount(0)
    await lakeLabel.click()
    await expect(lakeCard).toBeVisible()
  }
})

test('shows river and canal paths and keeps linear feature selection exclusive', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  await layerControl
    .getByRole('button', {
      name: '河流图层：世界重要河流与人工运河',
    })
    .click()
  await expect
    .poll(() => page.locator('[data-linear-feature-id]:not([hidden])').count())
    .toBeGreaterThan(0)
  await expect
    .poll(() =>
      page.locator('.linear-feature-label.is-river:not([hidden])').count(),
    )
    .toBeGreaterThan(0)
  await expect
    .poll(() =>
      page.locator('.linear-feature-label.is-canal:not([hidden])').count(),
    )
    .toBeGreaterThan(0)

  let search = await openCountrySearch(page)
  await search.fill('长江')
  await search.press('Enter')
  const riverCard = page.getByLabel('长江知识卡')
  await expect(riverCard).toBeVisible()
  await expect(riverCard.getByText(/资料来源/)).toHaveCount(0)
  await expect(
    riverCard.getByText('青藏高原唐古拉山脉', { exact: true }),
  ).toBeVisible()
  await expect(
    page.locator(
      '[data-linear-feature-id="yangtze-system"].linear-feature-label',
    ),
  ).toBeVisible()
  await expectSelectedLinearFeatureRoute(page, 'yangtze-system', '长江')

  search = await openCountrySearch(page)
  await search.fill('苏伊士运河')
  await search.press('Enter')
  const canalCard = page.getByLabel('苏伊士运河知识卡')
  await expect(canalCard).toBeVisible()
  await expect(canalCard.getByText('地中海', { exact: true })).toBeVisible()
  await expect(riverCard).toHaveCount(0)
  await expectSelectedLinearFeatureRoute(page, 'suez-canal', '苏伊士运河')

  search = await openCountrySearch(page)
  await search.fill('巴拿马运河')
  await search.press('Enter')
  await expect(page.getByLabel('巴拿马运河知识卡')).toBeVisible()
  await expectSelectedLinearFeatureRoute(page, 'panama-canal', '巴拿马运河')

  search = await openCountrySearch(page)
  await search.fill('科林斯运河')
  await search.press('Enter')
  const corinthCard = page.getByLabel('科林斯运河知识卡')
  await expect(corinthCard).toBeVisible()
  await expectSelectedLinearFeatureRoute(page, 'corinth-canal', '科林斯运河')

  await corinthCard.getByRole('button', { name: '关闭运河知识卡' }).click()
  await expect(page.getByTestId('selected-linear-feature-overlay')).toHaveCount(
    0,
  )
})

test('shows mountain ridges, highest peaks, and replaces global selection', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const mountainToggle = layerControl.getByRole('button', {
    name: '山脉图层：世界著名山脉与最高峰',
  })
  await mountainToggle.click()
  await expect(mountainToggle).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => page.locator('.mountain-range-label:not([hidden])').count())
    .toBeGreaterThan(0)

  await selectPlace(page, '珠穆朗玛峰')
  const himalayaCard = page.getByRole('complementary', {
    name: '喜马拉雅山脉知识卡',
  })
  await expect(himalayaCard).toBeVisible()
  await expect(himalayaCard.getByText(/资料来源/)).toHaveCount(0)
  await expect(
    himalayaCard.getByText('珠穆朗玛峰', { exact: true }),
  ).toBeVisible()
  await expectSelectedMountainRoute(page, 'himalayas', '喜马拉雅山脉')

  await mountainToggle.click()
  await expect(mountainToggle).toHaveAttribute('aria-pressed', 'false')
  await expectSelectedMountainRoute(page, 'himalayas', '喜马拉雅山脉')

  await selectPlace(page, '安第斯山脉')
  await expect(
    page.getByRole('complementary', { name: '安第斯山脉知识卡' }),
  ).toBeVisible()
  await expect(himalayaCard).toHaveCount(0)
  await expectSelectedMountainRoute(page, 'andes', '安第斯山脉')
  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
  await expect(page.getByTestId('selected-mountain-overlay')).toHaveAttribute(
    'data-mountain-detail',
    'high',
  )

  await selectPlace(page, '长江')
  await expect(page.getByLabel('长江知识卡')).toBeVisible()
  await expect(page.getByTestId('selected-mountain-overlay')).toHaveCount(0)
  await expect(page.getByTestId('selected-mountain-peak')).toHaveCount(0)
})

test('shows desert regions only while the layer is active', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const desertToggle = layerControl.getByRole('button', {
    name: '沙漠图层：世界主要沙漠与荒漠景观',
  })
  await expect(desertToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.desert-label')).toHaveCount(0)

  await desertToggle.click()
  await expect(desertToggle).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => page.locator('.desert-label:not([hidden])').count())
    .toBeGreaterThan(0)
  await desertToggle.click()
  await expect(desertToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.desert-label')).toHaveCount(0)

  await selectPlace(page, '撒哈拉')
  const saharaCard = page.getByRole('complementary', {
    name: '撒哈拉沙漠知识卡',
  })
  await expect(saharaCard).toBeVisible()
  await expect(saharaCard.getByText(/9,200,000 km²/)).toBeVisible()
  await expect(saharaCard.getByText(/不是生态分区/)).toHaveCount(0)
  await expect(saharaCard.getByText('代表坐标')).toHaveCount(0)
  await expect(saharaCard.getByText(/资料来源/)).toHaveCount(0)
  await expect(desertToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-desert-id="sahara"]')).toBeVisible()

  await desertToggle.click()
  await expect(desertToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(saharaCard).toBeVisible()
  await expect(page.locator('.desert-label')).toHaveCount(0)

  await selectPlace(page, '戈壁')
  await expect(desertToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('complementary', { name: '戈壁沙漠知识卡' }),
  ).toBeVisible()
  await expect(saharaCard).toHaveCount(0)
  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
  await expect(page.locator('[data-desert-id="gobi"]')).toBeVisible()
})

test('shows landmark points, searches the Great Wall, and keeps its card after hiding the layer', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const landmarkToggle = layerControl.getByRole('button', {
    name: '名胜古迹图层：世界著名文化与历史遗产',
  })
  await expect(landmarkToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.landmark-label')).toHaveCount(0)

  await landmarkToggle.focus()
  await expect(landmarkToggle).toBeFocused()
  await landmarkToggle.press('Enter')
  await expect(landmarkToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.landmark-label')).toHaveCount(30)
  await expect
    .poll(() => page.locator('.landmark-label:not([hidden])').count())
    .toBeGreaterThan(0)

  const search = await openCountrySearch(page)
  await search.fill('长城')
  await search.press('Enter')

  const card = page.getByRole('complementary', { name: '长城古迹知识卡' })
  await expect(card).toBeVisible()
  await expect(card.getByText('公元前7世纪至明代')).toBeVisible()
  await expect(card.getByText(/资料来源/)).toHaveCount(0)
  await expect(page.locator('[data-landmark-id="great-wall"]')).toBeVisible()

  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
  expect(
    await page.locator('.landmark-label:not([hidden])').count(),
  ).toBeLessThanOrEqual(16)
  await expect(page.locator('[data-landmark-id="great-wall"]')).toBeVisible()

  await landmarkToggle.click()
  await expect(landmarkToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.landmark-label')).toHaveCount(0)
  await expect(card).toBeVisible()

  await card.getByRole('button', { name: '关闭长城古迹知识卡' }).click()
  await expect(card).toHaveCount(0)
  await expect(landmarkToggle).toHaveAttribute('aria-pressed', 'false')

  const reopenedSearch = await openCountrySearch(page)
  await reopenedSearch.fill('长城')
  await reopenedSearch.press('Enter')
  await expect(card).toBeVisible()
  await expect(landmarkToggle).toHaveAttribute('aria-pressed', 'true')

  await card.getByRole('button', { name: '探索中国' }).click()
  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
  await expect(card).toHaveCount(0)
})

test('shows synchronized geography reference lines and opens curriculum knowledge', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const toggle = layerControl.getByRole('button', {
    name: '经纬图层：经度基准、半球界线、纬度分区线与五带分界线',
  })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('[data-reference-line-id]')).toHaveCount(0)

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  const card = page.getByRole('complementary', { name: '地球经纬线知识卡' })
  await expect(card).toBeVisible()
  await expect(card.getByRole('heading', { name: '地球经纬线' })).toBeVisible()
  await expect(card.getByText('当前视角判读')).toBeVisible()
  const categories = card.getByLabel('地球经纬线分类')
  await expect(categories.getByRole('heading', { level: 3 })).toHaveCount(4)
  await expect(
    card.getByLabel('经度基准经纬线').getByRole('button'),
  ).toHaveCount(2)
  await expect(
    card.getByLabel('半球界线经纬线').getByRole('button'),
  ).toHaveCount(3)
  await expect(
    card.getByLabel('纬度分区线经纬线').getByRole('button'),
  ).toHaveCount(4)
  await expect(
    card.getByLabel('五带分界线经纬线').getByRole('button'),
  ).toHaveCount(4)
  await expect(categories.getByRole('button')).toHaveCount(13)
  await expect(card.getByText(/条重点线/)).toHaveCount(0)
  await expect(card.getByText(/用纬线和经线为地球表面建立坐标/)).toHaveCount(0)
  await expect(
    page.locator('.world-mini-map-geography-layer line'),
  ).toHaveCount(13)
  await expect(page.locator('.geography-reference-label')).toHaveCount(13)
  await expect
    .poll(() =>
      page.locator('.geography-reference-label:not([hidden])').count(),
    )
    .toBeGreaterThan(0)
  await expect
    .poll(() =>
      page.locator('.geography-reference-label:not([hidden])').count(),
    )
    .toBeLessThan(13)

  const spatialTypography = await page.evaluate(() => {
    const globeLabel = document.querySelector(
      '.geography-reference-label:not([hidden])',
    )
    const diagramLabel = document.querySelector(
      '.geography-reference-diagram text',
    )
    if (!globeLabel || !diagramLabel) {
      throw new Error('Missing geography spatial label')
    }
    return {
      diagramLabel: Number.parseFloat(getComputedStyle(diagramLabel).fontSize),
      globeLabel: Number.parseFloat(getComputedStyle(globeLabel).fontSize),
    }
  })
  expect(spatialTypography.globeLabel).toBeGreaterThanOrEqual(10)
  expect(spatialTypography.globeLabel).toBeLessThan(11)
  expect(spatialTypography.diagramLabel).toBe(7)

  const cancerLabel = page.locator(
    '.geography-reference-label[data-reference-line-id="tropic-of-cancer"]',
  )
  await expect(cancerLabel).toBeVisible()
  await cancerLabel.click()
  await expect(card.getByRole('heading', { name: '北回归线' })).toBeVisible()
  await expect(card.getByText(/热带与北温带的分界线/)).toBeVisible()
  await expect(card.getByText('23.5°N', { exact: true })).toBeVisible()
  await expect(card.getByRole('button', { name: /南回归线/ })).toBeVisible()
  await expect(cancerLabel).toHaveClass(/is-selected/)
  await expect(cancerLabel).toBeVisible()

  await card.getByRole('button', { name: /南回归线/ }).click()
  await expect(card.getByRole('heading', { name: '南回归线' })).toBeVisible()
  await expect(
    page.locator(
      '.geography-reference-label[data-reference-line-id="tropic-of-capricorn"]',
    ),
  ).toHaveClass(/is-selected/)

  await card.getByRole('button', { name: '返回地球经纬线' }).click()
  await expect(card.getByRole('heading', { name: '地球经纬线' })).toBeVisible()
  await expect(card.getByLabel('五带分界线经纬线')).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(
    page.locator('.geography-reference-label.is-selected'),
  ).toHaveCount(0)

  for (const viewport of [
    { width: 1194, height: 834 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(card).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    const cardBox = await card.boundingBox()
    expect(cardBox).not.toBeNull()
    expect(cardBox!.x).toBeGreaterThanOrEqual(0)
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(viewport.width + 1)
  }

  await page.setViewportSize({ width: 1280, height: 720 })

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(card).toBeVisible()
  await expect(page.locator('.world-mini-map-geography-layer')).toHaveCount(0)
  await expect(page.locator('.geography-reference-label')).toHaveCount(0)

  const search = await openCountrySearch(page)
  await search.fill('东西半球')
  await expect(page.getByText('地理知识', { exact: true })).toBeVisible()
  await search.press('Enter')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(card.getByRole('heading', { name: '地球经纬线' })).toBeVisible()
  await expect(card.getByLabel('半球界线经纬线')).toHaveAttribute(
    'aria-current',
    'true',
  )
})

test('renders and classifies the synchronized world climate layer', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const toggle = page.getByRole('button', {
    name: '世界气候类型教学图层',
  })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  const climateCountry = page
    .locator('.world-mini-map-countries.is-climate-visible path')
    .first()
  await expect(climateCountry).toBeVisible()
  await expect
    .poll(async () =>
      climateCountry.evaluate((path) =>
        Number.parseFloat(
          getComputedStyle(path).fill.match(/[\d.]+(?=\))/)?.[0] ?? '1',
        ),
      ),
    )
    .toBeLessThan(0.2)

  const card = page.getByRole('complementary', {
    name: '世界气候类型知识卡',
  })
  await expect(card).toBeVisible()
  await expect(card.getByLabel('13类世界气候图例')).toBeVisible()
  const climateImage = page.getByTestId('world-mini-map-climate')
  const scene = page.getByTestId('globe-scene')
  await expect(climateImage).toHaveAttribute(
    'href',
    '/climate/climate-types-2048-v2.png',
  )
  await expect(scene).not.toHaveAttribute('data-climate-highlight-id')
  await expect(page.getByTestId('world-mini-map-climate-boundary')).toHaveCount(
    0,
  )

  const map = page.getByTestId('world-mini-map')
  const mapBox = await map.boundingBox()
  expect(mapBox).not.toBeNull()
  await page.mouse.click(
    mapBox!.x + mapBox!.width * ((116.4 + 180) / 360),
    mapBox!.y + mapBox!.height * ((90 - 39.9) / 180),
  )
  await expect(
    card.getByRole('heading', { name: '温带季风气候' }),
  ).toBeVisible()
  await expect(card.locator('.climate-current-reading')).toContainText(
    /\d+\.\d°N · \d+\.\d°E/,
  )
  await expect(page.getByTestId('world-mini-map-climate-marker')).toBeVisible()
  await expect(climateImage).toHaveAttribute(
    'href',
    '/climate/highlights-v2/balanced/temperate-monsoon.png',
  )
  await expect(scene).toHaveAttribute(
    'data-climate-highlight-id',
    'temperate-monsoon',
  )
  const climateBoundary = page.getByTestId('world-mini-map-climate-boundary')
  await expect(climateBoundary).toHaveAttribute(
    'href',
    '/climate/highlight-boundaries/balanced/temperate-monsoon.png',
  )
  await expect(climateBoundary).toHaveCSS('filter', /drop-shadow/)
  await expect(scene).toHaveAttribute(
    'data-climate-boundary-id',
    'temperate-monsoon',
  )

  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
  await expect(climateImage).toHaveAttribute(
    'href',
    '/climate/highlights-v2/low/temperate-monsoon.png',
  )
  await expect(climateBoundary).toHaveAttribute(
    'href',
    '/climate/highlight-boundaries/low/temperate-monsoon.png',
  )

  await card.getByRole('button', { name: '查看13类气候图例' }).click()
  await expect(climateImage).toHaveAttribute(
    'href',
    '/climate/climate-types-1024-v2.png',
  )
  await expect(scene).not.toHaveAttribute('data-climate-highlight-id')
  await expect(climateBoundary).toHaveCount(0)
  await expect(scene).not.toHaveAttribute('data-climate-boundary-id')

  await card.getByRole('button', { name: '热带雨林气候' }).click()
  await expect(climateImage).toHaveAttribute(
    'href',
    '/climate/highlights-v2/low/tropical-rainforest.png',
  )
  await expect(scene).toHaveAttribute(
    'data-climate-highlight-id',
    'tropical-rainforest',
  )
  await expect(climateBoundary).toHaveAttribute(
    'href',
    '/climate/highlight-boundaries/low/tropical-rainforest.png',
  )

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(card).toBeVisible()
  await expect(scene).not.toHaveAttribute('data-climate-highlight-id')
  await expect(page.getByTestId('world-mini-map-climate-boundary')).toHaveCount(
    0,
  )
  await expect(scene).not.toHaveAttribute('data-climate-boundary-id')

  const search = await openCountrySearch(page)
  await search.fill('地中海气候')
  await expect(page.getByText('气候知识', { exact: true })).toBeVisible()
  await search.press('Enter')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(card.getByRole('heading', { name: '地中海气候' })).toBeVisible()
  await expect(climateImage).toHaveAttribute(
    'href',
    '/climate/highlights-v2/low/mediterranean.png',
  )
  await expect(scene).toHaveAttribute(
    'data-climate-highlight-id',
    'mediterranean',
  )
  await expect(climateBoundary).toHaveAttribute(
    'href',
    '/climate/highlight-boundaries/low/mediterranean.png',
  )
  await expect(scene).toHaveAttribute(
    'data-climate-boundary-id',
    'mediterranean',
  )
})

for (const viewport of [
  { name: 'phone landscape', width: 844, height: 390 },
  { name: 'iPad landscape', width: 1194, height: 834 },
]) {
  test(`keeps geography learning controls usable on ${viewport.name}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        configurable: true,
        value: 5,
      })
      Object.defineProperty(navigator, 'platform', {
        configurable: true,
        value: 'MacIntel',
      })
    })
    await page.setViewportSize(viewport)
    await page.goto('/')

    const { fallback } = await waitForSceneOrFallback(page)
    if (await fallback.isVisible()) return

    await expectLayerToolbarSingleLine(page)
    const toggle = page.getByRole('button', {
      name: '经纬图层：经度基准、半球界线、纬度分区线与五带分界线',
    })
    await expect(toggle).toBeVisible()
    await toggle.click()

    const card = page.getByRole('complementary', {
      name: '地球经纬线知识卡',
    })
    await expect(card).toBeVisible()
    await waitForKnowledgeCardSettled(card)
    await expect(page.getByLabel('2D定位图当前中心判读')).toBeVisible()
    const cardBox = await card.boundingBox()
    expect(cardBox).not.toBeNull()
    expect(cardBox!.x).toBeGreaterThanOrEqual(0)
    expect(cardBox!.y).toBeGreaterThanOrEqual(0)
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(viewport.width + 1)
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(
      viewport.height + 1,
    )

    await page.getByRole('button', { name: '世界气候类型教学图层' }).click()
    const climateCard = page.getByRole('complementary', {
      name: '世界气候类型知识卡',
    })
    await expect(climateCard).toBeVisible()
    const climateCardBox = await climateCard.boundingBox()
    expect(climateCardBox).not.toBeNull()
    expect(climateCardBox!.x).toBeGreaterThanOrEqual(0)
    expect(climateCardBox!.y).toBeGreaterThanOrEqual(0)
    expect(climateCardBox!.x + climateCardBox!.width).toBeLessThanOrEqual(
      viewport.width + 1,
    )
    expect(climateCardBox!.y + climateCardBox!.height).toBeLessThanOrEqual(
      viewport.height + 1,
    )
  })
}

test('keeps geographic paths stable and suppresses hover while dragging', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { scene, fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  await page.getByRole('button', { name: '自动旋转：开' }).click()
  await expect(page.getByRole('button', { name: '自动旋转：关' })).toBeVisible()

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const riverToggle = layerControl.getByRole('button', {
    name: '河流图层：世界重要河流与人工运河',
  })
  const mountainToggle = layerControl.getByRole('button', {
    name: '山脉图层：世界著名山脉与最高峰',
  })
  await riverToggle.click()
  await mountainToggle.click()

  const riverLabel = page
    .locator('.linear-feature-label.is-river:visible')
    .first()
  await expect(riverLabel).toBeVisible()
  await riverLabel.hover()
  await expect(page.getByRole('tooltip')).toBeVisible()

  const canvasBox = await scene.locator('canvas').boundingBox()
  expect(canvasBox).not.toBeNull()
  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.82,
    canvasBox!.y + canvasBox!.height * 0.74,
  )
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await page.mouse.down()
  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.76,
    canvasBox!.y + canvasBox!.height * 0.7,
    { steps: 2 },
  )
  await expect(scene).toHaveAttribute('data-controls-interacting', 'true')
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.46,
    canvasBox!.y + canvasBox!.height * 0.52,
    { steps: 12 },
  )
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await page.mouse.up()

  await expect(riverToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(mountainToggle).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => page.locator('.linear-feature-label:not([hidden])').count())
    .toBeGreaterThan(0)
  await expect
    .poll(() => page.locator('.mountain-range-label:not([hidden])').count())
    .toBeGreaterThan(0)

  const restoredRiverLabel = page
    .locator('.linear-feature-label.is-river:visible')
    .first()
  await restoredRiverLabel.dispatchEvent('pointerover')
  await expect(page.getByRole('tooltip')).toBeVisible()
})

for (const viewport of [
  { name: 'desktop', width: 1280, height: 720, touch: false },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
  { name: 'iPad landscape', width: 1194, height: 834, touch: true },
]) {
  test(`keeps the selected canal route visible on ${viewport.name}`, async ({
    page,
  }) => {
    if (viewport.touch) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          configurable: true,
          value: 5,
        })
        Object.defineProperty(navigator, 'platform', {
          configurable: true,
          value: 'MacIntel',
        })
      })
    }
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto('/')

    const { fallback } = await waitForSceneOrFallback(page)
    if (await fallback.isVisible()) return

    await expectLayerToolbarSingleLine(page)

    await selectPlace(page, '科林斯运河')
    await expect(page.getByLabel('科林斯运河知识卡')).toBeVisible()
    await expectSelectedLinearFeatureRoute(page, 'corinth-canal', '科林斯运河')

    await selectPlace(page, '阿尔卑斯山脉')
    await expect(
      page.getByRole('complementary', { name: '阿尔卑斯山脉知识卡' }),
    ).toBeVisible()
    await expectSelectedMountainRoute(page, 'alps', '阿尔卑斯山脉')
    await expectLayerToolbarSingleLine(page)
  })
}

test('keeps the selected canal enhancement visible in low quality mode', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
  await selectPlace(page, '苏伊士运河')
  await expectSelectedLinearFeatureRoute(page, 'suez-canal', '苏伊士运河')
})

test('keeps capital labels synchronized during automatic rotation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  await page.getByRole('button', { name: '首都' }).click()
  const marker = page.getByTestId('world-mini-map-view-marker')
  const labelLayer = page.locator('.globe-city-labels')
  await expect
    .poll(() => labelLayer.locator('.city-label:not([hidden])').count())
    .toBeGreaterThan(0)

  const firstTransform = await marker.getAttribute('transform')
  await expect
    .poll(() => marker.getAttribute('transform'), { timeout: 6_000 })
    .not.toBe(firstTransform)

  const snapshots = await labelLayer
    .locator('.city-label')
    .evaluateAll((labels) =>
      Object.fromEntries(
        labels
          .filter((label) => !(label as HTMLElement).hidden)
          .map((label) => [
            (label as HTMLElement).dataset.cityId ?? '',
            (label as HTMLElement).style.transform,
          ]),
      ),
    )

  await expect
    .poll(
      async () => {
        const current = await labelLayer
          .locator('.city-label')
          .evaluateAll((labels) =>
            Object.fromEntries(
              labels
                .filter((label) => !(label as HTMLElement).hidden)
                .map((label) => [
                  (label as HTMLElement).dataset.cityId ?? '',
                  (label as HTMLElement).style.transform,
                ]),
            ),
          )
        return Object.entries(snapshots).some(
          ([cityId, transform]) =>
            current[cityId] !== undefined && current[cityId] !== transform,
        )
      },
      { timeout: 6_000 },
    )
    .toBe(true)
})

test('keeps a selected city label synchronized throughout a fast drag', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { scene, fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  await page.getByRole('button', { name: '自动旋转：开' }).click()
  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
  await selectPlace(page, '中国')
  await page
    .getByLabel('中国国家知识卡')
    .getByRole('button', { name: '探索城市上海' })
    .click()

  const label = page.locator('[data-city-id="cn-shanghai"]')
  await expect(label).toBeVisible()
  await page.waitForTimeout(1_300)
  await label.evaluate((element) => {
    const metrics = { transformMutations: 0, hiddenMutations: 0 }
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === 'style') metrics.transformMutations += 1
        if (record.attributeName === 'hidden') metrics.hiddenMutations += 1
      }
    })
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['hidden', 'style'],
    })
    ;(
      window as typeof window & {
        __cityLabelSyncMetrics?: {
          metrics: typeof metrics
          observer: MutationObserver
        }
      }
    ).__cityLabelSyncMetrics = { metrics, observer }
  })

  const canvasBox = await scene.locator('canvas').boundingBox()
  expect(canvasBox).not.toBeNull()
  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.5,
    canvasBox!.y + canvasBox!.height * 0.48,
  )
  await page.mouse.down()
  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.52,
    canvasBox!.y + canvasBox!.height * 0.49,
    { steps: 2 },
  )
  await expect(scene).toHaveAttribute('data-controls-interacting', 'true')
  const firstDragTransform = await label.getAttribute('style')

  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.57,
    canvasBox!.y + canvasBox!.height * 0.51,
    { steps: 12 },
  )
  await expect
    .poll(() => label.getAttribute('style'))
    .not.toBe(firstDragTransform)
  await expect(label).toBeVisible()
  await expect(scene).toHaveAttribute('data-controls-interacting', 'true')
  const mutationMetrics = await label.evaluate(() => {
    const state = (
      window as typeof window & {
        __cityLabelSyncMetrics?: {
          metrics: { transformMutations: number; hiddenMutations: number }
          observer: MutationObserver
        }
      }
    ).__cityLabelSyncMetrics
    state?.observer.disconnect()
    return state?.metrics
  })
  expect(mutationMetrics?.transformMutations).toBeGreaterThanOrEqual(3)
  expect(mutationMetrics?.hiddenMutations).toBe(0)
  await page.mouse.up()
})

test('does not replay a stale city camera target after dragging', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const { scene, fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const search = await openCountrySearch(page)
  await search.fill('中国')
  await search.press('Enter')
  const countryCard = page.getByLabel('中国国家知识卡')
  await countryCard.getByRole('button', { name: '探索城市上海' }).click()
  await expect(page.getByLabel('上海城市知识卡')).toBeVisible()

  const marker = page.getByTestId('world-mini-map-view-marker')
  await page.waitForTimeout(1_300)
  const cityTransform = await marker.getAttribute('transform')
  const sceneBox = await scene.boundingBox()
  expect(sceneBox).not.toBeNull()

  await page.mouse.move(
    sceneBox!.x + sceneBox!.width * 0.5,
    sceneBox!.y + sceneBox!.height * 0.48,
  )
  await page.mouse.down()
  await page.mouse.move(
    sceneBox!.x + sceneBox!.width * 0.72,
    sceneBox!.y + sceneBox!.height * 0.55,
    { steps: 10 },
  )
  await page.mouse.up()

  await expect
    .poll(() => marker.getAttribute('transform'))
    .not.toBe(cityTransform)
  const cityPoint = parseMiniMapTransform(cityTransform)
  expect(cityPoint).not.toBeNull()
  await page.waitForTimeout(1_500)
  const settledPoint = parseMiniMapTransform(
    await marker.getAttribute('transform'),
  )
  expect(settledPoint).not.toBeNull()
  expect(
    Math.hypot(settledPoint!.x - cityPoint!.x, settledPoint!.y - cityPoint!.y),
  ).toBeGreaterThan(8)
})

test('keeps the full 2D map visible in touch landscape', async ({ page }) => {
  test.setTimeout(45_000)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })
    Object.defineProperty(navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    })
  })
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const toggle = page.getByRole('button', { name: '定位图' })
  const map = page.getByTestId('world-mini-map')
  await expect(toggle).toBeHidden()
  await expect(map).toBeVisible()

  const headerTypography = await page.evaluate(() => {
    const header = document.querySelector('.world-mini-map-header')
    const label = header?.querySelector('span')
    const output = header?.querySelector('output')
    if (!header || !label || !output) {
      throw new Error('Missing world mini-map header typography')
    }
    const headerBox = header.getBoundingClientRect()
    const labelStyle = getComputedStyle(label)
    const outputStyle = getComputedStyle(output)
    return {
      height: headerBox.height,
      labelFontSize: labelStyle.fontSize,
      labelFontWeight: labelStyle.fontWeight,
      outputFontSize: outputStyle.fontSize,
      outputFontWeight: outputStyle.fontWeight,
    }
  })
  expect(headerTypography.height).toBeLessThanOrEqual(38)
  expect(headerTypography.labelFontSize).toBe('10px')
  expect(headerTypography.outputFontSize).toBe('10px')
  expect(headerTypography.labelFontWeight).toBe('400')
  expect(headerTypography.outputFontWeight).toBe('400')

  await map.locator('[data-country-code="CN"]').click()
  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
  await expect(map).toBeVisible()
})

test('keeps the layer panel inside an iPad landscape safe area', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })
    Object.defineProperty(navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    })
  })
  await page.setViewportSize({ width: 1194, height: 834 })
  await page.goto('/')

  const { fallback } = await waitForSceneOrFallback(page)
  if (await fallback.isVisible()) return

  const layerControl = page.getByRole('region', { name: '地球图层控制' })
  const box = await layerControl.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(11)
  expect(box!.y).toBeGreaterThanOrEqual(11)
  expect(box!.x + box!.width).toBeLessThanOrEqual(1194 - 11)
  expect(box!.y + box!.height).toBeLessThanOrEqual(834 - 11)
  const toolbarLayout = await layerControl.evaluate((element) => {
    const options = element.querySelector<HTMLElement>(
      '.layer-control-options',
    )!
    const buttonTops = Array.from(
      options.querySelectorAll<HTMLButtonElement>('button'),
      (button) => button.getBoundingClientRect().top,
    )
    return {
      clientWidth: options.clientWidth,
      scrollWidth: options.scrollWidth,
      buttonCount: buttonTops.length,
      rowSpread: Math.max(...buttonTops) - Math.min(...buttonTops),
    }
  })
  expect(toolbarLayout.buttonCount).toBe(11)
  expect(toolbarLayout.scrollWidth).toBeLessThanOrEqual(
    toolbarLayout.clientWidth + 1,
  )
  expect(toolbarLayout.rowSpread).toBeLessThan(2)

  await layerControl.getByRole('button', { name: '首都' }).click()
  await layerControl.getByRole('button', { name: '城市' }).click()
  await expect(
    layerControl.getByRole('button', { name: '首都' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    layerControl.getByRole('button', { name: '城市' }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('shows the fallback instead of crashing without WebGL', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext.bind(
      document.createElement('canvas'),
    )
    HTMLCanvasElement.prototype.getContext = ((contextId: string) => {
      if (contextId === 'webgl' || contextId === 'webgl2') return null
      return originalGetContext(contextId as '2d')
    }) as typeof HTMLCanvasElement.prototype.getContext
  })

  await page.goto('/')

  await expect(page.getByTestId('webgl-fallback')).toBeVisible()
  await expect(page.getByTestId('globe-scene')).toHaveCount(0)
  await expect(page.getByTestId('world-mini-map')).toBeVisible()
  const search = await openCountrySearch(page)
  await search.fill('中国')
  await search.press('Enter')
  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
  const mountainSearch = await openCountrySearch(page)
  await mountainSearch.fill('Everest')
  await mountainSearch.press('Enter')
  await expect(
    page.getByRole('complementary', { name: '喜马拉雅山脉知识卡' }),
  ).toBeVisible()
  const climateSearch = await openCountrySearch(page)
  await climateSearch.fill('世界气候类型')
  await climateSearch.press('Enter')
  await expect(
    page.getByRole('complementary', { name: '世界气候类型知识卡' }),
  ).toBeVisible()
  const fallbackClimateImage = page.getByTestId('world-mini-map-climate')
  await expect(fallbackClimateImage).toHaveAttribute(
    'href',
    '/climate/climate-types-2048-v2.png',
  )
  const climateTypeSearch = await openCountrySearch(page)
  await climateTypeSearch.fill('热带雨林气候')
  await climateTypeSearch.press('Enter')
  await expect(fallbackClimateImage).toHaveAttribute(
    'href',
    '/climate/highlights-v2/balanced/tropical-rainforest.png',
  )
  await expect(
    page.getByTestId('world-mini-map-climate-boundary'),
  ).toHaveAttribute(
    'href',
    '/climate/highlight-boundaries/balanced/tropical-rainforest.png',
  )
  await expect(page.getByRole('region', { name: '地球图层控制' })).toHaveCount(
    0,
  )
})

test('respects the system reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(
    page.getByRole('button', { name: '自动旋转：关' }),
  ).toBeDisabled()
})

test('reloads the core experience while offline', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: '搜索地点' })).toBeVisible()
    const scene = page.getByTestId('globe-scene')
    if (await scene.isVisible()) {
      await expect(page.getByTestId('world-mini-map')).toBeVisible()
    }
  } finally {
    await context.setOffline(false)
  }
})

test('searches China and opens the featured knowledge card', async ({
  page,
}) => {
  await page.goto('/')

  const search = await openCountrySearch(page)
  await search.fill('中国')
  await search.press('Enter')

  const card = page.getByLabel('中国国家知识卡')
  await expect(card).toBeVisible()
  await expect(card.getByRole('heading', { name: '中国' })).toBeVisible()
  await expect(card.getByAltText('中国国旗')).toHaveAttribute(
    'src',
    '/flags/cn.svg',
  )
  await expect(card.getByRole('button', { name: '探索城市北京' })).toBeVisible()
  await expect(card.getByText('人民币（CNY）')).toBeVisible()
  await expect(card.getByText('中国香港')).toBeVisible()
  await expect(card.getByText('中国澳门')).toBeVisible()
  await expect(
    card.getByText('大熊猫主要生活在四川、陕西和甘肃的山地森林中。'),
  ).toBeVisible()
})

test('resets the globe view to China', async ({ page }) => {
  await page.goto('/')

  const search = await openCountrySearch(page)
  await search.fill('法国')
  await search.press('Enter')
  await expect(page.getByLabel('法国国家知识卡')).toBeVisible()

  await page.getByRole('button', { name: '重置视角' }).click()

  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
  const resetSearch = await openCountrySearch(page)
  await expect(resetSearch).toHaveValue('中国')
})

test('searches a microstate without Natural Earth geometry', async ({
  page,
}) => {
  await page.goto('/')

  const search = await openCountrySearch(page)
  await search.fill('Vatican')
  await search.press('Enter')

  const card = page.getByLabel('梵蒂冈国家知识卡')
  await expect(card).toBeVisible()
  await expect(
    card.getByRole('button', { name: '探索城市梵蒂冈城' }),
  ).toBeVisible()
  await expect(card.getByText('梵蒂冈城国')).toBeVisible()
  await expect(card.getByText('0.44 km²')).toBeVisible()
  await expect(card.getByText('拉丁语')).toBeVisible()
  await expect(card.getByText('更多内容制作中')).toHaveCount(0)
})

test('selects a sovereign neighbour and opens the new country card', async ({
  page,
}) => {
  await page.goto('/')

  const search = await openCountrySearch(page)
  await search.fill('Vatican')
  await search.press('Enter')
  const vaticanCard = page.getByLabel('梵蒂冈国家知识卡')

  await vaticanCard.getByRole('button', { name: '探索邻国意大利' }).click()

  const italyCard = page.getByLabel('意大利国家知识卡')
  await expect(italyCard).toBeVisible()
  await expect(italyCard.getByRole('heading', { name: '意大利' })).toBeVisible()
  await expect(italyCard.getByText('意大利共和国')).toBeVisible()
  const italySearch = await openCountrySearch(page)
  await expect(italySearch).toHaveValue('意大利')
})

test('expands compact knowledge-card lists with the keyboard and resets them on navigation', async ({
  page,
}) => {
  await page.goto('/')

  const search = await openCountrySearch(page)
  await search.fill('CN')
  await search.press('Enter')
  const card = page.getByLabel('中国国家知识卡')

  await expect(card.getByRole('button', { name: '探索城市成都' })).toHaveCount(
    0,
  )
  const cityExpand = card.getByRole('button', {
    name: '查看全部主要城市（5）',
  })
  await cityExpand.focus()
  await page.keyboard.press('Enter')
  await expect(card.getByRole('button', { name: '探索城市成都' })).toBeVisible()

  const borderExpand = card.getByRole('button', {
    name: '查看全部相邻国家（14）',
  })
  await borderExpand.focus()
  await page.keyboard.press('Space')
  await card.getByRole('button', { name: '探索邻国俄罗斯' }).click()

  const russiaCard = page.getByLabel('俄罗斯国家知识卡')
  await expect(russiaCard).toBeVisible()
  await russiaCard.getByRole('button', { name: '探索邻国中国' }).click()

  const resetCard = page.getByLabel('中国国家知识卡')
  await expect(
    resetCard.getByRole('button', { name: '查看全部主要城市（5）' }),
  ).toHaveAttribute('aria-expanded', 'false')
  await expect(
    resetCard.getByRole('button', { name: '查看全部相邻国家（14）' }),
  ).toHaveAttribute('aria-expanded', 'false')
  await expect(resetCard.getByText(/资料来源/)).toHaveCount(0)
})

test('uses the mobile bottom sheet for country details', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const search = await openCountrySearch(page)
  await search.fill('CN')
  await search.press('Enter')

  const card = page.getByLabel('中国国家知识卡')
  await expect(card).toBeVisible()
  await page.waitForTimeout(450)
  const box = await card.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeLessThanOrEqual(1)
  expect(box!.width).toBeGreaterThanOrEqual(389)
  expect(box!.y + box!.height).toBeGreaterThanOrEqual(843)
  await expect(
    page.getByRole('button', { name: '关闭国家知识卡' }),
  ).toBeVisible()
  await expect(card.getByText('面积')).toBeVisible()
})

test('opens a country card from the offline cache', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    const search = await openCountrySearch(page)
    await search.fill('中国')
    await search.press('Enter')
    await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
    await expect(page.getByAltText('中国国旗')).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
