import type {
  ClimateKnowledgeSelection,
  ClimateTypeId,
} from '../../data/climateLearningSchema'
import { getCity } from '../../data/countries'
import type { GeographyExploreSelection } from '../../data/geographyLearning'
import { getWaterbody } from '../../data/waterbodies'

export type LayerVisibility = {
  capitals: boolean
  cities: boolean
  ocean: boolean
  lake: boolean
  waterway: boolean
  riverAndCanal: boolean
  mountain: boolean
  desert: boolean
  landmark: boolean
  geography: boolean
  climate: boolean
}

export type ExploreSelection =
  | { kind: 'country'; countryCode: string }
  | { kind: 'city'; cityId: string; countryCode: string }
  | { kind: 'waterbody'; waterbodyId: string }
  | { kind: 'linearFeature'; featureId: string }
  | { kind: 'mountainRange'; rangeId: string }
  | { kind: 'desert'; desertId: string }
  | { kind: 'landmark'; landmarkId: string }
  | { kind: 'geography'; value: GeographyExploreSelection }
  | { kind: 'climate'; value: ClimateKnowledgeSelection }
  | null

export type ExploreHover =
  | { kind: 'country'; countryCode: string }
  | { kind: 'city'; cityId: string }
  | { kind: 'waterbody'; waterbodyId: string }
  | { kind: 'linearFeature'; featureId: string }
  | { kind: 'mountainRange'; rangeId: string }
  | { kind: 'desert'; desertId: string }
  | { kind: 'landmark'; landmarkId: string }
  | null

export type ExploreState = {
  layers: LayerVisibility
  selection: ExploreSelection
  hover: ExploreHover
}

export type LayerId = keyof LayerVisibility

export type ExploreAction =
  | { type: 'toggleLayer'; layer: LayerId }
  | { type: 'setLayer'; layer: LayerId; visible: boolean }
  | { type: 'select'; selection: ExploreSelection }
  | { type: 'hover'; hover: ExploreHover }
  | { type: 'clearSelection' }
  | { type: 'clearHover' }
  | { type: 'backToCountry' }
  | { type: 'selectClimateType'; climateTypeId: ClimateTypeId }
  | { type: 'showClimateOverview' }

export const initialLayerVisibility: LayerVisibility = {
  capitals: false,
  cities: false,
  ocean: false,
  lake: false,
  waterway: false,
  riverAndCanal: false,
  mountain: false,
  desert: false,
  landmark: false,
  geography: false,
  climate: false,
}

export const initialExploreState: ExploreState = {
  layers: initialLayerVisibility,
  selection: null,
  hover: null,
}

function selectionMatchesHover(
  selection: ExploreSelection,
  hover: ExploreHover,
) {
  if (!selection || !hover || selection.kind !== hover.kind) return false
  if (selection.kind === 'country' && hover.kind === 'country') {
    return selection.countryCode === hover.countryCode
  }
  if (selection.kind === 'city' && hover.kind === 'city') {
    return selection.cityId === hover.cityId
  }
  if (selection.kind === 'waterbody' && hover.kind === 'waterbody') {
    return selection.waterbodyId === hover.waterbodyId
  }
  if (selection.kind === 'linearFeature' && hover.kind === 'linearFeature') {
    return selection.featureId === hover.featureId
  }
  if (selection.kind === 'mountainRange' && hover.kind === 'mountainRange') {
    return selection.rangeId === hover.rangeId
  }
  if (selection.kind === 'desert' && hover.kind === 'desert') {
    return selection.desertId === hover.desertId
  }
  if (selection.kind === 'landmark' && hover.kind === 'landmark') {
    return selection.landmarkId === hover.landmarkId
  }
  return false
}

function shouldClearHoverForHiddenLayer(layer: LayerId, hover: ExploreHover) {
  if (!hover) return false
  if (layer === 'capitals' || layer === 'cities') {
    if (hover.kind !== 'city') return false
    const city = getCity(hover.cityId)
    return layer === 'capitals' ? city?.isCapital === true : !city?.isCapital
  }
  if (layer === 'ocean' || layer === 'lake' || layer === 'waterway') {
    if (hover.kind !== 'waterbody') return false
    return getWaterbody(hover.waterbodyId)?.layer === layer
  }
  if (layer === 'riverAndCanal') return hover.kind === 'linearFeature'
  if (layer === 'mountain') return hover.kind === 'mountainRange'
  if (layer === 'desert') return hover.kind === 'desert'
  if (layer === 'landmark') return hover.kind === 'landmark'
  return false
}

function layersForSelection(
  layers: LayerVisibility,
  selection: ExploreSelection,
) {
  if (!selection) return layers
  if (selection.kind === 'waterbody') {
    const waterbody = getWaterbody(selection.waterbodyId)
    return waterbody ? { ...layers, [waterbody.layer]: true } : layers
  }
  if (selection.kind === 'linearFeature') {
    return { ...layers, riverAndCanal: true }
  }
  if (selection.kind === 'desert') return { ...layers, desert: true }
  if (selection.kind === 'landmark') return { ...layers, landmark: true }
  if (selection.kind === 'geography') return { ...layers, geography: true }
  if (selection.kind === 'climate') return { ...layers, climate: true }
  return layers
}

export function exploreReducer(
  state: ExploreState,
  action: ExploreAction,
): ExploreState {
  if (action.type === 'toggleLayer' || action.type === 'setLayer') {
    const visible =
      action.type === 'toggleLayer'
        ? !state.layers[action.layer]
        : action.visible
    const layers = { ...state.layers, [action.layer]: visible }
    const clearHover =
      !visible &&
      shouldClearHoverForHiddenLayer(action.layer, state.hover) &&
      !selectionMatchesHover(state.selection, state.hover)
    return { ...state, layers, hover: clearHover ? null : state.hover }
  }
  if (action.type === 'select') {
    return {
      ...state,
      layers: layersForSelection(state.layers, action.selection),
      selection: action.selection,
      hover: null,
    }
  }
  if (action.type === 'hover') return { ...state, hover: action.hover }
  if (action.type === 'clearHover') return { ...state, hover: null }
  if (action.type === 'clearSelection') {
    return { ...state, selection: null, hover: null }
  }
  if (action.type === 'backToCountry') {
    if (state.selection?.kind !== 'city') return state
    return {
      ...state,
      selection: {
        kind: 'country',
        countryCode: state.selection.countryCode,
      },
      hover: null,
    }
  }
  if (action.type === 'selectClimateType') {
    const current =
      state.selection?.kind === 'climate' ? state.selection.value : null
    return {
      ...state,
      layers: { ...state.layers, climate: true },
      selection: {
        kind: 'climate',
        value: {
          kind: 'type',
          climateTypeId: action.climateTypeId,
          classification:
            current?.classification?.climateTypeId === action.climateTypeId
              ? current.classification
              : undefined,
        },
      },
      hover: null,
    }
  }
  return {
    ...state,
    layers: { ...state.layers, climate: true },
    selection: { kind: 'climate', value: { kind: 'overview' } },
    hover: null,
  }
}

export function getSelectedCountryCode(selection: ExploreSelection) {
  if (selection?.kind === 'country' || selection?.kind === 'city') {
    return selection.countryCode
  }
  return null
}

export function getSelectedEntityId<
  K extends NonNullable<ExploreSelection>['kind'],
>(selection: ExploreSelection, kind: K) {
  return selection?.kind === kind ? selection : null
}
