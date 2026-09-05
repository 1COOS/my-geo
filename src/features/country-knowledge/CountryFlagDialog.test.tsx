import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getCountry } from '../../data/countries'
import { CountryFlagDialog } from './CountryFlagDialog'

function DialogHarness({ countryCode }: { countryCode: string }) {
  const country = getCountry(countryCode)
  expect(country).toBeDefined()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        打开国旗
      </button>
      <CountryFlagDialog
        country={country!}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

describe('CountryFlagDialog', () => {
  it('shows the enlarged flag and complete sections in source order', async () => {
    const user = userEvent.setup()
    render(<DialogHarness countryCode="BR" />)

    await user.click(screen.getByRole('button', { name: '打开国旗' }))

    const dialog = screen.getByRole('dialog', { name: '巴西国旗' })
    expect(dialog).toBeVisible()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByAltText('巴西国旗')).toHaveClass('country-flag-image')
    expect(
      Array.from(
        dialog.querySelectorAll('.country-flag-dialog-section > h3'),
      ).map((heading) => heading.textContent),
    ).toEqual(['外观', '含义', '历史'])
    expect(screen.getByText(/27 颗白色五角星/)).toBeVisible()
    expect(screen.getByText(/巴西帝国旧国旗/)).toBeVisible()
  })

  it('closes with its button and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<DialogHarness countryCode="CN" />)

    const trigger = screen.getByRole('button', { name: '打开国旗' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: '关闭中国国旗含义' }))

    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog', { name: '中国国旗' })).toBeNull()
  })

  it('closes on cancel and backdrop interaction', async () => {
    const user = userEvent.setup()
    render(<DialogHarness countryCode="JP" />)

    const trigger = screen.getByRole('button', { name: '打开国旗' })
    await user.click(trigger)
    let dialog = screen.getByRole('dialog', { name: '日本国旗' })
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    await waitFor(() => expect(trigger).toHaveFocus())

    await user.click(trigger)
    dialog = screen.getByRole('dialog', { name: '日本国旗' })
    fireEvent.click(dialog)
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
