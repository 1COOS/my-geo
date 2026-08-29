import { Fragment, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import {
  geographyReferenceLines,
  geographyTopics,
} from '../../data/geographyLearning'
import {
  waterLearningObjectCount,
  waterLearningLayers,
} from '../../data/waterLearning'

type KnowledgeTopicId = 'countries' | 'earth' | 'water'
type NavigationTopicId = KnowledgeTopicId | 'climate' | 'terrain'

type KnowledgeTopicNavigationProps = {
  activeTopic: KnowledgeTopicId
}

const futureTopics = {
  climate: { name: '气候', note: '世界气候类型与分布规律' },
  terrain: { name: '地形', note: '山脉、高原、平原与盆地' },
} as const

const topicOrder: NavigationTopicId[] = [
  'countries',
  'earth',
  'climate',
  'terrain',
  'water',
]

const availableTopics = {
  countries: {
    title: '国家',
    note: '国家｜国旗｜首都',
    to: '/knowledge',
    stats: [
      { value: '195', label: '国家' },
      { value: '23', label: '地区' },
    ],
  },
  earth: {
    title: '地球',
    note: '经纬判读与五带',
    to: '/knowledge/earth',
    stats: [
      { value: String(geographyTopics.length), label: '用途' },
      { value: String(geographyReferenceLines.length), label: '参考线' },
    ],
  },
  water: {
    title: '水域',
    note: '海洋｜湖泊｜水域｜河流',
    to: '/knowledge/water',
    stats: [
      { value: String(waterLearningLayers.length), label: '图层' },
      { value: String(waterLearningObjectCount), label: '对象' },
    ],
  },
} as const

export function KnowledgeTopicNavigation({
  activeTopic,
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
    <section className="knowledge-topics" aria-label="知识主题">
      <div
        ref={topicGridRef}
        className={`knowledge-topic-grid is-${activeTopic}-active`}
        style={{
          gridTemplateColumns: topicOrder
            .map((topicId) =>
              topicId === activeTopic
                ? 'minmax(18rem, 1.55fr)'
                : 'minmax(9rem, 1fr)',
            )
            .join(' '),
        }}
      >
        {topicOrder.map((topicId) => {
          if (topicId === 'climate' || topicId === 'terrain') {
            const topic = futureTopics[topicId]
            return (
              <article className="knowledge-topic-card is-locked" key={topicId}>
                <div>
                  <h3>{topic.name}</h3>
                  <p>{topic.note}</p>
                </div>
              </article>
            )
          }

          const topic = availableTopics[topicId]
          if (topicId === activeTopic) {
            return (
              <article
                ref={activeCardRef}
                className="knowledge-topic-card is-active"
                key={topicId}
              >
                <div className="knowledge-topic-copy">
                  <h1>{topic.title}</h1>
                  <p>{topic.note}</p>
                </div>
                <div
                  className="knowledge-topic-stats"
                  aria-label={`${topic.title}知识范围`}
                >
                  {topic.stats.map((stat, index) => (
                    <Fragment key={stat.label}>
                      {index > 0 ? <i aria-hidden="true" /> : null}
                      <div>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </article>
            )
          }

          return (
            <Link
              className="knowledge-topic-card is-available"
              key={topicId}
              to={topic.to}
            >
              <div>
                <h3>{topic.title}</h3>
                <p>{topic.note}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
