import { describe, expect, it } from 'vitest'

import {
  getNavigationBackFallback,
  resolveAppRouteMeta,
} from './navigationRoutes'

describe('resolveAppRouteMeta', () => {
  it.each([
    ['/explore', 'explore', true, null],
    ['/search', 'search', true, null],
    ['/knowledge', 'knowledge', true, null],
    ['/knowledge/countries', 'knowledge', false, '/knowledge'],
    [
      '/knowledge/countries/east-asia',
      'knowledge',
      false,
      '/knowledge/countries',
    ],
    ['/knowledge/earth/lines/equator', 'knowledge', false, '/knowledge/earth'],
    [
      '/knowledge/water/waterbodies/lake-baikal',
      'knowledge',
      false,
      '/knowledge/water',
    ],
    [
      '/knowledge/water/linear-features/amazon-system',
      'knowledge',
      false,
      '/knowledge/water',
    ],
    [
      '/knowledge/extremes/highest-peak/mount-everest',
      'knowledge',
      false,
      '/knowledge/extremes',
    ],
    ['/questions', 'knowledge', false, '/knowledge'],
    ['/questions/asia/easy', 'knowledge', false, '/questions'],
    ['/questions/countries/east-asia', 'knowledge', false, '/questions'],
    ['/unknown', 'explore', false, '/explore'],
  ] as const)('resolves %s', (pathname, section, primary, parentPath) => {
    expect(resolveAppRouteMeta(pathname)).toMatchObject({
      section,
      primary,
      parentPath,
    })
    expect(getNavigationBackFallback(pathname)).toBe(parentPath ?? '/explore')
  })
})
