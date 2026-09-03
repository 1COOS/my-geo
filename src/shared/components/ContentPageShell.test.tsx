import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ContentPageHeader, ContentPageShell } from './ContentPageShell'

describe('ContentPageShell', () => {
  it.each(['auto', 'locked'] as const)(
    'publishes the %s scroll contract and forwards the shell ref',
    (scrollMode) => {
      const shellRef = createRef<HTMLElement>()
      render(
        <ContentPageShell
          className="custom-page"
          scrollMode={scrollMode}
          shellRef={shellRef}
        >
          页面内容
        </ContentPageShell>,
      )

      const main = screen.getByRole('main')
      expect(main).toHaveClass('knowledge-shell', 'content-page-shell')
      expect(main).toHaveClass(`is-scroll-${scrollMode}`, 'custom-page')
      expect(main).toHaveAttribute('data-page-scroll', scrollMode)
      expect(shellRef.current).toBe(main)
    },
  )

  it('renders the shared title and subtitle header', () => {
    render(<ContentPageHeader title="图鉴" subtitle="选择内容开始学习" />)

    expect(screen.getByRole('heading', { name: '图鉴' })).toBeVisible()
    expect(screen.getByText('选择内容开始学习')).toBeVisible()
  })
})
