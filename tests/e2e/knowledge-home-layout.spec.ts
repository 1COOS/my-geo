import { expect, test } from '@playwright/test'

const maxReadableTopicGridHeight = 96

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

    await page.getByRole('tab', { name: /大洋洲/ }).click()
    const longRegionName = page.getByText('Australia and New Zealand')
    await expect(longRegionName).toHaveCount(1)
    const longRegionNameLayout = await longRegionName.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      whiteSpace: getComputedStyle(element).whiteSpace,
    }))
    expect(longRegionNameLayout.whiteSpace).toBe('nowrap')
    expect(longRegionNameLayout.scrollHeight).toBeLessThanOrEqual(
      longRegionNameLayout.clientHeight + 1,
    )
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
  expect(topicGridBox!.height).toBeLessThanOrEqual(maxReadableTopicGridHeight)
  const countrySubtitle = page.getByText('国家｜国旗｜首都')
  await expect(countrySubtitle).toBeVisible()
  await expect(countrySubtitle).toHaveCSS('font-size', '12px')
  await expect(countrySubtitle).toHaveCSS('white-space', 'nowrap')
  await expect(page.getByLabel('国家知识范围')).toContainText('195国家23地区')
  await expect(page.getByText('经纬判读与五带')).toBeVisible()
  const countryHeaderLayout = await page
    .locator('.knowledge-topic-card.is-active')
    .evaluate((card) => {
      const copy = card
        .querySelector('.knowledge-topic-copy')!
        .getBoundingClientRect()
      const stats = card
        .querySelector('.knowledge-topic-stats')!
        .getBoundingClientRect()
      const firstStat = card.querySelector('.knowledge-topic-stats > div')!
      const value = firstStat.querySelector('strong')!.getBoundingClientRect()
      const label = firstStat.querySelector('span')!.getBoundingClientRect()
      return {
        copyToStatsGap: stats.left - copy.right,
        labelGap: label.left - value.right,
      }
    })
  expect(countryHeaderLayout.copyToStatsGap).toBeGreaterThanOrEqual(0)
  expect(countryHeaderLayout.copyToStatsGap).toBeLessThanOrEqual(12)
  expect(countryHeaderLayout.labelGap).toBeGreaterThanOrEqual(3)
  expect(countryHeaderLayout.labelGap).toBeLessThanOrEqual(5)
  await expect(page.getByText('已开放')).toHaveCount(0)
  await expect(page.getByText('即将开放')).toHaveCount(0)
  await expect(page.locator('.knowledge-map-summary')).toHaveCount(0)
  await expect(page.getByText('尚未挑战')).toHaveCount(0)
  await expect(page.locator('.knowledge-region-progress')).toHaveCount(0)

  const mapCard = page.locator('.knowledge-map-card')
  const regionGrid = page.locator('.knowledge-region-grid')
  const continentTabs = page.getByRole('tablist', { name: '大洲' })
  const tabLayout = await continentTabs.evaluate((element) => {
    const button = element.querySelector('button')!
    const chinese = button.querySelector('strong')!.getBoundingClientRect()
    const english = button.querySelector('span')!.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      borderBottomWidth: style.borderBottomWidth,
      flexDirection: getComputedStyle(button).flexDirection,
      chineseFontSize: getComputedStyle(button.querySelector('strong')!)
        .fontSize,
      englishFontSize: getComputedStyle(button.querySelector('span')!).fontSize,
      centerDelta: Math.abs(
        chinese.y + chinese.height / 2 - (english.y + english.height / 2),
      ),
    }
  })
  expect(tabLayout.borderBottomWidth).toBe('0px')
  expect(tabLayout.flexDirection).toBe('row')
  expect(tabLayout.chineseFontSize).toBe('15px')
  expect(tabLayout.englishFontSize).toBe('14px')
  expect(tabLayout.centerDelta).toBeLessThan(3)
  const asiaMapBox = await mapCard.boundingBox()
  const asiaGridBox = await regionGrid.boundingBox()

  expect(asiaMapBox).not.toBeNull()
  expect(asiaGridBox).not.toBeNull()
  expect(asiaGridBox!.y).toBeGreaterThanOrEqual(
    asiaMapBox!.y + asiaMapBox!.height,
  )
  await expect(regionGrid.locator('.knowledge-region-card')).toHaveCount(5)
  await expect(regionGrid.locator('.knowledge-region-index')).toHaveCount(0)

  const firstCard = regionGrid.locator('.knowledge-region-card').first()
  const firstCardLayout = await firstCard.evaluate((element) => {
    const title = element.querySelector('h3')!.getBoundingClientRect()
    const count = element.querySelector('strong')!.getBoundingClientRect()
    const english = element.querySelector('p')!
    const englishBox = english.getBoundingClientRect()
    return {
      countIsRightOfTitle: count.x > title.x,
      headingCenterDelta: Math.abs(
        title.y + title.height / 2 - (count.y + count.height / 2),
      ),
      englishStartsBelowHeading:
        englishBox.y >= Math.max(title.bottom, count.bottom),
      englishWhiteSpace: getComputedStyle(english).whiteSpace,
    }
  })
  expect(firstCardLayout.countIsRightOfTitle).toBe(true)
  expect(firstCardLayout.headingCenterDelta).toBeLessThan(3)
  expect(firstCardLayout.englishStartsBelowHeading).toBe(true)
  expect(firstCardLayout.englishWhiteSpace).toBe('nowrap')

  const longEnglishName = regionGrid.getByText('South-eastern Asia')
  const longEnglishLayout = await longEnglishName.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    whiteSpace: getComputedStyle(element).whiteSpace,
  }))
  expect(longEnglishLayout.whiteSpace).toBe('nowrap')
  expect(longEnglishLayout.scrollHeight).toBeLessThanOrEqual(
    longEnglishLayout.clientHeight + 1,
  )

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
  expect(topicGridBox!.height).toBeLessThanOrEqual(maxReadableTopicGridHeight)
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
