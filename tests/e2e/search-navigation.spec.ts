import { expect, test } from '@playwright/test'

const searchViewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'iPad landscape', width: 1194, height: 834 },
  { name: 'iPhone 16 Pro Max landscape', width: 956, height: 440 },
  { name: 'phone landscape', width: 844, height: 390 },
]

for (const viewport of searchViewports) {
  test(`keeps standalone search usable on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/search')

    await expect(
      page.getByRole('heading', { name: '搜索', level: 1 }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: '搜索' })).toHaveClass(
      /is-active/,
    )
    await expect(page.locator('.app-navigation-brand img')).toBeVisible()
    await expect(page.getByRole('button', { name: '返回上一级' })).toHaveCount(
      0,
    )
    await expect(page.getByText('精选国家')).toBeVisible()
    await expect(
      page.getByRole('listbox', { name: '地点搜索结果' }),
    ).toBeVisible()
    await expect(page.getByRole('combobox', { name: '搜索地点' })).toBeFocused()

    const overflow = await page.evaluate(() => ({
      x:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      y: document.querySelector('main')!.scrollHeight - innerHeight,
    }))
    expect(overflow.x).toBeLessThanOrEqual(0)
    expect(overflow.y).toBeLessThanOrEqual(0)
  })
}

test('opens standalone search results in 3D without a bottom search control', async ({
  page,
}) => {
  await page.goto('/search')
  const search = page.getByRole('combobox', { name: '搜索地点' })
  await search.fill('长城')
  await search.press('Enter')

  await expect(page).toHaveURL(/\/explore\?landmark=great-wall$/)
  await expect(page.getByLabel('长城古迹知识卡')).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: '地球显示控制' })
      .getByRole('button', { name: '搜索地点' }),
  ).toHaveCount(0)
  await expect(page.locator('.app-navigation-brand img')).toBeVisible()
})

test('uses deterministic parent routes for the back icon', async ({ page }) => {
  await page.goto('/knowledge/earth')
  const directBack = page.getByRole('button', { name: '返回上一级' })
  await expect(directBack).toBeVisible()
  const directBackStyle = await directBack.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      background: style.backgroundColor,
      border: style.borderWidth,
      height: box.height,
      radius: style.borderRadius,
      width: box.width,
      path: element.querySelector('path')?.getAttribute('d'),
    }
  })
  expect({
    background: directBackStyle.background,
    border: directBackStyle.border,
    radius: directBackStyle.radius,
    path: directBackStyle.path,
  }).toEqual({
    background: 'rgb(54, 88, 77)',
    border: '0px',
    radius: '6px',
    path: 'm15 5.5-6.5 6.5 6.5 6.5',
  })
  expect(directBackStyle.width).toBeGreaterThanOrEqual(44)
  expect(directBackStyle.height).toBeGreaterThanOrEqual(44)
  await directBack.click()
  await expect(page).toHaveURL(/\/knowledge$/)

  await page.getByTestId('knowledge-home-module-earth').click()
  await expect(page).toHaveURL(/\/knowledge\/earth$/)
  await page.getByRole('button', { name: '返回上一级' }).click()
  await expect(page).toHaveURL(/\/knowledge$/)

  await page.goto('/questions/asia/easy')
  await page.getByRole('button', { name: '返回上一级' }).click()
  await expect(page).toHaveURL(/\/questions$/)

  await page.goto('/search')
  await page.goto('/knowledge/countries/east-asia?country=CN')
  await page.getByRole('button', { name: '返回上一级' }).click()
  await expect(page).toHaveURL(/\/knowledge\/countries$/)
})
