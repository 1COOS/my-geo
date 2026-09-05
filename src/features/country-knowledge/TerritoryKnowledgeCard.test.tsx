import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getTerritory } from '../../data/territories'
import { TerritoryKnowledgeCard } from './TerritoryKnowledgeCard'

describe('TerritoryKnowledgeCard', () => {
  it('presents territory facts and opens each reviewed chapter', async () => {
    const user = userEvent.setup()
    const territory = getTerritory('greenland')!
    const onSelectCountry = vi.fn()
    render(
      <TerritoryKnowledgeCard
        territory={territory}
        onSelectCountry={onSelectCountry}
      />,
    )

    const card = screen.getByLabelText('格陵兰地区知识卡')
    expect(within(card).getByRole('heading', { name: '格陵兰' })).toBeVisible()
    expect(within(card).getByText(/北极地区 · 自治领地/)).toBeVisible()
    expect(within(card).getByText('努克 / Nuuk')).toBeVisible()

    await user.click(within(card).getByRole('button', { name: /自然地理/ }))
    expect(within(card).getByText(/世界最大岛屿/)).toBeVisible()
    await user.click(within(card).getByRole('button', { name: /聚落景观/ }))
    expect(within(card).getByText(/伊卢利萨特冰峡湾/)).toBeVisible()

    await user.click(
      within(card).getByRole('button', { name: '返回相关国家：丹麦' }),
    )
    expect(onSelectCountry).toHaveBeenCalledWith('DK')
  })
})
