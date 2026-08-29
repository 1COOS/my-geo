import { expect, test } from '@playwright/test'

const waterViewports = [
  { name: '1440 desktop', width: 1440, height: 900 },
  { name: 'iPad landscape', width: 1194, height: 834 },
  { name: 'phone landscape', width: 844, height: 390 },
]

for (const viewport of waterViewports) {
  test(`matches the knowledge overview contract on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/knowledge/water')

    await expect(page.getByRole('heading', { name: '水域' })).toBeVisible()
    await expect(page.getByTestId('knowledge-water-map')).toBeVisible()
    await expect(page.locator('[data-waterbody-id]')).toHaveCount(37)
    await expect(page.getByLabel('水域对象分类').getByRole('link')).toHaveCount(
      37,
    )
    await expect(page.getByRole('tab', { name: '海洋' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    const mapCard = page.locator('.knowledge-earth-map-card')
    const mapBox = await mapCard.boundingBox()
    expect(mapBox).not.toBeNull()
    expect(mapBox!.width / mapBox!.height).toBeCloseTo(36 / 17, 1)

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - innerWidth,
      root: document.documentElement.scrollWidth - innerWidth,
    }))
    expect(overflow.body).toBeLessThanOrEqual(0)
    expect(overflow.root).toBeLessThanOrEqual(0)

    const activeTopic = page.locator('.knowledge-topic-card.is-active')
    const topicGrid = page.locator('.knowledge-topic-grid')
    const [activeBox, gridBox] = await Promise.all([
      activeTopic.boundingBox(),
      topicGrid.boundingBox(),
    ])
    expect(activeBox).not.toBeNull()
    expect(gridBox).not.toBeNull()
    expect(activeBox!.x).toBeGreaterThanOrEqual(gridBox!.x - 1)
    expect(activeBox!.x + activeBox!.width).toBeLessThanOrEqual(
      gridBox!.x + gridBox!.width + 1,
    )

    await page.getByRole('tab', { name: '水域' }).click()
    await expect(page).toHaveURL(/\/knowledge\/water\?layer=waterway$/)
    await expect(page.locator('[data-waterbody-id]')).toHaveCount(14)
    await expect(
      page.getByLabel('水域对象分类').getByRole('heading', { level: 2 }),
    ).toHaveText(['海峡', '海沟'])
  })
}

test('groups lakes by world region and keeps every 3D lake', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1194, height: 834 })
  await page.goto('/knowledge/water?layer=lake')

  await expect(page.locator('[data-waterbody-id]')).toHaveCount(20)
  await expect(
    page.getByLabel('水域对象分类').getByRole('heading', { level: 2 }),
  ).toHaveText(['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲'])
  await expect(page.getByLabel('水域对象分类').getByRole('link')).toHaveCount(
    20,
  )
})

test('opens an object detail and follows its 3D deep link', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1194, height: 834 })
  await page.goto('/knowledge/water?layer=river')

  await expect(page.locator('[data-linear-feature-kind="river"]')).toHaveCount(
    30,
  )
  await expect(page.locator('[data-linear-feature-kind="canal"]')).toHaveCount(
    10,
  )
  await page
    .getByLabel('水域对象分类')
    .getByRole('link', { name: /亚马孙河/ })
    .click()

  await expect(page).toHaveURL(
    /\/knowledge\/water\/linear-features\/amazon-system\?layer=river$/,
  )
  await expect(
    page.getByRole('complementary', { name: '亚马孙河河流详情' }),
  ).toBeVisible()
  await expect(page.getByLabel('知识主题')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '← 返回河流' })).toBeVisible()
  await expect(page.getByTestId('knowledge-water-map')).toBeInViewport()
  await expect(page.getByText('所属图层')).toBeVisible()

  await page.getByRole('link', { name: /在3D地球上查看/ }).click()
  await expect(page).toHaveURL(/\/explore\?linearFeature=amazon-system$/)
  await expect(page.getByLabel('亚马孙河知识卡')).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: '河流图层：世界重要河流与人工运河',
    }),
  ).toHaveAttribute('aria-pressed', 'true')
})
