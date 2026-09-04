import { Link, useSearchParams } from 'react-router-dom'

import { countries } from '../../data/countries'
import {
  getQuestionChallengeId,
  getQuestionDifficulty,
  getQuestionPoolCountryCount,
  questionDifficulties,
  questionDifficultySchema,
  questionWorldScope,
  type QuestionDifficulty,
  type QuestionScope,
} from '../../data/countryQuestionFamiliarity'
import { knowledgeContinents } from '../../data/knowledgeRegions'
import { ContentPageShell } from '../../shared/components/ContentPageShell'
import type { QuestionChallengeProgress } from '../../storage/database'
import { knowledgeChallengeQuestionCount } from './knowledgeChallenge'
import { useQuestionProgress } from './useQuestionProgress'

type QuestionScopeDefinition =
  typeof questionWorldScope | (typeof knowledgeContinents)[number]

function QuestionScopeCard({
  definition,
  difficulty,
  featured = false,
  progress,
}: {
  definition: QuestionScopeDefinition
  difficulty: QuestionDifficulty
  featured?: boolean
  progress?: QuestionChallengeProgress
}) {
  const scope: QuestionScope = definition.id
  const passed = progress ? progress.passedAt !== null : false
  const testId =
    scope === 'world'
      ? 'knowledge-question-scope-world'
      : `knowledge-question-continent-${scope}`

  return (
    <Link
      className={[
        'knowledge-question-scope-card',
        'knowledge-question-continent-card',
        'knowledge-region-card',
        featured && 'is-world',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={testId}
      to={`/questions/${scope}/${difficulty}`}
    >
      <div className="knowledge-question-continent-heading knowledge-region-heading">
        <div>
          <h3>{definition.name.zh}</h3>
          <p>{definition.name.en}</p>
        </div>
        <span>{passed ? '已通过' : progress ? '继续' : '开始'}</span>
      </div>
      <div className="knowledge-question-continent-meta">
        <span>{getQuestionPoolCountryCount(scope, difficulty)} 个国家</span>
        <i aria-hidden="true" />
        <span>{knowledgeChallengeQuestionCount} 道题</span>
        {featured ? (
          <>
            <i aria-hidden="true" />
            <span>全球难度题池随机抽取</span>
          </>
        ) : null}
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
}

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
  const getProgress = (scope: QuestionScope) =>
    progressByChallenge.get(getQuestionChallengeId(scope, difficulty))

  return (
    <ContentPageShell
      className={`knowledge-question-hub-shell is-difficulty-${difficulty}`}
      scrollMode="auto"
    >
      <section
        className="knowledge-question-hub-overview"
        aria-labelledby="knowledge-question-hub-title"
      >
        <div className="knowledge-question-hub-copy">
          <p>国家｜国旗｜首都</p>
          <h1 id="knowledge-question-hub-title">知识问答</h1>
          <span>选择难度，从全球或一个大洲开始混合挑战。</span>
        </div>
        <div className="knowledge-question-hub-stats" aria-label="知识问答范围">
          <div>
            <strong>{countries.length}</strong>
            <span>国家</span>
          </div>
          <div>
            <strong>全球+{knowledgeContinents.length}</strong>
            <span>范围</span>
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
            <p>混合问答</p>
            <h2 id="knowledge-question-country-title">选择难度与范围</h2>
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
              className={`is-${item.id}`}
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

        <div className="knowledge-question-world-card">
          <QuestionScopeCard
            definition={questionWorldScope}
            difficulty={difficulty}
            featured
            progress={getProgress('world')}
          />
        </div>

        <div className="knowledge-question-continent-grid">
          {knowledgeContinents.map((continent) => (
            <QuestionScopeCard
              key={continent.id}
              definition={continent}
              difficulty={difficulty}
              progress={getProgress(continent.id)}
            />
          ))}
        </div>
      </section>
    </ContentPageShell>
  )
}
