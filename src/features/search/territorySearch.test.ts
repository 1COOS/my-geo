import { describe, expect, it } from 'vitest'

import { territories } from '../../data/territories'
import {
  getExplorePathForPlaceSearchResult,
  searchPlaces,
} from './placeSearchUtils'

function search(query: string) {
  return searchPlaces(
    [],
    [],
    [],
    [],
    query,
    8,
    [],
    [],
    [],
    [],
    undefined,
    [],
    territories,
  )
}

describe('territory place search', () => {
  it('finds territories by Chinese, English, code and alias', () => {
    expect(search('格陵兰')[0]).toMatchObject({
      type: 'territory',
      territory: { id: 'greenland' },
    })
    expect(search('Puerto Rico')[0]).toMatchObject({
      type: 'territory',
      territory: { id: 'puerto-rico' },
    })
    expect(search('GF')[0]).toMatchObject({
      type: 'territory',
      territory: { id: 'french-guiana' },
    })
    expect(search('大溪地群岛')[0]).toMatchObject({
      type: 'territory',
      territory: { id: 'french-polynesia' },
    })
  })

  it('creates the territory explore deep link', () => {
    const territory = territories[0]
    expect(
      getExplorePathForPlaceSearchResult({ type: 'territory', territory }),
    ).toBe('/explore?territory=greenland')
  })
})
