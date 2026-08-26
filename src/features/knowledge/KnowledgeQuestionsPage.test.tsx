import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
          path="/questions/:continentId/:difficulty"
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
})

describe('KnowledgeQuestionsPage', () => {
  it('defaults invalid difficulty to easy and shows five continent cards', () => {
    renderQuestionHub('/questions?difficulty=unknown')

    expect(
      screen.getByRole('heading', { name: '知识问答', level: 1 }),
    ).toBeVisible()
    expect(screen.getByLabelText('知识问答范围')).toHaveTextContent(
      '195国家5大洲3难度0已通过',
    )
    expect(
      screen.getByRole('tab', { name: /简单.*最常见国家/ }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      document.querySelectorAll('.knowledge-question-continent-card'),
    ).toHaveLength(5)
    expect(screen.queryByText('中国、日本、印度等')).toBeNull()
  })

  it('switches difficulty and updates every continent challenge link', async () => {
    const user = userEvent.setup()
    renderQuestionHub()

    await user.click(screen.getByRole('tab', { name: /困难.*冷门国家/ }))

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/questions?difficulty=hard',
    )
    expect(
      screen.getByTestId('knowledge-question-continent-asia'),
    ).toHaveAttribute('href', '/questions/asia/hard')
    expect(
      screen.getByTestId('knowledge-question-continent-oceania'),
    ).toHaveAttribute('href', '/questions/oceania/hard')
  })

  it('shows continent country counts and the fixed round size', () => {
    renderQuestionHub()

    expect(
      screen.getByTestId('knowledge-question-continent-asia'),
    ).toHaveTextContent('47 个国家10 道题')
    expect(
      screen.getByTestId('knowledge-question-continent-oceania'),
    ).toHaveTextContent('14 个国家10 道题')
  })

  it('summarizes progress for the selected continent difficulty', () => {
    const progress = new Map<string, QuestionChallengeProgress>([
      [
        'asia:easy',
        {
          challengeId: 'asia:easy',
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
      screen.getByTestId('knowledge-question-continent-asia'),
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

  it('returns continent challenges to the original difficulty', async () => {
    const user = userEvent.setup()
    renderQuestionHub('/questions/asia/normal')

    await user.click(screen.getByRole('link', { name: '退出挑战' }))

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/questions?difficulty=normal',
    )
  })

  it('gives immediate feedback in a continent difficulty challenge', async () => {
    const user = userEvent.setup()
    renderQuestionHub('/questions/asia/easy')

    expect(screen.getByText('第 1 题，共 10 题')).toBeVisible()
    const questionFlag = screen.getByAltText('待识别的国旗')
    expect(questionFlag.parentElement).toHaveClass(
      'country-flag-frame',
      'knowledge-question-flag',
    )
    const optionButtons = document.querySelectorAll<HTMLButtonElement>(
      '.knowledge-question-options button',
    )
    expect(optionButtons).toHaveLength(4)
    await user.click(optionButtons[0])
    expect(screen.getByRole('button', { name: '下一题' })).toBeVisible()
    expect(screen.getByText(/回答正确|正确答案是/)).toBeVisible()
  })

  it('keeps country names out of flag choices before and after answering', async () => {
    const user = userEvent.setup()
    renderQuestionHub('/questions/asia/easy')

    await user.click(
      document.querySelectorAll<HTMLButtonElement>(
        '.knowledge-question-options button',
      )[0],
    )
    await user.click(screen.getByRole('button', { name: '下一题' }))

    expect(screen.getByText('选择正确的国旗')).toBeVisible()
    const flagOptions = screen.getAllByRole('button', {
      name: /国旗选项 \d/,
    })
    expect(flagOptions).toHaveLength(4)
    for (const option of flagOptions) {
      expect(option.querySelector('strong')).toBeNull()
      expect(option.querySelector('.country-flag-frame')).not.toBeNull()
    }

    await user.click(flagOptions[0])
    expect(screen.getByText(/正确答案：/)).toBeVisible()
    for (const option of flagOptions) {
      expect(option.querySelector('strong')).toBeNull()
    }
  })

  it('redirects invalid continent or difficulty routes to the question hub', () => {
    renderQuestionHub('/questions/unknown/easy')

    expect(screen.getByTestId('location')).toHaveTextContent('/questions')
  })
})
