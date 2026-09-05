import { expect, test } from '@playwright/test'

test('searches a polygon territory and loads its temporary 3D overlay', async ({
  page,
}) => {
  await page.goto('/search')
  const search = page.getByRole('combobox', { name: '搜索地点' })
  await search.fill('格陵兰')
  await expect(page.getByText('地区', { exact: true })).toBeVisible()

  const geometryResponse = page.waitForResponse((response) =>
    response.url().includes('territory-boundaries'),
  )
  await search.press('Enter')

  await expect(page).toHaveURL(/\/explore\?territory=greenland$/)
  await expect(page.getByLabel('格陵兰地区知识卡')).toBeVisible()
  await expect(page.locator('[data-territory-id="greenland"]')).toContainText(
    'Greenland',
  )
  await expect(geometryResponse).resolves.toBeTruthy()
})

test('opens a marker territory from its administering country on phone landscape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/explore?country=US')

  const countryCard = page.getByLabel('美国国家知识卡')
  await countryCard.getByRole('button', { name: /国际关系/ }).click()
  await countryCard.getByRole('button', { name: '探索地区关岛' }).click()

  const territoryCard = page.getByLabel('关岛地区知识卡')
  await expect(territoryCard).toBeVisible()
  await expect(page.locator('[data-territory-id="guam"]')).toContainText('Guam')
  await territoryCard.getByRole('button', { name: /聚落景观/ }).click()
  await expect(
    territoryCard.getByText('代表景观：恋人岬 Two Lovers Point', {
      exact: false,
    }),
  ).toBeVisible()

  const box = await territoryCard.boundingBox()
  expect(box).not.toBeNull()
  if (!box) throw new Error('Territory card has no layout box')
  expect(box.x + box.width).toBeLessThanOrEqual(844)
  expect(box.y + box.height).toBeLessThanOrEqual(390)
})
