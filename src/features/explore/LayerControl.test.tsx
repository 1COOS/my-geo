import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LayerControl, type LayerControlGroup } from './LayerControl'

function createGroups(onToggle = vi.fn()): readonly LayerControlGroup[] {
  return [
    {
      id: 'labels',
      label: '标注',
      items: [
        {
          id: 'capitals',
          label: '首都',
          className: 'is-capital',
          pressed: true,
          onToggle,
        },
        {
          id: 'cities',
          label: '城市',
          className: 'is-city',
          pressed: false,
          description: '世界主要城市',
          onToggle,
        },
      ],
    },
  ]
}

describe('LayerControl', () => {
  it('renders grouped choices and keeps the panel open for consecutive toggles', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<LayerControl groups={createGroups(onToggle)} />)

    const trigger = screen.getByRole('button', { name: '图层，已开启 1 项' })
    await user.click(trigger)

    const panel = screen.getByRole('region', { name: '图层选择' })
    expect(panel).toBeVisible()
    expect(screen.getByRole('heading', { name: '标注' })).toBeVisible()
    const city = screen.getByRole('button', { name: '城市' })
    expect(city).toHaveAttribute('aria-describedby')

    await user.click(city)

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(panel).toBeVisible()
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<LayerControl groups={createGroups()} />)
    const trigger = screen.getByRole('button', { name: '图层，已开启 1 项' })
    await user.click(trigger)

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('region', { name: '图层选择' })).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes when focus moves to an outside click target', async () => {
    const user = userEvent.setup()
    render(
      <>
        <LayerControl groups={createGroups()} />
        <button type="button">外部操作</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: /图层，已开启/ }))

    await user.click(screen.getByRole('button', { name: '外部操作' }))

    expect(screen.queryByRole('region', { name: '图层选择' })).toBeNull()
  })
})
