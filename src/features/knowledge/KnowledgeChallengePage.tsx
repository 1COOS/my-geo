import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import {
  getQuestionChallengeId,
  getQuestionDifficulty,
  getQuestionScope,
  questionDifficultySchema,
  questionScopeSchema,
} from '../../data/countryQuestionFamiliarity'
import { ContentPageShell } from '../../shared/components/ContentPageShell'
import { CountryFlag } from '../../shared/components/CountryFlag'
import {
  saveQuestionChallengeResult,
  type PersistenceStatus,
} from '../../storage/database'
import {
  createKnowledgeChallenge,
  getChallengeScore,
  hasPassedKnowledgeChallenge,
  type KnowledgeCharacterFillQuestion,
  type KnowledgeChoiceQuestion,
  type KnowledgeQuestion,
} from './knowledgeChallenge'

type ChoiceQuestionResponse = {
  format: 'choice'
  selectedOptionId: string
  answerText: string
  correct: boolean
}

type CharacterQuestionResponse = {
  format: 'character-fill'
  selectedCharacterIds: string[]
  answerText: string
  correct: boolean
}

type QuestionResponse = ChoiceQuestionResponse | CharacterQuestionResponse

const questionEyebrows: Record<KnowledgeQuestion['kind'], string> = {
  'flag-to-country': '看国旗答国家',
  'country-to-flag': '看国家选国旗',
  'country-to-capital': '看国家答首都',
}

function getChoiceFeedback(
  question: KnowledgeChoiceQuestion,
  response: ChoiceQuestionResponse,
) {
  const correctOption = question.options.find(
    (option) => option.id === question.correctOptionId,
  )!
  if (response.correct) {
    return question.kind === 'country-to-flag'
      ? `回答正确！正确答案：${correctOption.label}`
      : '回答正确！'
  }
  return `回答错误。正确答案：${correctOption.label}`
}

function getFillFeedback(
  question: KnowledgeCharacterFillQuestion,
  response: CharacterQuestionResponse,
) {
  return response.correct
    ? '回答正确！'
    : `回答错误。正确答案：${question.answerText}`
}

