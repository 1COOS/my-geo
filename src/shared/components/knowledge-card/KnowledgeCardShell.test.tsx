import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { KnowledgeCardShell } from './KnowledgeCardShell'

describe('KnowledgeCardShell', () => {
  it('applies an accent and resets the single content scroller on identity changes', () => {
    const scrollTo = vi.fn(function (
      this: HTMLElement,
      options: ScrollToOptions,
    ) {
      this.scrollTop = options.top ?? 0
    })
    const originalScrollTo = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollTo',
    )
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    })

    const { container, rerender } = render(
      <KnowledgeCardShell
        label="测试知识卡"
        closeLabel="关闭测试知识卡"
        identity="first"
        accent="#d291ff"
        onClose={vi.fn()}
        footer={<span>底部操作</span>}
      >
        <p>第一项内容</p>
      </KnowledgeCardShell>,
    )

    const shell = screen.getByLabelText('测试知识卡')
    expect(shell).toHaveStyle({ '--knowledge-card-accent': '#d291ff' })
    expect(screen.getByText('底部操作')).toBeInTheDocument()

    const content = container.querySelector<HTMLElement>(
      '.knowledge-card-content',
    )!
    content.scrollTop = 80
    rerender(
      <KnowledgeCardShell
        label="测试知识卡"
        closeLabel="关闭测试知识卡"
        identity="second"
        accent="#d291ff"
        onClose={vi.fn()}
      >
        <p>第二项内容</p>
      </KnowledgeCardShell>,
    )

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0 })
    expect(content.scrollTop).toBe(0)
    if (originalScrollTo) {
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
    } else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  })

  it('returns focus to the opener after closing', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            打开知识卡
          </button>
          {open ? (
            <KnowledgeCardShell
              label="测试知识卡"
              closeLabel="关闭测试知识卡"
              identity="focus"
              onClose={() => setOpen(false)}
            >
              <p>内容</p>
            </KnowledgeCardShell>
          ) : null}
        </>
      )
    }

    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: '打开知识卡' })

    await user.click(opener)
    await user.click(screen.getByRole('button', { name: '关闭测试知识卡' }))

    await waitFor(() => expect(opener).toHaveFocus())
  })
})
