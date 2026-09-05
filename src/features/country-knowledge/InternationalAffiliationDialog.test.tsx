import { StrictMode, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { internationalAffiliations } from '../../data/internationalOrganizations'
import { InternationalAffiliationDialog } from './InternationalAffiliationDialog'

function affiliation(id: string) {
  const value = internationalAffiliations.find((item) => item.id === id)
  expect(value).toBeDefined()
  return value!
}

function DialogHarness({ affiliationId }: { affiliationId: string }) {
  const [open, setOpen] = useState(false)
  const selectedAffiliation = affiliation(affiliationId)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        打开组织
      </button>
      <InternationalAffiliationDialog
        affiliation={selectedAffiliation}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

describe('InternationalAffiliationDialog', () => {
  it('shows structured details and complete G20 member entities', async () => {
    render(<DialogHarness affiliationId="group-of-twenty" />)

    await userEvent.click(screen.getByRole('button', { name: '打开组织' }))

    const dialog = screen.getByRole('dialog', { name: '二十国集团' })
    expect(dialog).toBeVisible()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Group of Twenty')).toBeVisible()
    expect(screen.getAllByText('合作机制', { exact: true })).toHaveLength(2)
    expect(screen.getByText('21个正式成员')).toBeVisible()
    expect(
      dialog.querySelectorAll('.international-affiliation-member-grid li'),
    ).toHaveLength(19)
    expect(
      dialog.querySelector('.international-affiliation-member-grid button'),
    ).toBeNull()
    expect(screen.getByText('欧洲联盟')).toBeVisible()
    expect(screen.getByText('非洲联盟')).toBeVisible()
  })

  it('closes and restores focus without making members interactive', async () => {
    const user = userEvent.setup()
    render(<DialogHarness affiliationId="african-union" />)

    const trigger = screen.getByRole('button', { name: '打开组织' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '非洲联盟' })
    expect(
      dialog.querySelectorAll('.international-affiliation-member-grid li'),
    ).toHaveLength(54)
    expect(screen.getByText('撒哈拉阿拉伯民主共和国')).toBeVisible()

    await user.click(screen.getByRole('button', { name: '关闭非洲联盟详情' }))
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog', { name: '非洲联盟' })).toBeNull()
  })

  it('stays open during the Strict Mode mount-effect rehearsal', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <DialogHarness affiliationId="group-of-seven" />
      </StrictMode>,
    )

    const trigger = screen.getByRole('button', { name: '打开组织' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '七国集团' })
    expect(dialog).toBeVisible()

    await user.click(screen.getByRole('button', { name: '关闭七国集团详情' }))
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog', { name: '七国集团' })).toBeNull()
  })
})
