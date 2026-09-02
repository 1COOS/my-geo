export const primaryNavigationPaths = new Set([
  '/explore',
  '/knowledge',
  '/search',
])

export function getNavigationBackFallback(pathname: string) {
  if (pathname.startsWith('/knowledge/countries/'))
    return '/knowledge/countries'
  if (pathname.startsWith('/knowledge/earth/lines/')) return '/knowledge/earth'
  if (
    pathname.startsWith('/knowledge/water/groups/') ||
    pathname.startsWith('/knowledge/water/waterbodies/') ||
    pathname.startsWith('/knowledge/water/linear-features/')
  )
    return '/knowledge/water'
  if (pathname.startsWith('/knowledge/extremes/')) return '/knowledge/extremes'
  if (pathname.startsWith('/questions/')) return '/questions'
  if (pathname === '/questions' || pathname.startsWith('/knowledge/'))
    return '/knowledge'
  return '/explore'
}
