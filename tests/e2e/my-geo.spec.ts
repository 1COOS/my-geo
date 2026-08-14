import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openCountrySearch(page: Page) {
  const trigger = page.getByRole('button', { name: '搜索地点' })
  await trigger.click()
  const search = page.getByRole('combobox', { name: '搜索地点' })
  await expect(search).toBeFocused()
  return search
}

async function waitForSceneOrFallback(page: Page) {
  const scene = page.getByTestId('globe-scene')
  const fallback = page.getByTestId('webgl-fallback')
  await expect(scene.or(fallback)).toBeVisible({ timeout: 15_000 })
  return { scene, fallback }
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
  expect(layout.buttonCount).toBe(7)
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1)
  expect(layout.rowSpread).toBeLessThan(2)
}

function parseMiniMapTransform(transform: string | null) {
  const match = transform?.match(/translate\(([-\d.]+)(?:\s|,)\s*([-\d.]+)\)/)
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null
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
    const layerControl = page.getByRole('region', { name: '地球图层控制' })
    const capitals = layerControl.getByRole('button', { name: '首都' })
    const cities = layerControl.getByRole('button', { name: '城市' })
    const rivers = layerControl.getByRole('button', {
      name: '河流图层：世界重要河流水系',
    })
    const canals = layerControl.getByRole('button', {
      name: '运河图层：重要人工运河',
    })
    const mountains = layerControl.getByRole('button', {
      name: '山脉图层：世界著名山脉与最高峰',
    })
    await expect(layerControl).toBeVisible()
    await expect(capitals).toHaveAttribute('aria-pressed', 'false')
    await expect(cities).toHaveAttribute('aria-pressed', 'false')
    await expect(rivers).toHaveAttribute('aria-pressed', 'false')
    await expect(canals).toHaveAttribute('aria-pressed', 'false')
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

test('exposes a valid PWA manifest', async ({ request }) => {
  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBeTruthy()

  const manifest = (await manifestResponse.json()) as {
    name: string
    display: string
    orientation: string
    icons: Array<{ src: string }>
  }

  expect(manifest.name).toContain('My Geo')
  expect(manifest.display).toBe('standalone')
  expect(manifest.orientation).toBe('landscape')
  expect(manifest.icons).toHaveLength(3)
})

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

  const shanghai = card.getByRole('button', { name: '探索城市上海' })
  await expect(shanghai).toBeVisible()
  await shanghai.click({ force: true })
  const cityCard = page.getByLabel('上海城市知识卡')
  await expect(cityCard).toBeVisible()
  await expect(cityCard.getByText('经济中心')).toBeVisible()
  await expect(cityCard.getByText(/31\.1667°N/)).toBeVisible()
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
  test(`reserves a ${viewport.width}px desktop stage for the globe beside country details`, async ({
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
    expect(initialSceneBox!.width).toBeLessThan(viewport.width * 0.75)

    const search = await openCountrySearch(page)
    await search.fill('中国')
    await search.press('Enter')

    const card = page.getByLabel('中国国家知识卡')
    const controls = page.getByRole('navigation', { name: '地球显示控制' })
    const map = page.getByTestId('world-mini-map')
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
    await expect
      .poll(
        async () => (await card.boundingBox())?.y ?? Number.POSITIVE_INFINITY,
      )
      .toBeLessThanOrEqual(13)
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
  await expect(page.getByLabel('法国国家知识卡')).toHaveCount(0)
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
  await expect(page.locator('[data-city-id="cn-shanghai"]')).toBeVisible()
  await expect(cityCard.getByRole('heading', { name: '上海' })).toBeVisible()
  await expect(cityCard.getByText('世界知名')).toBeVisible()
  await cityCard.getByText(/资料来源/).click()
  await expect(
    cityCard.getByText('SimpleMaps World Cities Database'),
  ).toBeVisible()
})

test('toggles waterbody layers, searches a sea, and replaces its selected range', async ({
  page,
}) => {
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
  await expect(mediterraneanCard.getByText(/不代表领海/)).toBeVisible()
  await expect(
    page.locator('[data-waterbody-id="mediterranean-sea"]'),
  ).toBeVisible()

  search = await openCountrySearch(page)
  await search.fill('马里亚纳海沟')
  await search.press('Enter')
  await expect(page.getByLabel('马里亚纳海沟水域知识卡')).toBeVisible()
  await expect(mediterraneanCard).toHaveCount(0)

  await page.getByRole('button', { name: '画质：平衡' }).click()
  await expect(page.getByRole('button', { name: '画质：节能' })).toBeVisible()
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
    .getByRole('button', { name: '河流图层：世界重要河流水系' })
    .click()
  await layerControl
    .getByRole('button', { name: '运河图层：重要人工运河' })
    .click()
  await expect
    .poll(() => page.locator('[data-linear-feature-id]:not([hidden])').count())
    .toBeGreaterThan(0)

  let search = await openCountrySearch(page)
  await search.fill('长江')
  await search.press('Enter')
  const riverCard = page.getByLabel('长江知识卡')
  await expect(riverCard).toBeVisible()
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

for (const viewport of [
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
  expect(toolbarLayout.buttonCount).toBe(7)
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
  await expect(page.getByTestId('world-mini-map')).toHaveCount(0)
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

test('expands the local knowledge-card sources', async ({ page }) => {
  await page.goto('/')

  const search = await openCountrySearch(page)
  await search.fill('CN')
  await search.press('Enter')
  const card = page.getByLabel('中国国家知识卡')

  await card.getByText('资料来源（3）').click()
  await expect(
    card.getByRole('link', { name: 'China overview' }),
  ).toHaveAttribute('href', 'https://www.britannica.com/place/China')
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
  await expect(card.getByText('地理概览')).toBeVisible()
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
