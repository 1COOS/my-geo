import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getCountry } from '../../data/countries'
import { CountrySearch } from './CountrySearch'

describe('CountrySearch', () => {
  it('supports Chinese search and Enter selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(countryCode: string) => void>()

    render(
      <CountrySearch
        selectedCountry={undefined}
        onSelect={onSelect}
        onClearSelection={vi.fn()}
      />,
    )

    const search = screen.getByRole('combobox', { name: '搜索国家' })
    await user.type(search, '中国')
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('CN')
  })

  it('supports English and ISO search plus keyboard navigation', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(countryCode: string) => void>()

    render(
      <CountrySearch
        selectedCountry={undefined}
        onSelect={onSelect}
        onClearSelection={vi.fn()}
      />,
    )

    const search = screen.getByRole('combobox', { name: '搜索国家' })
    await user.type(search, 'Vatican')
    expect(screen.getByRole('option', { name: /梵蒂冈/ })).toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'va')
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('VA')
  })

  it('uses Escape to clear an existing selection', async () => {
    const user = userEvent.setup()
    const onClearSelection = vi.fn()

    render(
      <CountrySearch
        selectedCountry={getCountry('CN')}
        onSelect={vi.fn()}
        onClearSelection={onClearSelection}
      />,
    )

    const search = screen.getByRole('combobox', { name: '搜索国家' })
    await user.click(search)
    await user.keyboard('{Escape}')
    await user.keyboard('{Escape}')

    expect(onClearSelection).toHaveBeenCalledTimes(1)
  })
})
