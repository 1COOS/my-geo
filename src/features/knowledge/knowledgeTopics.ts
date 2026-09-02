export type KnowledgeTopicId = 'earth' | 'countries' | 'extremes' | 'water'

export type KnowledgeTopic = {
  id: KnowledgeTopicId
  title: string
  description: string
  to: string
}

export const knowledgeTopics: readonly KnowledgeTopic[] = [
  {
    id: 'earth',
    title: '地球经纬',
    description: '认识经纬线、半球与地球分区。',
    to: '/knowledge/earth',
  },
  {
    id: 'countries',
    title: '国家首都',
    description: '按大洲和区域学习国家、国旗与首都。',
    to: '/knowledge/countries',
  },
  {
    id: 'extremes',
    title: '世界之最',
    description: '探索地球尺度、山川湖海与极值纪录。',
    to: '/knowledge/extremes',
  },
  {
    id: 'water',
    title: '江河湖海',
    description: '按水域类型认识海洋、湖泊、河流与水道。',
    to: '/knowledge/water',
  },
]
