import { expect, test } from '@playwright/test'

const knowledgeMapViewports = [
  { name: '1440 desktop', width: 1440, height: 900 },
  { name: 'iPad landscape', width: 1194, height: 834 },
  { name: 'phone landscape', width: 844, height: 390 },
]

for (const viewport of knowledgeMapViewports) {
  test(`fills the knowledge map frame horizontally on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/knowledge')

    const mapCard = page.locator('.knowledge-map-card')
    const map = page.locator('.knowledge-region-map')
    const countryPaths = map.locator(
      '.knowledge-region-map-countries path[data-country-code]',
    )
    await expect(countryPaths.first()).toBeVisible()

    const cardBox = await mapCard.boundingBox()
    const mapBox = await map.boundingBox()
    const pathBounds = await countryPaths.evaluateAll((paths) => {
      const boxes = paths.map((path) => path.getBoundingClientRect())
      return {
        left: Math.min(...boxes.map((box) => box.left)),
        right: Math.max(...boxes.map((box) => box.right)),
      }
    })

    expect(cardBox).not.toBeNull()
    expect(mapBox).not.toBeNull()
    expect(cardBox!.width / cardBox!.height).toBeCloseTo(720 / 340, 2)
    expect(pathBounds.left - mapBox!.x).toBeLessThanOrEqual(2)
    expect(mapBox!.x + mapBox!.width - pathBounds.right).toBeLessThanOrEqual(2)
  })
}

test('matches selected-continent map colors to the learning region cards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/knowledge')

  const selections = [
    { tab: /亚洲/, regionCount: 5 },
    { tab: /欧洲/, regionCount: 5 },
    { tab: /非洲/, regionCount: 5 },
    { tab: /美洲/, regionCount: 4 },
    { tab: /大洋洲/, regionCount: 4 },
  ]
  const accentSequence = ['#4cc9f0', '#ff8a5b', '#8b8cff', '#f6c453', '#46d1a3']

  for (const selection of selections) {
    const tab = page.getByRole('tab', { name: selection.tab })
    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.knowledge-region-card')).toHaveCount(
      selection.regionCount,
    )

    const cardColors = await page
      .locator('.knowledge-region-card')
      .evaluateAll((cards) =>
        cards.map((card) =>
          getComputedStyle(card).getPropertyValue('--region-accent').trim(),
        ),
      )
    const mapColors = await page
      .locator(
        '.knowledge-region-map-countries path.is-continent, .knowledge-region-map-microstates circle.is-continent',
      )
      .evaluateAll((features) =>
        Array.from(
          new Set(
            features.map((feature) =>
              getComputedStyle(feature)
                .getPropertyValue('--knowledge-region-accent')
                .trim(),
            ),
          ),
        ),
      )

    expect(cardColors).toHaveLength(selection.regionCount)
    expect(cardColors).toEqual(accentSequence.slice(0, selection.regionCount))
    expect(mapColors.sort()).toEqual(cardColors.sort())
  }
})

test('keeps the continent map stable above a single row of region cards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/knowledge')

  const topicGridBox = await page.locator('.knowledge-topic-grid').boundingBox()
  expect(topicGridBox).not.toBeNull()
  expect(topicGridBox!.height).toBeLessThanOrEqual(80)
  await expect(page.getByText('国家、国旗、首都')).toBeVisible()
  await expect(page.getByText('已开放')).toHaveCount(0)
  await expect(page.getByText('即将开放')).toHaveCount(0)
  await expect(page.locator('.knowledge-map-summary')).toHaveCount(0)
  await expect(page.getByText('尚未挑战')).toHaveCount(0)
  await expect(page.locator('.knowledge-region-progress')).toHaveCount(0)

  const mapCard = page.locator('.knowledge-map-card')
  const regionGrid = page.locator('.knowledge-region-grid')
  const asiaMapBox = await mapCard.boundingBox()
  const asiaGridBox = await regionGrid.boundingBox()

  expect(asiaMapBox).not.toBeNull()
  expect(asiaGridBox).not.toBeNull()
  expect(asiaGridBox!.y).toBeGreaterThanOrEqual(
    asiaMapBox!.y + asiaMapBox!.height,
  )
  await expect(regionGrid.locator('.knowledge-region-card')).toHaveCount(5)

  await page
    .locator('.knowledge-region-map-countries path[data-country-code="US"]')
    .click()
  await expect(page.getByRole('tab', { name: /美洲/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const americasMapBox = await mapCard.boundingBox()
  expect(americasMapBox).not.toBeNull()
  expect(americasMapBox!.height).toBeCloseTo(asiaMapBox!.height, 1)
  await expect(regionGrid.locator('.knowledge-region-card')).toHaveCount(4)

  await page.getByRole('tab', { name: /大洋洲/ }).click()
  const oceaniaMapBox = await mapCard.boundingBox()
  expect(oceaniaMapBox).not.toBeNull()
  expect(oceaniaMapBox!.height).toBeCloseTo(asiaMapBox!.height, 1)
  await expect(regionGrid.locator('.knowledge-region-card')).toHaveCount(4)
})

test('keeps compact region cards readable in a horizontal scroller', async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 800 })
  await page.goto('/knowledge')

  const topicGridBox = await page.locator('.knowledge-topic-grid').boundingBox()
  expect(topicGridBox).not.toBeNull()
  expect(topicGridBox!.height).toBeLessThanOrEqual(80)
  const regionGrid = page.locator('.knowledge-region-grid')
  const firstCard = regionGrid.locator('.knowledge-region-card').first()
  const dimensions = await regionGrid.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  const firstCardBox = await firstCard.boundingBox()

  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth)
  expect(firstCardBox).not.toBeNull()
  expect(firstCardBox!.width).toBeGreaterThanOrEqual(250)
})
