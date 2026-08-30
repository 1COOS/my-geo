import { expect, test } from '@playwright/test'

const waterViewports = [
  { name: '1440 desktop', width: 1440, height: 900 },
  { name: 'iPad landscape', width: 1194, height: 834 },
  { name: 'phone landscape', width: 844, height: 390 },
]

for (const viewport of waterViewports) {
  test(`uses the two-level water atlas on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/knowledge/water')

    await expect(page).toHaveURL(/\/knowledge\/water\?layer=ocean$/)
    await expect(page.getByRole('heading', { name: '江河湖海' })).toHaveClass(
      'sr-only',
    )
    await expect(page.getByRole('tab')).toHaveText([
      '海洋',
      '湖泊',
      '海峡·海沟',
      '河流',
    ])
    await expect(page.locator('[data-waterbody-id]')).toHaveCount(37)
    await expect(page.getByLabel('海洋分组').getByRole('link')).toHaveCount(3)
    const oceanGroups = page.getByLabel('海洋分组')
    await expect(oceanGroups).toContainText('海湾6 个Gulfs and Bays')
    await expect(oceanGroups).not.toContainText('海湾是海水向陆地凹入')
    await expectNoPageScroll(page)

    const [mapBox, groupBox] = await Promise.all([
      page.locator('.knowledge-earth-map-card').boundingBox(),
      page.getByLabel('海洋分组').boundingBox(),
    ])
    expect(mapBox).not.toBeNull()
    expect(groupBox).not.toBeNull()
    expect(mapBox!.width / mapBox!.height).toBeCloseTo(36 / 17, 1)
    expect(mapBox!.y + mapBox!.height).toBeLessThanOrEqual(groupBox!.y + 1)

    await page.getByRole('tab', { name: '湖泊' }).click()
    await expect(page).toHaveURL(/\/knowledge\/water\?layer=lake$/)
    await expect(page.locator('[data-waterbody-id]')).toHaveCount(20)
    const worldLakes = page.getByTestId('knowledge-water-group-world-lakes')
    await expect(worldLakes).toContainText('世界湖泊20 个World Lakes')
    await worldLakes.click()

    await expect(page).toHaveURL(/\/knowledge\/water\/groups\/world-lakes$/)
    await expect(page.getByLabel('知识主题')).toHaveCount(0)
    await expect(
      page.getByRole('complementary', { name: '世界湖泊水域分组知识' }),
    ).toBeVisible()
    await expect(
      page.getByRole('complementary', { name: '世界湖泊水域分组知识' }),
    ).toContainText('世界代表性湖泊分布在不同气候和地形区')
    await expect(page.getByLabel('湖泊分组').getByRole('link')).toHaveCount(1)
    await expect(
      page.getByLabel('世界湖泊对象', { exact: true }).getByRole('link'),
    ).toHaveCount(20)
    await expect(page.locator('[data-group-member="true"]')).toHaveCount(20)
    await expectNoPageScroll(page)

    const [detailMapBox, detailGroupBox, objectBox] = await Promise.all([
      page.locator('.knowledge-earth-map-card').boundingBox(),
      page.getByLabel('湖泊分组').boundingBox(),
      page.getByLabel('世界湖泊对象', { exact: true }).boundingBox(),
    ])
    expect(detailMapBox).not.toBeNull()
    expect(detailGroupBox).not.toBeNull()
    expect(objectBox).not.toBeNull()
    expect(detailMapBox!.y + detailMapBox!.height).toBeLessThanOrEqual(
      detailGroupBox!.y + 1,
    )
    expect(detailGroupBox!.y + detailGroupBox!.height).toBeLessThanOrEqual(
      objectBox!.y + 1,
    )
    const overviewCard = page.getByRole('complementary', {
      name: '世界湖泊水域分组知识',
    })
    await expect
      .poll(async () => {
        const cardBox = await overviewCard.boundingBox()
        return cardBox ? cardBox.x + cardBox.width : Number.POSITIVE_INFINITY
      })
      .toBeLessThanOrEqual(viewport.width + 1)

    await page
      .getByLabel('世界湖泊对象', { exact: true })
      .getByRole('link', { name: /贝加尔湖/ })
      .click()
    await expect(page).toHaveURL(/groups\/world-lakes\?object=lake-baikal$/)
    await expect(
      page.getByRole('complementary', { name: '贝加尔湖湖泊详情' }),
    ).toBeVisible()
    await page.getByRole('button', { name: '关闭贝加尔湖详情' }).click()
    await expect(page).toHaveURL(/\/knowledge\/water\/groups\/world-lakes$/)
    await expect(
      page.getByRole('complementary', { name: '世界湖泊水域分组知识' }),
    ).toBeVisible()
  })
}

test('keeps group context and moves map-selected objects across groups', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1194, height: 834 })
  await page.goto('/knowledge/water/groups/ocean-seas')

  await expect(page.locator('[data-group-member="true"]')).toHaveCount(26)
  await expect(page.locator('[data-group-member="false"]')).toHaveCount(11)
  await page
    .getByTestId('knowledge-water-map')
    .getByRole('button', { name: '查看墨西哥湾详情' })
    .click()
  await expect(page).toHaveURL(
    /\/knowledge\/water\/groups\/ocean-bays\?object=gulf-of-mexico$/,
  )
  await expect(
    page.getByRole('complementary', { name: '墨西哥湾海湾详情' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /在3D地球上查看/ }),
  ).toHaveAttribute('href', '/explore?waterbody=gulf-of-mexico')
})

test('redirects legacy water URLs into the canonical hierarchy', async ({
  page,
}) => {
  await page.goto('/knowledge/water?layer=lake&group=lake-asia')
  await expect(page).toHaveURL(/\/knowledge\/water\/groups\/world-lakes$/)

  await page.goto('/knowledge/water/waterbodies/bering-strait?layer=ocean')
  await expect(page).toHaveURL(
    /\/knowledge\/water\/groups\/waterway-straits\?object=bering-strait$/,
  )

  await page.goto('/knowledge/water/groups/ocean-seas?object=lake-baikal')
  await expect(page).toHaveURL(
    /\/knowledge\/water\/groups\/world-lakes\?object=lake-baikal$/,
  )
})

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
