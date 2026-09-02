import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { KnowledgePage } from './KnowledgePage'

describe('KnowledgePage home', () => {
  it('groups four learning modules above one question module', () => {
    render(
      <MemoryRouter initialEntries={['/knowledge?continent=asia']}>
        <KnowledgePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '知识', level: 1 }),
    ).toBeVisible()
    expect(screen.getByText('选择内容开始学习')).toBeVisible()

    const learning = screen.getByRole('region', { name: '知识模块' })
    expect(within(learning).getAllByRole('link')).toHaveLength(4)
    expect(
      within(learning).getByRole('link', { name: /地球经纬/ }),
    ).toHaveAttribute('href', '/knowledge/earth')
    expect(
      within(learning).getByRole('link', { name: /国家首都/ }),
    ).toHaveAttribute('href', '/knowledge/countries')
    expect(
      within(learning).getByRole('link', { name: /世界之最/ }),
    ).toHaveAttribute('href', '/knowledge/extremes')
    expect(
      within(learning).getByRole('link', { name: /江河湖海/ }),
    ).toHaveAttribute('href', '/knowledge/water')

    const questions = screen.getByRole('region', { name: '问答模块' })
    expect(within(questions).getAllByRole('link')).toHaveLength(1)
    expect(
      within(questions).getByRole('link', { name: /知识问答/ }),
    ).toHaveAttribute('href', '/questions')
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByText('已通过')).not.toBeInTheDocument()
    expect(screen.queryByText('LEARN')).not.toBeInTheDocument()
    expect(screen.queryByText('CHALLENGE')).not.toBeInTheDocument()
    expect(screen.queryByText('开始学习')).not.toBeInTheDocument()
    expect(screen.queryByText('进入知识问答')).not.toBeInTheDocument()
  })
})
