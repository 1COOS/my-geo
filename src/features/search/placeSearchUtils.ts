import type { Country } from '../../data/countrySchema'
import type { ClimateType } from '../../data/climateLearningSchema'
import type { Desert } from '../../data/desertSchema'
import type {
  GeographyTopic,
  ReferenceLine,
} from '../../data/geographyLearningSchema'
import type { LinearGeoFeature } from '../../data/linearGeoFeatureSchema'
import type { Landmark } from '../../data/landmarkSchema'
import type { MountainRange } from '../../data/mountainRangeSchema'
import type { Waterbody } from '../../data/waterbodySchema'

export type PlaceSearchResult =
  | { type: 'country'; country: Country }
  | { type: 'waterbody'; waterbody: Waterbody }
  | { type: 'linearFeature'; feature: LinearGeoFeature }
  | { type: 'mountainRange'; range: MountainRange }
  | { type: 'desert'; desert: Desert }
  | { type: 'landmark'; landmark: Landmark }
  | {
      type: 'geographyTopic'
      topic: GeographyTopic
      referenceLine?: ReferenceLine
    }
  | {
      type: 'climateTopic'
      topic: {
        id: 'world-climate-types'
        name: { zh: string; en: string }
        aliases: string[]
      }
    }
  | { type: 'climateType'; climateType: ClimateType }

export function normalizePlaceSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

function matchScore(values: string[], query: string) {
  const normalizedValues = values.map(normalizePlaceSearch)
  if (normalizedValues.some((value) => value === query)) return 0
  if (normalizedValues.some((value) => value.startsWith(query))) return 1
  if (normalizedValues.some((value) => value.includes(query))) return 2
  return 10
}

