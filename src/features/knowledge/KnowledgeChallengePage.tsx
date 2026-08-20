import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { getKnowledgeRegion } from '../../data/knowledgeRegions'
import {
  saveKnowledgeChallengeResult,
  type PersistenceStatus,
} from '../../storage/database'
import { CountryFlag } from '../../shared/components/CountryFlag'
import {
  createKnowledgeChallenge,
  getChallengeScore,
  hasPassedKnowledgeChallenge,
} from './knowledgeChallenge'

export function KnowledgeChallengePage() {
  const { regionId: rawRegionId } = useParams()
  const region = getKnowledgeRegion(rawRegionId)
  const [questions, setQuestions] = useState(() =>
    region ? createKnowledgeChallenge(region.id) : [],
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [finished, setFinished] = useState(false)
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>('idle')

  if (!region) return <Navigate to="/knowledge" replace />
  const question = questions[questionIndex]
  const score = getChallengeScore(correctAnswers, questions.length)
  const passed = hasPassedKnowledgeChallenge(correctAnswers, questions.length)

  const selectOption = (optionId: string) => {
    if (selectedOptionId) return
    setSelectedOptionId(optionId)
    if (optionId === question.correctOptionId) {
      setCorrectAnswers((current) => current + 1)
    }
  }

  const persistScore = async (finalScore: number) => {
    setPersistenceStatus('saving')
    const result = await saveKnowledgeChallengeResult(region.id, finalScore)
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
    setQuestions(createKnowledgeChallenge(region.id))
    setQuestionIndex(0)
    setSelectedOptionId(null)
    setCorrectAnswers(0)
    setFinished(false)
    setPersistenceStatus('idle')
  }

  if (finished) {
    return (
      <main className="knowledge-shell knowledge-challenge-shell">
        <section className="knowledge-challenge-result" aria-live="polite">
          <span className={passed ? 'is-passed' : undefined}>
            {passed ? '挑战通过' : '继续加油'}
          </span>
          <h1>{region.name.zh}挑战完成</h1>
          <div className="knowledge-result-score">
            <strong data-testid="knowledge-challenge-score">{score}</strong>
            <span>分</span>
          </div>
          <p>
            你答对了 {correctAnswers} / {questions.length} 题。
            {passed
              ? '成绩已达到80%，这一区域已经点亮。'
              : '达到80%即可通过，回到区域页复习后再试一次。'}
          </p>
          <small role="status">
            {persistenceStatus === 'saved'
              ? '学习进度已保存在本机'
              : persistenceStatus === 'memory-only'
                ? '当前浏览器无法使用本机存储，本次成绩仅在当前页面保留'
                : persistenceStatus === 'error'
                  ? '学习进度保存失败，请重新尝试'
                  : '正在保存学习进度…'}
          </small>
          <div>
            {persistenceStatus === 'error' ? (
              <button type="button" onClick={() => void persistScore(score)}>
                重新保存
              </button>
            ) : null}
            <button type="button" onClick={restart}>
              再挑战一次
            </button>
            <Link to={`/knowledge/countries/${region.id}`}>返回区域学习</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="knowledge-shell knowledge-challenge-shell">
      <header className="knowledge-challenge-header">
        <Link to={`/knowledge/countries/${region.id}`}>× 退出挑战</Link>
        <div>
          <span>
            {questionIndex + 1} / {questions.length}
          </span>
          <i>
            <b
              style={{
                width: `${((questionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </i>
        </div>
        <strong>{region.name.zh}</strong>
      </header>

      <section className="knowledge-question-card">
        <p>区域即时挑战</p>
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
            const isSelected = selectedOptionId === option.id
            const isCorrect = option.id === question.correctOptionId
            const className = selectedOptionId
              ? isCorrect
                ? 'is-correct'
                : isSelected
                  ? 'is-wrong'
                  : undefined
              : undefined
            return (
              <button
                key={option.id}
                type="button"
                className={className}
                disabled={selectedOptionId !== null}
                onClick={() => selectOption(option.id)}
              >
                <span className="knowledge-question-option-index">
                  {index + 1}
                </span>
                {option.flagAsset ? (
                  <CountryFlag src={option.flagAsset} alt="" />
                ) : null}
                <strong>{option.label}</strong>
              </button>
            )
          })}
        </div>

        <div className="knowledge-question-feedback" aria-live="polite">
          {selectedOptionId ? (
            <>
              <p>
                {selectedOptionId === question.correctOptionId
                  ? '回答正确！'
                  : `正确答案是：${question.options.find((option) => option.id === question.correctOptionId)?.label}`}
              </p>
              <button
                type="button"
                disabled={persistenceStatus === 'saving'}
                onClick={() => void moveNext()}
              >
                {questionIndex === questions.length - 1 ? '查看成绩' : '下一题'}
              </button>
            </>
          ) : (
            <p>选择一个答案，答题后会立即显示结果。</p>
          )}
        </div>
      </section>
    </main>
  )
}
