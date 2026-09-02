import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SearchPage } from './SearchPage'

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location">
      {location.pathname + location.search}
    </output>
  )
}

describe('SearchPage', () => {
  it('shows persistent featured results and opens the selected result in 3D', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/search']}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/explore" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '搜索', level: 1 }),
    ).toBeVisible()
    expect(screen.getByText('精选国家')).toBeVisible()
    const search = screen.getByRole('combobox', { name: '搜索地点' })
    expect(search).toHaveFocus()

    await user.type(search, '中国{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/explore?country=CN',
    )
  })
})
