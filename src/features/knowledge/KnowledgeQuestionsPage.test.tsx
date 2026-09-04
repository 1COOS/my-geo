import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { QuestionChallengeProgress } from '../../storage/database'
import { KnowledgeChallengePage } from './KnowledgeChallengePage'
import { KnowledgeQuestionsPage } from './KnowledgeQuestionsPage'
import { useQuestionProgress } from './useQuestionProgress'

vi.mock('./useQuestionProgress', () => ({
  useQuestionProgress: vi.fn(),
}))

const mockedUseQuestionProgress = vi.mocked(useQuestionProgress)

function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  )
}

function renderQuestionHub(initialEntry = '/questions') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/questions" element={<KnowledgeQuestionsPage />} />
        <Route
          path="/questions/:scope/:difficulty"
          element={<KnowledgeChallengePage />}
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedUseQuestionProgress.mockReturnValue({
    progressByChallenge: new Map(),
    persistenceStatus: 'idle',
  })
  vi.spyOn(Math, 'random').mockReturnValue(0)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('KnowledgeQuestionsPage', () => {
  it('defaults invalid difficulty to easy and shows world plus five continents', () => {
    renderQuestionHub('/questions?difficulty=unknown')

    expect(
      screen.getByRole('heading', { name: '知识问答', level: 1 }),
    ).toBeVisible()
    expect(screen.getByLabelText('知识问答范围')).toHaveTextContent(
      '195国家全球+5范围3难度0已通过',
    )
    expect(
      screen.getByRole('tab', { name: /简单.*最常见国家/ }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      document.querySelectorAll('.knowledge-question-continent-card'),
    ).toHaveLength(6)
    expect(
      screen.getByTestId('knowledge-question-scope-world'),
    ).toHaveAttribute('href', '/questions/world/easy')
  })

  it('switches colored difficulty tabs and updates every scope link', async () => {
    const user = userEvent.setup()
    renderQuestionHub()

    const hardTab = screen.getByRole('tab', {
      name: /困难.*冷门国家/,
    })
    expect(hardTab).toHaveClass('is-hard')
    await user.click(hardTab)

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/questions?difficulty=hard',
    )
    expect(
      screen.getByTestId('knowledge-question-scope-world'),
    ).toHaveAttribute('href', '/questions/world/hard')
    expect(
      screen.getByTestId('knowledge-question-continent-oceania'),
    ).toHaveAttribute('href', '/questions/oceania/hard')
  })

  it('shows current difficulty pool counts and the fixed round size', () => {
    renderQuestionHub()

    expect(
      screen.getByTestId('knowledge-question-scope-world'),
    ).toHaveTextContent('50 个国家10 道题')
    expect(
      screen.getByTestId('knowledge-question-continent-asia'),
    ).toHaveTextContent('12 个国家10 道题')
    expect(
      screen.getByTestId('knowledge-question-continent-oceania'),
    ).toHaveTextContent('4 个国家10 道题')
  })

  it('summarizes progress for world and continent challenges', () => {
    const progress = new Map<string, QuestionChallengeProgress>([
      [
        'world:easy',
        {
          challengeId: 'world:easy',
          bestScore: 70,
          lastScore: 70,
          attemptCount: 2,
          passedAt: null,
          updatedAt: 1000,
        },
      ],
      [
        'europe:easy',
        {
          challengeId: 'europe:easy',
          bestScore: 90,
          lastScore: 90,
          attemptCount: 3,
          passedAt: 2000,
          updatedAt: 2000,
        },
      ],
    ])
    mockedUseQuestionProgress.mockReturnValue({
      progressByChallenge: progress,
      persistenceStatus: 'idle',
    })

    renderQuestionHub()

    expect(screen.getByLabelText('知识问答范围')).toHaveTextContent('1已通过')
    expect(
      screen.getByTestId('knowledge-question-scope-world'),
    ).toHaveTextContent(/继续.*最高 70 分.*2 次挑战/)
    expect(
      screen.getByTestId('knowledge-question-continent-europe'),
    ).toHaveTextContent(/已通过.*最高 90 分.*3 次挑战/)
  })

  it.each([
    ['memory-only', '当前浏览器无法使用本机存储，问答成绩不会保留。'],
    ['error', '读取本机问答成绩失败，当前显示安全默认值。'],
  ] as const)('reports %s persistence status', (status, message) => {
    mockedUseQuestionProgress.mockReturnValue({
      progressByChallenge: new Map(),
      persistenceStatus: status,
    })

    renderQuestionHub()

    expect(screen.getByRole('status')).toHaveTextContent(message)
  })

  it('uses a single previous control and gives immediate choice feedback', async () => {
    const user = userEvent.setup()
    renderQuestionHub('/questions/asia/easy')

    expect(screen.queryByRole('link', { name: '退出挑战' })).toBeNull()
    expect(screen.getByRole('button', { name: '上一题' })).toBeDisabled()
    expect(screen.getByText('第 1 题，共 10 题')).toBeVisible()
    expect(screen.getByAltText('待识别的国旗')).toBeVisible()
    const optionButtons = document.querySelectorAll<HTMLButtonElement>(
      '.knowledge-question-options button',
    )
    expect(optionButtons).toHaveLength(4)
    await user.click(optionButtons[0])
    expect(screen.getByRole('button', { name: '下一题' })).toBeVisible()
    expect(screen.getByText(/回答正确|回答错误/)).toBeVisible()
  })

  it('builds an answer without exposing its length and allows early confirmation', async () => {
    vi.mocked(Math.random).mockReturnValue(0.99)
    const user = userEvent.setup()
    renderQuestionHub('/questions/asia/easy')

    const answer = screen.getByLabelText('已组成的答案')
    const bank = screen.getByLabelText('候选中文字')
    const confirm = screen.getByRole('button', { name: '确认答案' })

    expect(answer).toHaveTextContent('答案会显示在这里')
    expect(answer).not.toHaveTextContent(/\d+\s*\/\s*\d+/)
    expect(within(bank).getAllByRole('button')).toHaveLength(12)
    expect(confirm).toBeDisabled()

    await user.click(within(bank).getByRole('button', { name: '北' }))
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    expect(screen.getByText('回答错误。正确答案：北京')).toBeVisible()
  })

  it('keeps a current draft while previous confirmed questions stay read only', async () => {
    vi.mocked(Math.random).mockReturnValue(0.99)
    const user = userEvent.setup()
    renderQuestionHub('/questions/asia/easy')

    const firstBank = screen.getByLabelText('候选中文字')
    await user.click(within(firstBank).getByRole('button', { name: '北' }))
    await user.click(within(firstBank).getByRole('button', { name: '京' }))
    await user.click(screen.getByRole('button', { name: '确认答案' }))
    await user.click(screen.getByRole('button', { name: '下一题' }))

    const secondBank = screen.getByLabelText('候选中文字')
    await user.click(within(secondBank).getByRole('button', { name: '东' }))
    await user.click(screen.getByRole('button', { name: '上一题' }))

    expect(screen.getByText('回答正确！')).toBeVisible()
    expect(screen.getByLabelText('已组成的答案')).toHaveTextContent('北京')
    expect(
      within(screen.getByLabelText('候选中文字')).getAllByRole('button')[0],
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '下一题' }))
    expect(screen.getByLabelText('已组成的答案')).toHaveTextContent('东')
  })

  it('opens a world challenge and redirects invalid scopes', () => {
    const { unmount } = renderQuestionHub('/questions/world/easy')
    expect(screen.getByText('全球 · 简单')).toBeVisible()
    unmount()

    renderQuestionHub('/questions/unknown/easy')
    expect(screen.getByTestId('location')).toHaveTextContent('/questions')
  })
})