export function searchPlaces(
  countries: Country[],
  waterbodies: Waterbody[],
  linearFeatures: LinearGeoFeature[],
  mountainRanges: MountainRange[],
  query: string,
  limit = 8,
  deserts: Desert[] = [],
  landmarks: Landmark[] = [],
  geographyTopics: GeographyTopic[] = [],
  referenceLines: ReferenceLine[] = [],
  climateTopic?: {
    id: 'world-climate-types'
    name: { zh: string; en: string }
    aliases: string[]
  },
  climateTypes: ClimateType[] = [],
): PlaceSearchResult[] {
  const normalizedQuery = normalizePlaceSearch(query)
  if (!normalizedQuery) {
    return countries
      .filter((country) => country.featured)
      .slice(0, limit)
      .map((country) => ({ type: 'country', country }))
  }

  const countriesByCode = new Map(
    countries.map((country) => [country.code, country]),
  )
  const scored: { result: PlaceSearchResult; score: number; name: string }[] =
    []

  for (const country of countries) {
    const score = matchScore(
      [country.code, country.alpha3Code, country.name.zh, country.name.en],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'country', country },
        score,
        name: country.name.zh,
      })
    }
  }

  for (const waterbody of waterbodies) {
    const score = matchScore(
      [waterbody.name.zh, waterbody.name.en, ...waterbody.aliases],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'waterbody', waterbody },
        score: score + 0.1,
        name: waterbody.name.zh,
      })
    }
  }

  for (const feature of linearFeatures) {
    const countryNames = feature.countryCodes.flatMap((countryCode) => {
      const country = countriesByCode.get(countryCode)
      return country ? [country.code, country.name.zh, country.name.en] : []
    })
    const score = matchScore(
      [feature.name.zh, feature.name.en, ...feature.aliases, ...countryNames],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'linearFeature', feature },
        score: score + 0.15,
        name: feature.name.zh,
      })
    }
  }

  for (const range of mountainRanges) {
    const countryNames = range.countryCodes.flatMap((countryCode) => {
      const country = countriesByCode.get(countryCode)
      return country ? [country.code, country.name.zh, country.name.en] : []
    })
    const score = matchScore(
      [
        range.name.zh,
        range.name.en,
        ...range.aliases,
        range.highestPeak.name.zh,
        range.highestPeak.name.en,
        ...range.highestPeak.aliases,
        ...countryNames,
      ],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'mountainRange', range },
        score: score + 0.18,
        name: range.name.zh,
      })
    }
  }

  for (const desert of deserts) {
    const countryNames = desert.countryCodes.flatMap((countryCode) => {
      const country = countriesByCode.get(countryCode)
      return country ? [country.code, country.name.zh, country.name.en] : []
    })
    const score = matchScore(
      [
        desert.name.zh,
        desert.name.en,
        ...desert.aliases,
        desert.region,
        ...desert.landscape,
        ...countryNames,
      ],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'desert', desert },
        score: score + 0.16,
        name: desert.name.zh,
      })
    }
  }

  for (const landmark of landmarks) {
    const country = countriesByCode.get(landmark.countryCode)
    const score = matchScore(
      [
        landmark.name.zh,
        landmark.name.en,
        ...landmark.aliases,
        landmark.location.zh,
        landmark.location.en,
        country?.code ?? '',
        country?.name.zh ?? '',
        country?.name.en ?? '',
      ],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'landmark', landmark },
        score: score + 0.17,
        name: landmark.name.zh,
      })
    }
  }

  for (const topic of geographyTopics) {
    const score = matchScore(
      [topic.name.zh, topic.name.en, ...topic.aliases],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'geographyTopic', topic },
        score: score + 0.05,
        name: topic.name.zh,
      })
    }
  }

  for (const referenceLine of referenceLines) {
    const score = matchScore(
      [
        referenceLine.name.zh,
        referenceLine.name.en,
        referenceLine.shortLabel,
        ...referenceLine.aliases,
      ],
      normalizedQuery,
    )
    if (score < 10) {
      const topic = geographyTopics.find(
        (candidate) => candidate.id === referenceLine.topicId,
      )
      if (topic) {
        scored.push({
          result: { type: 'geographyTopic', topic, referenceLine },
          score,
          name: referenceLine.name.zh,
        })
      }
    }
  }

  if (climateTopic) {
    const score = matchScore(
      [climateTopic.name.zh, climateTopic.name.en, ...climateTopic.aliases],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'climateTopic', topic: climateTopic },
        score: score + 0.04,
        name: climateTopic.name.zh,
      })
    }
  }

  for (const climateType of climateTypes) {
    const score = matchScore(
      [climateType.name.zh, climateType.name.en, ...climateType.aliases],
      normalizedQuery,
    )
    if (score < 10) {
      scored.push({
        result: { type: 'climateType', climateType },
        score: score + 0.03,
        name: climateType.name.zh,
      })
    }
  }

  return scored
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.name.localeCompare(right.name, 'zh-CN'),
    )
    .slice(0, limit)
    .map(({ result }) => result)
}

export function searchCountries(
  countries: Country[],
  query: string,
  limit = 8,
) {
  return searchPlaces(countries, [], [], [], query, limit).flatMap((result) =>
    result.type === 'country' ? [result.country] : [],
  )
}

export function getExplorePathForPlaceSearchResult(result: PlaceSearchResult) {
  const searchParams = new URLSearchParams()
  if (result.type === 'country') {
    searchParams.set('country', result.country.code)
  } else if (result.type === 'waterbody') {
    searchParams.set('waterbody', result.waterbody.id)
  } else if (result.type === 'linearFeature') {
    searchParams.set('linearFeature', result.feature.id)
  } else if (result.type === 'mountainRange') {
    searchParams.set('mountainRange', result.range.id)
  } else if (result.type === 'desert') {
    searchParams.set('desert', result.desert.id)
  } else if (result.type === 'landmark') {
    searchParams.set('landmark', result.landmark.id)
  } else if (result.type === 'geographyTopic') {
    searchParams.set('geography', result.topic.id)
    if (result.referenceLine) searchParams.set('line', result.referenceLine.id)
  } else if (result.type === 'climateType') {
    searchParams.set('climate', result.climateType.id)
  } else {
    searchParams.set('climate', result.topic.id)
  }
  return `/explore?${searchParams.toString()}`
}
