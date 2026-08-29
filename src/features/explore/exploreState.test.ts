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
        value: { kind: 'overview', focusTopicId: null },
      },
    })
    const oceanState = exploreReducer(initialExploreState, {
      type: 'select',
      selection: { kind: 'waterbody', waterbodyId: 'pacific-ocean' },
    })
    const riverState = exploreReducer(initialExploreState, {
      type: 'select',
      selection: { kind: 'linearFeature', featureId: 'amazon-system' },
    })

    expect(lakeState.layers.lake).toBe(true)
    expect(oceanState.layers.ocean).toBe(true)
    expect(riverState.layers.riverAndCanal).toBe(true)
    expect(desertState.layers.desert).toBe(true)
    expect(geographyState.layers.geography).toBe(true)
  })

  it('moves between geography overview and line cards without coupling card and layer visibility', () => {
    const overview = exploreReducer(initialExploreState, {
      type: 'select',
      selection: {
        kind: 'geography',
        value: { kind: 'overview', focusTopicId: 'earth-zones' },
      },
    })
    const line = exploreReducer(overview, {
      type: 'select',
      selection: {
        kind: 'geography',
        value: {
          kind: 'line',
          topicId: 'earth-zones',
          referenceLineId: 'tropic-of-cancer',
        },
      },
    })
    const hidden = exploreReducer(line, {
      type: 'setLayer',
      layer: 'geography',
      visible: false,
    })
    const closed = exploreReducer(hidden, { type: 'clearSelection' })

    expect(overview.selection).toEqual({
      kind: 'geography',
      value: { kind: 'overview', focusTopicId: 'earth-zones' },
    })
    expect(line.selection).toEqual({
      kind: 'geography',
      value: {
        kind: 'line',
        topicId: 'earth-zones',
        referenceLineId: 'tropic-of-cancer',
      },
    })
    expect(hidden.layers.geography).toBe(false)
    expect(hidden.selection).toEqual(line.selection)
    expect(closed.selection).toBeNull()
    expect(closed.layers.geography).toBe(false)
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
