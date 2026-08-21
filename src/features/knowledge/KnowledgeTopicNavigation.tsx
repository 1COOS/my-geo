import { Fragment } from 'react'
import { Link } from 'react-router-dom'

import {
  geographyReferenceLines,
  geographyTopics,
} from '../../data/geographyLearning'

type KnowledgeTopicId = 'countries' | 'earth'

type KnowledgeTopicNavigationProps = {
  activeTopic: KnowledgeTopicId
}

const futureTopics = [
  { name: '气候', note: '世界气候类型与分布规律' },
  { name: '地形', note: '山脉、高原、平原与盆地' },
  { name: '水域', note: '海洋、河流、湖泊与运河' },
]

const availableTopics = {
  countries: {
    title: '国家',
    note: '按区域认识国家、国旗与首都。',
    to: '/knowledge',
    stats: [
      { value: '195', label: '个国家' },
      { value: '23', label: '个地区' },
    ],
  },
  earth: {
    title: '地球',
    note: '认识经度基准、半球界线、纬度分区线与五带分界线。',
    to: '/knowledge/earth',
    stats: [
      { value: String(geographyTopics.length), label: '类用途' },
      { value: String(geographyReferenceLines.length), label: '条参考线' },
    ],
  },
} as const

export function KnowledgeTopicNavigation({
  activeTopic,
}: KnowledgeTopicNavigationProps) {
  return (
    <section className="knowledge-topics" aria-label="知识主题">
      <div className={`knowledge-topic-grid is-${activeTopic}-active`}>
        {(Object.keys(availableTopics) as KnowledgeTopicId[]).map((topicId) => {
          const topic = availableTopics[topicId]
          if (topicId === activeTopic) {
            return (
              <article className="knowledge-topic-card is-active" key={topicId}>
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
                <span>已开放</span>
                <h3>{topic.title}</h3>
                <p>{topic.note}</p>
              </div>
            </Link>
          )
        })}

        {futureTopics.map((topic) => (
          <article className="knowledge-topic-card is-locked" key={topic.name}>
            <div>
              <span>即将开放</span>
              <h3>{topic.name}</h3>
              <p>{topic.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
