import { describe, expect, it } from 'vitest'

import {
  exploreReducer,
  getSelectedCountryCode,
  initialExploreState,
} from './exploreState'

describe('exploreReducer', () => {
  it('keeps exactly one selected entity and derives a city country', () => {
    const countryState = exploreReducer(initialExploreState, {
      type: 'select',
      selection: { kind: 'country', countryCode: 'CN' },
    })
    const cityState = exploreReducer(countryState, {
      type: 'select',
      selection: {
        kind: 'city',
        cityId: 'cn-beijing',
        countryCode: 'CN',
      },
    })

    expect(cityState.selection).toEqual({
      kind: 'city',
      cityId: 'cn-beijing',
      countryCode: 'CN',
    })
    expect(getSelectedCountryCode(cityState.selection)).toBe('CN')
  })

  it('enables layers required by selected teaching entities', () => {
    const lakeState = exploreReducer(initialExploreState, {
      type: 'select',
      selection: { kind: 'waterbody', waterbodyId: 'lake-baikal' },
    })
    const desertState = exploreReducer(lakeState, {
      type: 'select',
      selection: { kind: 'desert', desertId: 'sahara' },
    })
    const geographyState = exploreReducer(desertState, {
      type: 'select',
      selection: {
        kind: 'geography',
        topicId: 'grid-reading',
        referenceLineId: null,
      },
    })

    expect(lakeState.layers.lake).toBe(true)
    expect(desertState.layers.desert).toBe(true)
    expect(geographyState.layers.geography).toBe(true)
  })

  it('clears hidden-layer hover without clearing the current selection', () => {
    const selected = exploreReducer(initialExploreState, {
      type: 'select',
      selection: { kind: 'country', countryCode: 'CN' },
    })
    const visible = exploreReducer(selected, {
      type: 'setLayer',
      layer: 'lake',
      visible: true,
    })
    const hovered = exploreReducer(visible, {
      type: 'hover',
      hover: { kind: 'waterbody', waterbodyId: 'lake-baikal' },
    })
    const hidden = exploreReducer(hovered, {
      type: 'setLayer',
      layer: 'lake',
      visible: false,
    })

    expect(hidden.hover).toBeNull()
    expect(hidden.selection).toEqual({ kind: 'country', countryCode: 'CN' })
  })

  it('returns from a city to its country and clears every selection', () => {
    const cityState = exploreReducer(initialExploreState, {
      type: 'select',
      selection: {
        kind: 'city',
        cityId: 'cn-beijing',
        countryCode: 'CN',
      },
    })
    const countryState = exploreReducer(cityState, { type: 'backToCountry' })
    const cleared = exploreReducer(countryState, { type: 'clearSelection' })

    expect(countryState.selection).toEqual({
      kind: 'country',
      countryCode: 'CN',
    })
    expect(cleared.selection).toBeNull()
    expect(cleared.hover).toBeNull()
  })
})
