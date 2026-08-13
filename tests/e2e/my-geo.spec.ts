import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openCountrySearch(page: Page) {
  const trigger = page.getByRole('button', { name: '搜索国家' })
  await trigger.click()
  const search = page.getByRole('combobox', { name: '搜索国家' })
  await expect(search).toBeFocused()
  return search
}

async function waitForSceneOrFallback(page: Page) {
  const scene = page.getByTestId('globe-scene')
  const fallback = page.getByTestId('webgl-fallback')
  await expect(scene.or(fallback)).toBeVisible({ timeout: 15_000 })
  return { scene, fallback }
}

test('loads the responsive My Geo exploration shell', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '转动地球，发现每一片土地' }),
  ).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'My Geo 首页' })).toHaveCount(0)
  await expect(page.getByText('MY GEO · EARTH EXPLORATION LAB')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '搜索国家' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: '搜索国家' })).toHaveCount(0)

  const { scene } = await waitForSceneOrFallback(page)

  if (await scene.isVisible()) {
    await expect(page.getByTestId('world-mini-map')).toBeVisible()
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
  await expect(map).toBeVisible()
  await expect(page.getByRole('button', { name: '定位图' })).toBeHidden()
  await expect(controls).toBeVisible()

  const mapBox = await map.boundingBox()
  const controlsBox = await controls.boundingBox()
  expect(mapBox).not.toBeNull()
  expect(controlsBox).not.toBeNull()
  expect(mapBox!.x + mapBox!.width).toBeLessThanOrEqual(controlsBox!.x)

  const search = await openCountrySearch(page)
  await expect(search).toBeVisible()
  const dialogBox = await page
    .getByRole('dialog', { name: '搜索国家' })
    .boundingBox()
  const results = page.getByRole('listbox', { name: '国家搜索结果' })
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
    await expect(page.getByRole('button', { name: '搜索国家' })).toBeVisible()
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
  await expect(card.getByText('北京', { exact: true })).toBeVisible()
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
  await expect(card.getByText('梵蒂冈城', { exact: true })).toBeVisible()
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
