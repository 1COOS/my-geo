export type NavigationSection = 'explore' | 'knowledge' | 'search'

export type AppRouteMeta = {
  match: (pathname: string) => boolean
  section: NavigationSection
  parentPath: string | null
  primary: boolean
}

const exact = (path: string) => (pathname: string) => pathname === path
const prefix = (path: string) => (pathname: string) =>
  pathname === path || pathname.startsWith(`${path}/`)

export const appRouteMetadata: readonly AppRouteMeta[] = [
  {
    match: exact('/explore'),
    section: 'explore',
    parentPath: null,
    primary: true,
  },
  {
    match: exact('/search'),
    section: 'search',
    parentPath: null,
    primary: true,
  },
  {
    match: exact('/knowledge'),
    section: 'knowledge',
    parentPath: null,
    primary: true,
  },
  {
    match: (pathname) => pathname.startsWith('/knowledge/earth/lines/'),
    section: 'knowledge',
    parentPath: '/knowledge/earth',
    primary: false,
  },
  {
    match: (pathname) => pathname.startsWith('/knowledge/countries/'),
    section: 'knowledge',
    parentPath: '/knowledge/countries',
    primary: false,
  },
  {
    match: (pathname) =>
      pathname.startsWith('/knowledge/water/groups/') ||
      pathname.startsWith('/knowledge/water/waterbodies/') ||
      pathname.startsWith('/knowledge/water/linear-features/'),
    section: 'knowledge',
    parentPath: '/knowledge/water',
    primary: false,
  },
  {
    match: (pathname) => pathname.startsWith('/knowledge/extremes/'),
    section: 'knowledge',
    parentPath: '/knowledge/extremes',
    primary: false,
  },
  {
    match: exact('/questions'),
    section: 'knowledge',
    parentPath: '/knowledge',
    primary: false,
  },
  {
    match: prefix('/questions'),
    section: 'knowledge',
    parentPath: '/questions',
    primary: false,
  },
  {
    match: prefix('/knowledge'),
    section: 'knowledge',
    parentPath: '/knowledge',
    primary: false,
  },
]

const fallbackRoute: AppRouteMeta = {
  match: () => true,
  section: 'explore',
  parentPath: '/explore',
  primary: false,
}

export function resolveAppRouteMeta(pathname: string): AppRouteMeta {
  return (
    appRouteMetadata.find((route) => route.match(pathname)) ?? fallbackRoute
  )
}

export function getNavigationParentPath(pathname: string) {
  const questionChallengeMatch = pathname.match(
    /^\/questions\/(?:world|asia|europe|africa|americas|oceania)\/(easy|normal|hard)$/,
  )
  if (questionChallengeMatch) {
    return `/questions?difficulty=${questionChallengeMatch[1]}`
  }

  return resolveAppRouteMeta(pathname).parentPath ?? '/explore'
}
