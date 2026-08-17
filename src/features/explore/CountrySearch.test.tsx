import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CountrySearch } from './CountrySearch'
import type { PlaceSearchResult } from './countrySearchUtils'

describe('CountrySearch', () => {
  it('supports Chinese search and Enter selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(result: PlaceSearchResult) => void>()

    render(<CountrySearch onSelect={onSelect} />)

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, '中国')
    await user.keyboard('{Enter}')

    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
      type: 'country',
      country: { code: 'CN' },
    })
  })

  it('supports English and ISO search plus keyboard navigation', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(result: PlaceSearchResult) => void>()

    render(<CountrySearch onSelect={onSelect} />)

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, 'Vatican')
    expect(
      screen.getAllByRole('option', { name: /梵蒂冈/ }).length,
    ).toBeGreaterThan(0)
    await user.clear(search)
    await user.type(search, 'va')
    await user.keyboard('{Enter}')

    expect(onSelect.mock.calls.at(-1)?.[0]).toMatchObject({
      type: 'country',
      country: { code: 'VA' },
    })
  })

  it('requests close on Escape', async () => {
    const user = userEvent.setup()
    const onRequestClose = vi.fn()

    render(
      <CountrySearch
        selectedLabel="中国"
        onSelect={vi.fn()}
        onRequestClose={onRequestClose}
      />,
    )

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.click(search)
    await user.keyboard('{Escape}')
    expect(onRequestClose).toHaveBeenCalledTimes(1)
  })

  it('shows mountain ranges with their highest peak', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(result: PlaceSearchResult) => void>()

    render(<CountrySearch onSelect={onSelect} />)

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    expect(search).toHaveAttribute(
      'placeholder',
      '搜索国家、城市、古迹与地理地点',
    )
    await user.type(search, 'Everest')
    expect(screen.getByText(/最高峰：珠穆朗玛峰/)).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
      type: 'mountainRange',
      range: { id: 'himalayas' },
    })
  })

  it('shows deserts with their geographic region', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(result: PlaceSearchResult) => void>()

    render(<CountrySearch onSelect={onSelect} />)

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, '撒哈拉')
    expect(screen.getByText(/北非/)).toBeInTheDocument()
    expect(screen.getByText('沙漠')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
      type: 'desert',
      desert: { id: 'sahara' },
    })
  })

  it('shows landmarks with their category and location', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(result: PlaceSearchResult) => void>()

    render(<CountrySearch onSelect={onSelect} />)

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    await user.type(search, '长城')
    expect(screen.getByText(/防御工程 · 中国北方/)).toBeInTheDocument()
    expect(screen.getByText('古迹')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
      type: 'landmark',
      landmark: { id: 'great-wall' },
    })
  })

  it('requests the parent popover to close after selection or Escape', async () => {
    const user = userEvent.setup()
    const onRequestClose = vi.fn()

    render(
      <CountrySearch
        onSelect={vi.fn()}
        autoFocus
        onRequestClose={onRequestClose}
      />,
    )

    const search = screen.getByRole('combobox', { name: '搜索地点' })
    expect(search).toHaveFocus()
    await user.type(search, '中国{Enter}')
    expect(onRequestClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onRequestClose).toHaveBeenCalledTimes(2)
  })
})
