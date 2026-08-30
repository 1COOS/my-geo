import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export type KnowledgeTopicId = 'earth' | 'countries' | 'extremes' | 'water'

type KnowledgeTopicNavigationProps = {
  activeTopic: KnowledgeTopicId
  compact?: boolean
}

const topicOrder: KnowledgeTopicId[] = [
  'earth',
  'countries',
  'extremes',
  'water',
]

const availableTopics = {
  countries: {
    title: '国家首都',
    note: '国家｜国旗｜首都',
    to: '/knowledge',
  },
  earth: {
    title: '地球经纬',
    note: '经纬判读与五带',
    to: '/knowledge/earth',
  },
  extremes: {
    title: '世界之最',
    note: '最大｜最小｜最高｜最深',
    to: '/knowledge/extremes',
  },
  water: {
    title: '江河湖海',
    note: '海洋｜湖泊｜海峡｜河流',
    to: '/knowledge/water',
  },
} as const

export function KnowledgeTopicNavigation({
  activeTopic,
  compact = false,
}: KnowledgeTopicNavigationProps) {
  const topicGridRef = useRef<HTMLDivElement>(null)
  const activeCardRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const grid = topicGridRef.current
    const activeCard = activeCardRef.current
    if (!grid || !activeCard) return
    const alignActiveCard = () => {
      if (grid.scrollWidth <= grid.clientWidth) {
        grid.scrollLeft = 0
        return
      }
      grid.scrollLeft = Math.max(
        0,
        activeCard.offsetLeft + activeCard.offsetWidth - grid.clientWidth,
      )
    }
    alignActiveCard()
    const observer = new ResizeObserver(alignActiveCard)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [activeTopic])

  return (
    <section
      className="knowledge-topics"
      aria-label="知识主题"
      style={{
        flex: 'none',
        width: compact ? 'min(100%, 24rem)' : 'min(100%, 70rem)',
        marginInline: 'auto',
        marginBottom: compact ? '0.45rem' : '0.7rem',
      }}
    >
      <div
        ref={topicGridRef}
        className={`knowledge-topic-grid is-${activeTopic}-active`}
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        }}
      >
        {topicOrder.map((topicId) => {
          const topic = availableTopics[topicId]
          if (topicId === activeTopic) {
            return (
              <article
                ref={activeCardRef}
                className="knowledge-topic-card is-active"
                key={topicId}
                style={
                  compact
                    ? {
                        flex: '0 0 10.5rem',
                        minHeight: '3.25rem',
                        padding: '0.35rem 0.55rem',
                      }
                    : undefined
                }
              >
                <KnowledgeTopicContent topicId={topicId} heading="h1" />
              </article>
            )
          }

          return (
            <Link
              className="knowledge-topic-card is-available"
              key={topicId}
              to={topic.to}
              style={
                compact
                  ? {
                      flex: '0 0 10.5rem',
                      minHeight: '3.25rem',
                      padding: '0.35rem 0.55rem',
                    }
                  : undefined
              }
            >
              <KnowledgeTopicContent topicId={topicId} heading="h3" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function KnowledgeTopicContent({
  heading,
  topicId,
}: {
  heading: 'h1' | 'h3'
  topicId: KnowledgeTopicId
}) {
  const topic = availableTopics[topicId]
  const Heading = heading
  return (
    <div className="knowledge-topic-copy" style={{ minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          minWidth: 0,
          gap: '0.45rem',
          alignItems: 'center',
        }}
      >
        <KnowledgeTopicIcon topicId={topicId} />
        <Heading>{topic.title}</Heading>
      </div>
      <p>{topic.note}</p>
    </div>
  )
}

function KnowledgeTopicIcon({ topicId }: { topicId: KnowledgeTopicId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        flex: 'none',
        width: '1.05rem',
        height: '1.05rem',
        fill: 'none',
        stroke: 'var(--atlas-accent)',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      {topicId === 'earth' ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" />
        </>
      ) : topicId === 'countries' ? (
        <>
          <path d="M6 21V4" />
          <path d="M7 5h10l-2 3 2 3H7" />
        </>
      ) : topicId === 'extremes' ? (
        <>
          <path d="M8 4h8v4a4 4 0 0 1-8 0zM10 14h4M9 20h6M12 12v8" />
          <path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4" />
        </>
      ) : (
        <>
          <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        </>
      )}
    </svg>
  )
}
