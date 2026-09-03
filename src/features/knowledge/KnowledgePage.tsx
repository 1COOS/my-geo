import { Link } from 'react-router-dom'

import {
  ContentPageHeader,
  ContentPageShell,
} from '../../shared/components/ContentPageShell'
import { knowledgeTopics, type KnowledgeTopicId } from './knowledgeTopics'

type KnowledgeHomeIconId = KnowledgeTopicId | 'questions'

type KnowledgeHomeCardDefinition = {
  id: string
  title: string
  description: string
  to: string
  iconId: KnowledgeHomeIconId
  testId: string
}

const questionModules: readonly KnowledgeHomeCardDefinition[] = [
  {
    id: 'country-questions',
    title: '知识问答',
    description: '通过国家、国旗与首都问答检验学习成果。',
    to: '/questions',
    iconId: 'questions',
    testId: 'knowledge-home-question-countries',
  },
]

function KnowledgeHomeIcon({ iconId }: { iconId: KnowledgeHomeIconId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {iconId === 'earth' ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" />
        </>
      ) : iconId === 'countries' ? (
        <>
          <path d="M6 21V4" />
          <path d="M7 5h10l-2 3 2 3H7" />
        </>
      ) : iconId === 'extremes' ? (
        <>
          <path d="M8 4h8v4a4 4 0 0 1-8 0zM10 14h4M9 20h6M12 12v8" />
          <path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4" />
        </>
      ) : iconId === 'water' ? (
        <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      ) : (
        <>
          <path d="M5 5.5h14v10H9l-4 3z" />
          <path d="M9.4 9a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2-2.6 3.4M12 15.8h.01" />
        </>
      )}
    </svg>
  )
}

function KnowledgeHomeCard({
  definition,
}: {
  definition: KnowledgeHomeCardDefinition
}) {
  return (
    <Link
      className="knowledge-home-card"
      data-testid={definition.testId}
      to={definition.to}
    >
      <span className="knowledge-home-card-icon">
        <KnowledgeHomeIcon iconId={definition.iconId} />
      </span>
      <span className="knowledge-home-card-copy">
        <strong>{definition.title}</strong>
        <span>{definition.description}</span>
      </span>
    </Link>
  )
}

export function KnowledgePage() {
  return (
    <ContentPageShell className="knowledge-home-shell" scrollMode="auto">
      <ContentPageHeader title="图鉴" subtitle="选择内容开始学习" />

      <section
        className="knowledge-home-section"
        aria-labelledby="knowledge-home-learning-title"
      >
        <h2 id="knowledge-home-learning-title">图鉴模块</h2>

        <div className="knowledge-home-grid">
          {knowledgeTopics.map((topic) => (
            <KnowledgeHomeCard
              key={topic.id}
              definition={{
                ...topic,
                iconId: topic.id,
                testId: `knowledge-home-module-${topic.id}`,
              }}
            />
          ))}
        </div>
      </section>

      <section
        className="knowledge-home-section knowledge-home-question-section"
        aria-labelledby="knowledge-home-question-title"
      >
        <h2 id="knowledge-home-question-title">问答模块</h2>

        <div className="knowledge-home-grid">
          {questionModules.map((module) => (
            <KnowledgeHomeCard key={module.id} definition={module} />
          ))}
        </div>
      </section>
    </ContentPageShell>
  )
}