export function KnowledgeChallengePage() {
  const { scope: rawScope, difficulty: rawDifficulty } = useParams()
  const parsedScope = questionScopeSchema.safeParse(rawScope)
  const parsedDifficulty = questionDifficultySchema.safeParse(rawDifficulty)
  const scope = parsedScope.success ? parsedScope.data : undefined
  const difficulty = parsedDifficulty.success
    ? parsedDifficulty.data
    : undefined
  const [questions, setQuestions] = useState(() =>
    scope && difficulty ? createKnowledgeChallenge(scope, difficulty) : [],
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>(
    {},
  )
  const [characterDrafts, setCharacterDrafts] = useState<
    Record<string, string[]>
  >({})
  const [finished, setFinished] = useState(false)
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>('idle')
  const shellRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (shellRef.current) shellRef.current.scrollTop = 0
  }, [finished, questionIndex])

  if (!scope || !difficulty) return <Navigate to="/questions" replace />

  const scopeDefinition = getQuestionScope(scope)
  const difficultyDefinition = getQuestionDifficulty(difficulty)
  const challengeId = getQuestionChallengeId(scope, difficulty)
  const question = questions[questionIndex]
  const response = responses[question.id]
  const confirmedResponses = Object.values(responses)
  const correctAnswers = confirmedResponses.filter(
    (item) => item.correct,
  ).length
  const score = getChallengeScore(correctAnswers, questions.length)
  const passed = hasPassedKnowledgeChallenge(correctAnswers, questions.length)
  const returnTarget = `/questions?difficulty=${difficulty}`

  const persistScore = async (finalScore: number) => {
    setPersistenceStatus('saving')
    const result = await saveQuestionChallengeResult(challengeId, finalScore)
    setPersistenceStatus(result.status)
  }

  const movePrevious = () => {
    setQuestionIndex((current) => Math.max(0, current - 1))
  }

  const moveNext = async () => {
    if (!response) return
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1)
      return
    }
    setFinished(true)
    await persistScore(score)
  }

  const selectChoice = (
    choiceQuestion: KnowledgeChoiceQuestion,
    optionId: string,
  ) => {
    if (responses[choiceQuestion.id]) return
    const selectedOption = choiceQuestion.options.find(
      (option) => option.id === optionId,
    )!
    setResponses((current) => ({
      ...current,
      [choiceQuestion.id]: {
        format: 'choice',
        selectedOptionId: optionId,
        answerText: selectedOption.label,
        correct: optionId === choiceQuestion.correctOptionId,
      },
    }))
  }

  const updateCharacterDraft = (
    fillQuestion: KnowledgeCharacterFillQuestion,
    characterIds: string[],
  ) => {
    if (responses[fillQuestion.id]) return
    setCharacterDrafts((current) => ({
      ...current,
      [fillQuestion.id]: characterIds,
    }))
  }

  const selectCharacter = (
    fillQuestion: KnowledgeCharacterFillQuestion,
    characterId: string,
  ) => {
    const currentDraft = characterDrafts[fillQuestion.id] ?? []
    if (responses[fillQuestion.id] || currentDraft.includes(characterId)) {
      return
    }
    updateCharacterDraft(fillQuestion, [...currentDraft, characterId])
  }

  const removeCharacter = (
    fillQuestion: KnowledgeCharacterFillQuestion,
    characterIndex: number,
  ) => {
    const currentDraft = characterDrafts[fillQuestion.id] ?? []
    updateCharacterDraft(
      fillQuestion,
      currentDraft.filter((_, index) => index !== characterIndex),
    )
  }

  const undoCharacter = (fillQuestion: KnowledgeCharacterFillQuestion) => {
    const currentDraft = characterDrafts[fillQuestion.id] ?? []
    updateCharacterDraft(fillQuestion, currentDraft.slice(0, -1))
  }

  const confirmCharacterAnswer = (
    fillQuestion: KnowledgeCharacterFillQuestion,
  ) => {
    if (responses[fillQuestion.id]) return
    const selectedCharacterIds = characterDrafts[fillQuestion.id] ?? []
    if (selectedCharacterIds.length === 0) return
    const answerText = selectedCharacterIds
      .map(
        (characterId) =>
          fillQuestion.characterBank.find(
            (character) => character.id === characterId,
          )!.character,
      )
      .join('')
    setResponses((current) => ({
      ...current,
      [fillQuestion.id]: {
        format: 'character-fill',
        selectedCharacterIds,
        answerText,
        correct: fillQuestion.acceptedAnswers.includes(answerText),
      },
    }))
  }

  const restart = () => {
    setQuestions(createKnowledgeChallenge(scope, difficulty))
    setQuestionIndex(0)
    setResponses({})
    setCharacterDrafts({})
    setFinished(false)
    setPersistenceStatus('idle')
  }

  if (finished) {
    return (
      <ContentPageShell
        shellRef={shellRef}
        className="knowledge-challenge-shell is-result"
        scrollMode="auto"
      >
        <section className="knowledge-challenge-result" aria-live="polite">
          <span className={passed ? 'is-passed' : undefined}>
            {passed ? '挑战通过' : '继续加油'}
          </span>
          <h1>
            {scopeDefinition.name.zh} · {difficultyDefinition.name}挑战完成
          </h1>
          <div className="knowledge-result-score">
            <strong data-testid="knowledge-challenge-score">{score}</strong>
            <span>分</span>
          </div>
          <p>
            你答对了 {correctAnswers} / {questions.length} 题。
            {passed
              ? '成绩已达到80%，此范围与难度已通过。'
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
      </ContentPageShell>
    )
  }

  const fillQuestion =
    question.format === 'character-fill' ? question : undefined
  const fillResponse =
    response?.format === 'character-fill' ? response : undefined
  const selectedCharacterIds = fillQuestion
    ? (fillResponse?.selectedCharacterIds ??
      characterDrafts[fillQuestion.id] ??
      [])
    : []
  const selectedCharacters = fillQuestion
    ? selectedCharacterIds.map((characterId) =>
        fillQuestion.characterBank.find(
          (character) => character.id === characterId,
        ),
      )
    : []
  const feedbackText = response
    ? question.format === 'choice' && response.format === 'choice'
      ? getChoiceFeedback(question, response)
      : question.format === 'character-fill' &&
          response.format === 'character-fill'
        ? getFillFeedback(question, response)
        : ''
    : question.format === 'choice'
      ? '选择一个答案，答题后会立即显示结果。'
      : '点击下方中文字组成答案，选择至少一个字后即可确认。'

  return (
    <ContentPageShell
      shellRef={shellRef}
      className="knowledge-challenge-shell"
      scrollMode="auto"
    >
      <header className="knowledge-challenge-header">
        <button
          type="button"
          className="knowledge-challenge-previous"
          disabled={questionIndex === 0}
          onClick={movePrevious}
        >
          <span aria-hidden="true">‹</span>
          上一题
        </button>
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
          {scopeDefinition.name.zh} · {difficultyDefinition.name}
        </strong>
      </header>

      <div className="knowledge-challenge-workbench">
        <section
          className={`knowledge-question-card is-${question.kind} is-${question.format}`}
        >
          <p>
            {question.format === 'choice' ? '选择题' : '填空题'} ·{' '}
            {questionEyebrows[question.kind]}
          </p>
          <h1>{question.prompt}</h1>
          {question.subjectFlagAsset ? (
            <div className="knowledge-question-flag-wrap">
              <CountryFlag
                className="knowledge-question-flag"
                src={question.subjectFlagAsset}
                alt="待识别的国旗"
              />
            </div>
          ) : null}

          {question.format === 'choice' ? (
            <div className="knowledge-question-options">
              {question.options.map((option, index) => {
                const choiceResponse =
                  response?.format === 'choice' ? response : undefined
                const isFlagChoice = question.kind === 'country-to-flag'
                const isSelected =
                  choiceResponse?.selectedOptionId === option.id
                const isCorrect = option.id === question.correctOptionId
                const className = [
                  'knowledge-question-option',
                  isFlagChoice ? 'is-flag-choice' : undefined,
                  choiceResponse
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
                    disabled={Boolean(choiceResponse)}
                    onClick={() => selectChoice(question, option.id)}
                  >
                    {option.flagAsset ? (
                      <CountryFlag src={option.flagAsset} alt="" />
                    ) : null}
                    {isFlagChoice ? null : <strong>{option.label}</strong>}
                    {choiceResponse && (isCorrect || isSelected) ? (
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
          ) : (
            <div className="knowledge-character-fill">
              <div
                className={[
                  'knowledge-character-answer',
                  fillResponse?.correct && 'is-correct',
                  fillResponse && !fillResponse.correct && 'is-wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label="已组成的答案"
                aria-live="polite"
              >
                {selectedCharacters.length > 0 ? (
                  selectedCharacters.map((character, index) =>
                    fillResponse ? (
                      <span key={character!.id}>{character!.character}</span>
                    ) : (
                      <button
                        key={character!.id}
                        type="button"
                        aria-label={`移除第 ${index + 1} 个字 ${character!.character}`}
                        onClick={() => removeCharacter(question, index)}
                      >
                        {character!.character}
                      </button>
                    ),
                  )
                ) : (
                  <span className="is-placeholder">答案会显示在这里</span>
                )}
              </div>
              <div className="knowledge-character-bank" aria-label="候选中文字">
                {question.characterBank.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    disabled={
                      Boolean(fillResponse) ||
                      selectedCharacterIds.includes(character.id)
                    }
                    onClick={() => selectCharacter(question, character.id)}
                  >
                    {character.character}
                  </button>
                ))}
              </div>
              <div className="knowledge-character-actions">
                <button
                  type="button"
                  className="is-undo"
                  disabled={
                    Boolean(fillResponse) || selectedCharacterIds.length === 0
                  }
                  onClick={() => undoCharacter(question)}
                >
                  撤回
                </button>
                <button
                  type="button"
                  className="is-confirm"
                  disabled={
                    Boolean(fillResponse) || selectedCharacterIds.length === 0
                  }
                  onClick={() => confirmCharacterAnswer(question)}
                >
                  确认答案
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="knowledge-challenge-status" aria-label="本轮状态">
          <h2>本轮状态</h2>
          <dl>
            <div>
              <dt>范围</dt>
              <dd>{scopeDefinition.name.zh}</dd>
            </div>
            <div>
              <dt>难度</dt>
              <dd>{difficultyDefinition.name}</dd>
            </div>
            <div>
              <dt>当前得分</dt>
              <dd>
                {correctAnswers} / {confirmedResponses.length}
              </dd>
            </div>
          </dl>
          <ol aria-label="本轮题目进度">
            {questions.map((item, index) => {
              const itemResponse = responses[item.id]
              return (
                <li
                  key={item.id}
                  className={[
                    index === questionIndex && 'is-viewing',
                    itemResponse?.correct && 'is-correct',
                    itemResponse && !itemResponse.correct && 'is-wrong',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={
                    itemResponse
                      ? `第 ${index + 1} 题${itemResponse.correct ? '正确' : '错误'}`
                      : index === questionIndex
                        ? `正在查看第 ${index + 1} 题`
                        : `第 ${index + 1} 题未作答`
                  }
                >
                  <span>{index + 1}</span>
                </li>
              )
            })}
          </ol>
        </aside>
      </div>

      <div className="knowledge-question-feedback" aria-live="polite">
        <p>{feedbackText}</p>
        {response ? (
          <button
            type="button"
            disabled={persistenceStatus === 'saving'}
            onClick={() => void moveNext()}
          >
            {questionIndex === questions.length - 1 ? '查看成绩' : '下一题'}
          </button>
        ) : null}
      </div>
    </ContentPageShell>
  )
}
