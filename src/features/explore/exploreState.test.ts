import { describe, expect, it } from 'vitest'

import {
  exploreReducer,
  getSelectedCountryCode,
  initialExploreState,
} from './exploreState'

describe('exploreReducer', () => {
  it('keeps exactly one selected entity', () => {
    const countryState = exploreReducer(initialExploreState, {
      type: 'select',
      selection: { kind: 'country', countryCode: 'CN' },
    })
    const lakeState = exploreReducer(countryState, {
      type: 'select',
      selection: { kind: 'waterbody', waterbodyId: 'lake-baikal' },
    })

    expect(lakeState.selection).toEqual({
      kind: 'waterbody',
      waterbodyId: 'lake-baikal',
    })
    expect(getSelectedCountryCode(countryState.selection)).toBe('CN')
    expect(getSelectedCountryCode(lakeState.selection)).toBeNull()
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
    const mountainState = exploreReducer(initialExploreState, {
      type: 'select',
      selection: { kind: 'mountainRange', rangeId: 'himalayas' },
    })

    expect(lakeState.layers.lake).toBe(true)
    expect(oceanState.layers.ocean).toBe(true)
    expect(riverState.layers.riverAndCanal).toBe(true)
    expect(mountainState.layers.mountain).toBe(true)
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
})
