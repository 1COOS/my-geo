import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { KnowledgeChallengePage } from './KnowledgeChallengePage'
import { KnowledgePage } from './KnowledgePage'
import { KnowledgeRegionPage } from './KnowledgeRegionPage'

function getMapCountryPath(countryCode: string) {
  const path = document.querySelector(
    `.knowledge-region-map-countries path[data-country-code="${countryCode}"]`,
  )
  expect(path).not.toBeNull()
  return path!
}

describe('knowledge pages', () => {
  it('shows the country topic and switches continent region catalogs', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/knowledge']}>
        <KnowledgePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: '国家 · 国旗 · 首都',
        level: 1,
      }),
    ).toBeVisible()
    expect(screen.getByLabelText('国家知识范围')).toHaveTextContent(
      '195个国家23个地区',
    )
    expect(screen.getByTestId('knowledge-region-east-asia')).toBeVisible()
    await waitFor(() => expect(getMapCountryPath('CN')).toBeInTheDocument())
    expect(getMapCountryPath('CN')).toHaveClass('is-continent')
    expect(getMapCountryPath('IN')).toHaveClass('is-continent')
    expect(getMapCountryPath('FR')).not.toHaveClass('is-continent')

    await user.click(screen.getByRole('tab', { name: /欧洲/ }))
    expect(screen.getByTestId('knowledge-region-north-europe')).toBeVisible()
    expect(screen.queryByTestId('knowledge-region-east-asia')).toBeNull()
    expect(getMapCountryPath('CN')).not.toHaveClass('is-continent')
    expect(getMapCountryPath('FR')).toHaveClass('is-continent')
  })

  it('combines country card fields, opens inline detail, and follows cross-region neighbours', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/knowledge/countries/east-asia']}>
        <Routes>
          <Route
            path="/knowledge/countries/:regionId"
            element={<KnowledgeRegionPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '东亚', level: 1 }),
    ).toBeVisible()
    expect(screen.queryByText('Asia · COUNTRY KNOWLEDGE')).toBeNull()
    expect(
      screen.queryByText('位于亚洲东部，季风影响显著，人口与城市密集。'),
    ).toBeNull()
    expect(screen.getByLabelText('国家详情提示')).toBeVisible()
    expect(
      screen.getAllByRole('button', { name: /查看.*国家详情/ }),
    ).toHaveLength(5)
    await waitFor(() => expect(getMapCountryPath('CN')).toBeInTheDocument())
    expect(document.querySelectorAll('path.is-region')).toHaveLength(5)
    expect(document.querySelectorAll('path.is-continent')).toHaveLength(0)
    expect(getMapCountryPath('CN')).toHaveClass('is-region')
    expect(getMapCountryPath('JP')).toHaveClass('is-region')
    expect(getMapCountryPath('IN')).not.toHaveClass('is-region')
    expect(screen.queryByText('逐国学习')).toBeNull()
    expect(screen.queryByText('观察国旗，猜一猜首都')).toBeNull()
    expect(screen.queryByRole('button', { name: '揭晓首都' })).toBeNull()

    const chinaCard = screen
      .getByRole('button', { name: '查看中国国家详情' })
      .closest('article')!
    const displayControls = screen.getByRole('group', {
      name: '国家卡显示内容',
    })
    const countryControl = within(displayControls).getByRole('button', {
      name: '国家',
    })
    const flagControl = within(displayControls).getByRole('button', {
      name: '国旗',
    })
    const capitalControl = within(displayControls).getByRole('button', {
      name: '首都',
    })

    expect(countryControl).toHaveAttribute('aria-pressed', 'false')
    expect(flagControl).toHaveAttribute('aria-pressed', 'true')
    expect(flagControl).toBeDisabled()
    expect(capitalControl).toHaveAttribute('aria-pressed', 'false')
    const chinaFlag = within(chinaCard).getByRole('img', {
      name: '中国国旗',
    })
    expect(chinaFlag).toHaveClass('country-flag-image')
    expect(chinaFlag.parentElement).toHaveClass('country-flag-frame')
    expect(within(chinaCard).queryByText('中国')).toBeNull()
    expect(within(chinaCard).queryByText('北京')).toBeNull()

    await user.click(capitalControl)
    expect(chinaCard).toHaveTextContent('北京')
    expect(flagControl).not.toBeDisabled()
    await user.click(countryControl)
    expect(chinaCard).toHaveTextContent('中国')
    expect(chinaCard).toHaveTextContent('China')

    await user.click(flagControl)
    expect(within(chinaCard).queryByRole('img')).toBeNull()
    await user.click(countryControl)
    expect(within(chinaCard).queryByText('中国')).toBeNull()
    expect(capitalControl).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '查看中国国家详情' }))
    expect(screen.queryByLabelText('国家详情提示')).toBeNull()
    expect(screen.getByLabelText('中国国家学习详情')).toBeVisible()
    expect(document.querySelectorAll('path.is-country')).toHaveLength(1)
    expect(document.querySelectorAll('path.is-region')).toHaveLength(4)
    expect(getMapCountryPath('CN')).toHaveClass('is-country')
    expect(getMapCountryPath('JP')).toHaveClass('is-region')
    await user.click(screen.getByRole('button', { name: '关闭国家学习详情' }))
    expect(screen.getByLabelText('国家详情提示')).toBeVisible()
    expect(document.querySelectorAll('path.is-country')).toHaveLength(0)
    expect(document.querySelectorAll('path.is-region')).toHaveLength(5)
    expect(getMapCountryPath('CN')).toHaveClass('is-region')

    await user.click(screen.getByRole('button', { name: '查看中国国家详情' }))
    await user.click(screen.getByRole('button', { name: '阿富汗' }))
    expect(
      screen.getByRole('heading', { name: '南亚', level: 1 }),
    ).toBeVisible()
    expect(screen.getByLabelText('阿富汗国家学习详情')).toBeVisible()
    expect(document.querySelectorAll('path.is-country')).toHaveLength(1)
    expect(getMapCountryPath('AF')).toHaveClass('is-country')
    expect(getMapCountryPath('IN')).toHaveClass('is-region')
    expect(getMapCountryPath('CN')).not.toHaveClass('is-region')
  })

  it('gives immediate feedback in the mixed regional challenge', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={['/knowledge/countries/east-asia/challenge']}
      >
        <Routes>
          <Route
            path="/knowledge/countries/:regionId/challenge"
            element={<KnowledgeChallengePage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('1 / 10')).toBeVisible()
    const questionFlag = screen.getByAltText('待识别的国旗')
    expect(questionFlag).toHaveClass('country-flag-image')
    expect(questionFlag.parentElement).toHaveClass(
      'country-flag-frame',
      'knowledge-question-flag',
    )
    const optionButtons = screen
      .getByRole('heading', { level: 1 })
      .parentElement!.querySelectorAll<HTMLButtonElement>(
        '.knowledge-question-options button',
      )
    expect(optionButtons).toHaveLength(4)
    await user.click(optionButtons[0])
    expect(screen.getByRole('button', { name: '下一题' })).toBeVisible()
    expect(screen.getByText(/回答正确|正确答案是/)).toBeVisible()
  })
})
