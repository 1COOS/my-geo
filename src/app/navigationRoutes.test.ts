import { describe, expect, it } from 'vitest'

import {
  getNavigationParentPath,
  resolveAppRouteMeta,
} from './navigationRoutes'

describe('resolveAppRouteMeta', () => {
  it.each([
    ['/explore', 'explore', true, null, undefined],
    ['/search', 'search', true, null, undefined],
    ['/knowledge', 'knowledge', true, null, undefined],
    ['/knowledge/countries', 'knowledge', false, '/knowledge', undefined],
    [
      '/knowledge/countries/east-asia',
      'knowledge',
      false,
      '/knowledge/countries',
      undefined,
    ],
    [
      '/knowledge/earth/lines/equator',
      'knowledge',
      false,
      '/knowledge/earth',
      undefined,
    ],
    [
      '/knowledge/water/waterbodies/lake-baikal',
      'knowledge',
      false,
      '/knowledge/water',
      undefined,
    ],
    [
      '/knowledge/water/linear-features/amazon-system',
      'knowledge',
      false,
      '/knowledge/water',
      undefined,
    ],
    [
      '/knowledge/extremes/highest-peak/mount-everest',
      'knowledge',
      false,
      '/knowledge/extremes',
      undefined,
    ],
    ['/questions', 'knowledge', false, '/knowledge', undefined],
    [
      '/questions/asia/easy',
      'knowledge',
      false,
      '/questions',
      '/questions?difficulty=easy',
    ],
    [
      '/questions/world/hard',
      'knowledge',
      false,
      '/questions',
      '/questions?difficulty=hard',
    ],
    [
      '/questions/countries/east-asia',
      'knowledge',
      false,
      '/questions',
      undefined,
    ],
    ['/unknown', 'explore', false, '/explore', undefined],
  ] as const)(
    'resolves %s',
    (pathname, section, primary, parentPath, navigationParentPath) => {
      expect(resolveAppRouteMeta(pathname)).toMatchObject({
        section,
        primary,
        parentPath,
      })
      expect(getNavigationParentPath(pathname)).toBe(
        navigationParentPath ?? parentPath ?? '/explore',
      )
    },
  )
})
