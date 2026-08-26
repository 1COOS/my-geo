import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import {
  getQuestionChallengeId,
  getQuestionContinent,
  getQuestionDifficulty,
  questionDifficultySchema,
} from '../../data/countryQuestionFamiliarity'
import { knowledgeContinentIdSchema } from '../../data/knowledgeRegions'
import {
  saveQuestionChallengeResult,
  type PersistenceStatus,
} from '../../storage/database'
import { CountryFlag } from '../../shared/components/CountryFlag'
import {
  createKnowledgeChallenge,
  getChallengeScore,
  hasPassedKnowledgeChallenge,
  type KnowledgeQuestion,
} from './knowledgeChallenge'

const questionEyebrows: Record<KnowledgeQuestion['kind'], string> = {
  'flag-to-country': '识别这面国旗',
  'country-to-flag': '选择正确的国旗',
  'country-to-capital': '匹配正确的首都',
}

export function KnowledgeChallengePage() {
  const { continentId: rawContinentId, difficulty: rawDifficulty } = useParams()
  const parsedContinentId = knowledgeContinentIdSchema.safeParse(rawContinentId)
  const parsedDifficulty = questionDifficultySchema.safeParse(rawDifficulty)
  const continentId = parsedContinentId.success
    ? parsedContinentId.data
    : undefined
  const difficulty = parsedDifficulty.success
    ? parsedDifficulty.data
    : undefined
  const [questions, setQuestions] = useState(() =>
    continentId && difficulty
      ? createKnowledgeChallenge(continentId, difficulty)
      : [],
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [finished, setFinished] = useState(false)
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>('idle')
  const shellRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (shellRef.current) shellRef.current.scrollTop = 0
  }, [finished, questionIndex])

  if (!continentId || !difficulty) return <Navigate to="/questions" replace />
  const continent = getQuestionContinent(continentId)
  const difficultyDefinition = getQuestionDifficulty(difficulty)
  const challengeId = getQuestionChallengeId(continentId, difficulty)
  const question = questions[questionIndex]
  const score = getChallengeScore(correctAnswers, questions.length)
  const passed = hasPassedKnowledgeChallenge(correctAnswers, questions.length)
  const returnTarget = `/questions?difficulty=${difficulty}`
  const correctOption = question.options.find(
    (option) => option.id === question.correctOptionId,
  )!
  const selectedCorrectly = selectedOptionId === question.correctOptionId
  const feedbackText = selectedOptionId
    ? question.kind === 'country-to-flag'
      ? selectedCorrectly
        ? `回答正确！正确答案：${correctOption.label}`
        : `回答错误。正确答案：${correctOption.label}`
      : selectedCorrectly
        ? '回答正确！'
        : `正确答案是：${correctOption.label}`
    : '选择一个答案，答题后会立即显示结果。'

  const selectOption = (optionId: string) => {
    if (selectedOptionId) return
    setSelectedOptionId(optionId)
    if (optionId === question.correctOptionId) {
      setCorrectAnswers((current) => current + 1)
    }
  }

  const persistScore = async (finalScore: number) => {
    setPersistenceStatus('saving')
    const result = await saveQuestionChallengeResult(challengeId, finalScore)
    setPersistenceStatus(result.status)
  }

  const moveNext = async () => {
    if (!selectedOptionId) return
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1)
      setSelectedOptionId(null)
      return
    }
    setFinished(true)
    const finalScore = getChallengeScore(correctAnswers, questions.length)
    await persistScore(finalScore)
  }

  const restart = () => {
    setQuestions(createKnowledgeChallenge(continentId, difficulty))
    setQuestionIndex(0)
    setSelectedOptionId(null)
    setCorrectAnswers(0)
    setFinished(false)
    setPersistenceStatus('idle')
  }

  if (finished) {
    return (
      <main
        ref={shellRef}
        className="knowledge-shell knowledge-challenge-shell"
      >
        <section className="knowledge-challenge-result" aria-live="polite">
          <span className={passed ? 'is-passed' : undefined}>
            {passed ? '挑战通过' : '继续加油'}
          </span>
          <h1>
            {continent.name.zh} · {difficultyDefinition.name}挑战完成
          </h1>
          <div className="knowledge-result-score">
            <strong data-testid="knowledge-challenge-score">{score}</strong>
            <span>分</span>
          </div>
          <p>
            你答对了 {correctAnswers} / {questions.length} 题。
            {passed
              ? '成绩已达到80%，此大洲难度已通过。'
              : '达到80%即可通过，返回问答入口复习后再试一次。'}
          </p>
          <div className="knowledge-result-progress" aria-hidden="true">
            <i style={{ width: `${score}%` }} />
          </div>
          <small role="status">
            {persistenceStatus === 'saved'
              ? '学习进度已保存在本机'
              : persistenceStatus === 'memory-only'
                ? '当前浏览器无法使用本机存储，本次成绩仅在当前页面保留'
                : persistenceStatus === 'error'
                  ? '学习进度保存失败，请重新尝试'
                  : '正在保存学习进度…'}
          </small>
          <div className="knowledge-result-actions">
            {persistenceStatus === 'error' ? (
              <button
                type="button"
                className="is-tertiary"
                onClick={() => void persistScore(score)}
              >
                重新保存
              </button>
            ) : null}
            <button type="button" className="is-primary" onClick={restart}>
              再挑战一次
            </button>
            <Link className="is-secondary" to={returnTarget}>
              返回知识问答
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main ref={shellRef} className="knowledge-shell knowledge-challenge-shell">
      <header className="knowledge-challenge-header">
        <Link to={returnTarget} aria-label="退出挑战">
          <span aria-hidden="true">‹</span>
          退出
        </Link>
        <div>
          <span>
            第 {questionIndex + 1} 题，共 {questions.length} 题
          </span>
          <i>
            <b
              style={{
                width: `${((questionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </i>
        </div>
        <strong>
          {continent.name.zh} · {difficultyDefinition.name}
        </strong>
      </header>

      <section className={`knowledge-question-card is-${question.kind}`}>
        <p>{questionEyebrows[question.kind]}</p>
        <h1>{question.prompt}</h1>
        {question.subjectFlagAsset ? (
          <CountryFlag
            className="knowledge-question-flag"
            src={question.subjectFlagAsset}
            alt="待识别的国旗"
          />
        ) : null}
        <div className="knowledge-question-options">
          {question.options.map((option, index) => {
            const isFlagChoice = question.kind === 'country-to-flag'
            const isSelected = selectedOptionId === option.id
            const isCorrect = option.id === question.correctOptionId
            const className = [
              'knowledge-question-option',
              isFlagChoice ? 'is-flag-choice' : undefined,
              selectedOptionId
                ? isCorrect
                  ? 'is-correct'
                  : isSelected
                    ? 'is-wrong'
                    : 'is-muted'
                : undefined,
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                key={option.id}
                type="button"
                className={className}
                aria-label={
                  isFlagChoice ? `国旗选项 ${index + 1}` : option.label
                }
                disabled={selectedOptionId !== null}
                onClick={() => selectOption(option.id)}
              >
                {option.flagAsset ? (
                  <CountryFlag src={option.flagAsset} alt="" />
                ) : null}
                {isFlagChoice ? null : <strong>{option.label}</strong>}
                {selectedOptionId && (isCorrect || isSelected) ? (
                  <span
                    className="knowledge-question-option-status"
                    aria-hidden="true"
                  >
                    {isCorrect ? '✓' : '×'}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="knowledge-question-feedback" aria-live="polite">
          {selectedOptionId ? (
            <>
              <p>{feedbackText}</p>
              <button
                type="button"
                disabled={persistenceStatus === 'saving'}
                onClick={() => void moveNext()}
              >
                {questionIndex === questions.length - 1 ? '查看成绩' : '下一题'}
              </button>
            </>
          ) : (
            <p>{feedbackText}</p>
          )}
        </div>
      </section>
    </main>
  )
}
