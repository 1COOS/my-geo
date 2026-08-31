import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KnowledgeCardShell } from './KnowledgeCardShell'

describe('KnowledgeCardShell', () => {
  it('renders a non-dismissible card without a close control', () => {
    render(
      <KnowledgeCardShell label="常驻知识卡" identity="persistent">
        <p>常驻内容</p>
      </KnowledgeCardShell>,
    )

    expect(screen.getByLabelText('常驻知识卡')).toBeVisible()
    expect(screen.getByText('常驻内容')).toBeVisible()
    expect(screen.queryByRole('button')).toBeNull()
  })

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
        identity="first"
        accent="#d291ff"
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
      <KnowledgeCardShell label="测试知识卡" identity="second" accent="#d291ff">
        <p>第二项内容</p>
      </KnowledgeCardShell>,
    )

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0 })
    expect(content.scrollTop).toBe(0)
    if (originalScrollTo) {
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
    } else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  })
})
