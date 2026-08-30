import { Link, useSearchParams } from 'react-router-dom'

import { countries } from '../../data/countries'
import {
  getQuestionChallengeId,
  getQuestionContinentCountryCount,
  getQuestionDifficulty,
  questionDifficulties,
  questionDifficultySchema,
  type QuestionDifficulty,
} from '../../data/countryQuestionFamiliarity'
import { knowledgeContinents } from '../../data/knowledgeRegions'
import { knowledgeChallengeQuestionCount } from './knowledgeChallenge'
import { useQuestionProgress } from './useQuestionProgress'

export function KnowledgeQuestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedDifficulty = questionDifficultySchema.safeParse(
    searchParams.get('difficulty'),
  )
  const difficulty: QuestionDifficulty = parsedDifficulty.success
    ? parsedDifficulty.data
    : 'easy'
  const difficultyDefinition = getQuestionDifficulty(difficulty)
  const { progressByChallenge, persistenceStatus } = useQuestionProgress()
  const passedCount = [...progressByChallenge.values()].filter(
    (progress) => progress.passedAt !== null,
  ).length

  return (
    <main className="knowledge-shell knowledge-question-hub-shell">
      <section
        className="knowledge-question-hub-overview"
        aria-labelledby="knowledge-question-hub-title"
      >
        <div className="knowledge-question-hub-copy">
          <p>国家｜国旗｜首都</p>
          <h1 id="knowledge-question-hub-title">知识问答</h1>
          <span>按大洲选择难度，从最常见的国家开始。</span>
        </div>
        <div className="knowledge-question-hub-stats" aria-label="知识问答范围">
          <div>
            <strong>{countries.length}</strong>
            <span>国家</span>
          </div>
          <div>
            <strong>{knowledgeContinents.length}</strong>
            <span>大洲</span>
          </div>
          <div>
            <strong>{questionDifficulties.length}</strong>
            <span>难度</span>
          </div>
          <div>
            <strong>{passedCount}</strong>
            <span>已通过</span>
          </div>
        </div>
      </section>

      <section
        className="knowledge-question-hub-section"
        aria-labelledby="knowledge-question-country-title"
      >
        <header className="knowledge-question-hub-heading">
          <div>
            <p>国家问答</p>
            <h2 id="knowledge-question-country-title">选择难度与大洲</h2>
          </div>
          <span>
            当前：{difficultyDefinition.name} ·{' '}
            {knowledgeChallengeQuestionCount}题
          </span>
        </header>

        <div
          className="knowledge-question-difficulty-tabs knowledge-continent-tabs"
          role="tablist"
          aria-label="问答难度"
        >
          {questionDifficulties.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === difficulty}
              onClick={() => setSearchParams({ difficulty: item.id })}
            >
              <strong>{item.name}</strong>
              <span>{item.note}</span>
            </button>
          ))}
        </div>

        {persistenceStatus === 'memory-only' ||
        persistenceStatus === 'error' ? (
          <output className="knowledge-persistence-status" role="status">
            {persistenceStatus === 'memory-only'
              ? '当前浏览器无法使用本机存储，问答成绩不会保留。'
              : '读取本机问答成绩失败，当前显示安全默认值。'}
          </output>
        ) : null}

        <div className="knowledge-question-continent-grid">
          {knowledgeContinents.map((continent) => {
            const challengeId = getQuestionChallengeId(continent.id, difficulty)
            const progress = progressByChallenge.get(challengeId)
            const passed = progress ? progress.passedAt !== null : false

            return (
              <Link
                key={continent.id}
                className="knowledge-question-continent-card knowledge-region-card"
                data-testid={`knowledge-question-continent-${continent.id}`}
                to={`/questions/${continent.id}/${difficulty}`}
              >
                <div className="knowledge-question-continent-heading knowledge-region-heading">
                  <div>
                    <h3>{continent.name.zh}</h3>
                    <p>{continent.name.en}</p>
                  </div>
                  <span>{passed ? '已通过' : progress ? '继续' : '开始'}</span>
                </div>
                <div className="knowledge-question-continent-meta">
                  <span>
                    {getQuestionContinentCountryCount(continent.id)} 个国家
                  </span>
                  <i aria-hidden="true" />
                  <span>{knowledgeChallengeQuestionCount} 道题</span>
                </div>
                <div className="knowledge-question-continent-progress">
                  {progress ? (
                    <>
                      <strong className={passed ? 'is-passed' : undefined}>
                        最高 {progress.bestScore} 分
                      </strong>
                      <span>{progress.attemptCount} 次挑战</span>
                    </>
                  ) : (
                    <>
                      <strong>未开始</strong>
                      <span>进入问答</span>
                    </>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
