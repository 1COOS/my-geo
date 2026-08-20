import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getLandmark } from '../../data/landmarks'
import { LandmarkDetailPanel } from './LandmarkDetailPanel'

describe('LandmarkDetailPanel', () => {
  it('renders compact educational content without source links or coordinates', async () => {
    const landmark = getLandmark('great-wall')!
    const onSelectCountry = vi.fn()

    render(
      <LandmarkDetailPanel
        landmark={landmark}
        onClose={vi.fn()}
        onSelectCountry={onSelectCountry}
      />,
    )

    expect(screen.getByLabelText('长城古迹知识卡')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '长城' })).toBeInTheDocument()
    expect(screen.getByText('公元前7世纪至明代')).toBeInTheDocument()
    expect(screen.queryByText(/40\.4319/)).not.toBeInTheDocument()
    expect(screen.queryByText(/资料来源/)).not.toBeInTheDocument()
    const flag = screen
      .getByRole('button', { name: '探索中国' })
      .querySelector('img')
    expect(flag).toHaveClass('country-flag-image')
    expect(flag?.parentElement).toHaveClass('country-flag-frame')

    await userEvent.click(screen.getByRole('button', { name: '探索中国' }))
    expect(onSelectCountry).toHaveBeenCalledWith('CN')
  })
})
