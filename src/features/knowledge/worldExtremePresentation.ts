import type {
  WorldExtremeEntry,
  WorldExtremeMetric,
  WorldExtremeMetricId,
} from '../../data/worldExtremesSchema'

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
})

const unitLabels = {
  'square-kilometers': '平方千米',
  people: '人',
  meters: '米',
  kilometers: '千米',
} as const

const rankColors = ['#f2c75c', '#a9c6cf', '#d58a5a'] as const

const metricColors: Record<WorldExtremeMetricId, string> = {
  'largest-country-area': '#4cc9f0',
  'smallest-country-area': '#ff8a5b',
  'most-populous-country': '#8b8cff',
  'least-populous-country': '#f6c453',
  'highest-peak': '#4cc9f0',
  'longest-continental-mountain-range': '#ff8a5b',
  'largest-hot-desert': '#8b8cff',
  'longest-river': '#4cc9f0',
  'largest-freshwater-lake-area': '#ff8a5b',
  'deepest-lake': '#8b8cff',
  'largest-ocean-area': '#4cc9f0',
  'deepest-ocean-trench': '#ff8a5b',
}

export function getWorldExtremeMetricColor(metricId: WorldExtremeMetricId) {
  return metricColors[metricId]
}

export function getWorldExtremeRankColor(rank: number) {
  return rankColors[rank - 1] ?? rankColors[1]
}

export function formatWorldExtremeValue(
  metric: WorldExtremeMetric,
  entry: WorldExtremeEntry,
) {
  return `${entry.approximate ? '约 ' : ''}${numberFormatter.format(entry.value)} ${unitLabels[metric.unit]}`
}
