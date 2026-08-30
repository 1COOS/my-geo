export type KnowledgeTopicId = 'earth' | 'countries' | 'extremes' | 'water'

export type KnowledgeTopic = {
  id: KnowledgeTopicId
  title: string
  to: string
  matches: (pathname: string) => boolean
}

function isRouteFamily(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export const knowledgeTopics: readonly KnowledgeTopic[] = [
  {
    id: 'earth',
    title: '地球经纬',
    to: '/knowledge/earth',
    matches: (pathname) => isRouteFamily(pathname, '/knowledge/earth'),
  },
  {
    id: 'countries',
    title: '国家首都',
    to: '/knowledge',
    matches: (pathname) =>
      pathname === '/knowledge' ||
      isRouteFamily(pathname, '/knowledge/countries'),
  },
  {
    id: 'extremes',
    title: '世界之最',
    to: '/knowledge/extremes',
    matches: (pathname) => isRouteFamily(pathname, '/knowledge/extremes'),
  },
  {
    id: 'water',
    title: '江河湖海',
    to: '/knowledge/water',
    matches: (pathname) => isRouteFamily(pathname, '/knowledge/water'),
  },
]

export function getActiveKnowledgeTopic(pathname: string) {
  return knowledgeTopics.find((topic) => topic.matches(pathname))
}
