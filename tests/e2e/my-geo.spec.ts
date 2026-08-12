import { expect, test } from '@playwright/test'

test('loads the responsive My Geo exploration shell', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '转动地球，发现每一片土地' }),
  ).toHaveCount(0)
  await expect(page.getByText('My Geo', { exact: true })).toBeVisible()

  const scene = page.getByTestId('globe-scene')
  const fallback = page.getByTestId('webgl-fallback')
  await expect(scene.or(fallback)).toBeVisible()

  if (await scene.isVisible()) {
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
    icons: Array<{ src: string }>
  }

  expect(manifest.name).toContain('My Geo')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons).toHaveLength(3)
})

test('keeps controls reachable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '转动地球，发现每一片土地' }),
  ).toHaveCount(0)

  const scene = page.getByTestId('globe-scene')
  if (await scene.isVisible()) {
    await expect(page.getByRole('button', { name: '重置视角' })).toBeVisible()
  }
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
    await expect(page.getByText('My Geo', { exact: true })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})

test('searches China and opens the featured knowledge card', async ({
  page,
}) => {
  await page.goto('/')

  const search = page.getByRole('combobox', { name: '搜索国家' })
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

  const search = page.getByRole('combobox', { name: '搜索国家' })
  await search.fill('法国')
  await search.press('Enter')
  await expect(page.getByLabel('法国国家知识卡')).toBeVisible()

  await page.getByRole('button', { name: '重置视角' }).click()

  await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
  await expect(search).toHaveValue('中国')
})

test('searches a microstate without Natural Earth geometry', async ({
  page,
}) => {
  await page.goto('/')

  const search = page.getByRole('combobox', { name: '搜索国家' })
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

  const search = page.getByRole('combobox', { name: '搜索国家' })
  await search.fill('Vatican')
  await search.press('Enter')
  const vaticanCard = page.getByLabel('梵蒂冈国家知识卡')

  await vaticanCard.getByRole('button', { name: '探索邻国意大利' }).click()

  const italyCard = page.getByLabel('意大利国家知识卡')
  await expect(italyCard).toBeVisible()
  await expect(italyCard.getByRole('heading', { name: '意大利' })).toBeVisible()
  await expect(italyCard.getByText('意大利共和国')).toBeVisible()
  await expect(search).toHaveValue('意大利')
})

test('expands the local knowledge-card sources', async ({ page }) => {
  await page.goto('/')

  const search = page.getByRole('combobox', { name: '搜索国家' })
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

  const search = page.getByRole('combobox', { name: '搜索国家' })
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
    const search = page.getByRole('combobox', { name: '搜索国家' })
    await search.fill('中国')
    await search.press('Enter')
    await expect(page.getByLabel('中国国家知识卡')).toBeVisible()
    await expect(page.getByAltText('中国国旗')).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
