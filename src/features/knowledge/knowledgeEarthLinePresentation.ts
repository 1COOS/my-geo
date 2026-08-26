import { getGeographyTopicReferenceLines } from '../../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLine,
} from '../../data/geographyLearningSchema'

export const knowledgeEarthLineColors = [
  '#62d9ff',
  '#f6c453',
  '#ff8a5b',
  '#8b8cff',
] as const

export const knowledgeEarthCoverageColors = [
  '#62d9ff',
  '#f6c453',
  '#ff8a5b',
  '#8b8cff',
  '#46d1a3',
] as const

type CoverageArea = {
  west: number
  east: number
  south: number
  north: number
  labelPosition?: { latitude: number; longitude: number }
}

export type KnowledgeEarthCoverageRegion = {
  id: string
  label: string
  color: (typeof knowledgeEarthCoverageColors)[number]
  areas: CoverageArea[]
}

const wholeLatitudeRange = { south: -90, north: 90 }

const knowledgeEarthCoverageByTopic: Record<
  GeographyTopicId,
  KnowledgeEarthCoverageRegion[]
> = {
  'grid-reading': [
    {
      id: 'western-longitudes',
      label: '西经区域',
      color: knowledgeEarthCoverageColors[0],
      areas: [
        {
          ...wholeLatitudeRange,
          west: -180,
          east: 0,
          labelPosition: { latitude: -38, longitude: -90 },
        },
      ],
    },
    {
      id: 'eastern-longitudes',
      label: '东经区域',
      color: knowledgeEarthCoverageColors[1],
      areas: [
        {
          ...wholeLatitudeRange,
          west: 0,
          east: 180,
          labelPosition: { latitude: -38, longitude: 90 },
        },
      ],
    },
  ],
  hemispheres: [
    {
      id: 'eastern-hemisphere',
      label: '东半球',
      color: knowledgeEarthCoverageColors[0],
      areas: [
        {
          ...wholeLatitudeRange,
          west: -20,
          east: 160,
          labelPosition: { latitude: 36, longitude: 70 },
        },
      ],
    },
    {
      id: 'western-hemisphere',
      label: '西半球',
      color: knowledgeEarthCoverageColors[1],
      areas: [
        {
          ...wholeLatitudeRange,
          west: -180,
          east: -20,
          labelPosition: { latitude: 36, longitude: -100 },
        },
        { ...wholeLatitudeRange, west: 160, east: 180 },
      ],
    },
  ],
  'latitude-zones': [
    {
      id: 'low-latitudes',
      label: '低纬度',
      color: knowledgeEarthCoverageColors[1],
      areas: [
        {
          west: -180,
          east: 180,
          south: -30,
          north: 30,
          labelPosition: { latitude: 0, longitude: -95 },
        },
      ],
    },
    {
      id: 'middle-latitudes',
      label: '中纬度',
      color: knowledgeEarthCoverageColors[0],
      areas: [
        {
          west: -180,
          east: 180,
          south: 30,
          north: 60,
          labelPosition: { latitude: 45, longitude: -95 },
        },
        {
          west: -180,
          east: 180,
          south: -60,
          north: -30,
          labelPosition: { latitude: -45, longitude: -95 },
        },
      ],
    },
    {
      id: 'high-latitudes',
      label: '高纬度',
      color: knowledgeEarthCoverageColors[3],
      areas: [
        {
          west: -180,
          east: 180,
          south: 60,
          north: 90,
          labelPosition: { latitude: 75, longitude: -95 },
        },
        {
          west: -180,
          east: 180,
          south: -90,
          north: -60,
          labelPosition: { latitude: -75, longitude: -95 },
        },
      ],
    },
  ],
  'earth-zones': [
    {
      id: 'north-frigid-zone',
      label: '北寒带',
      color: knowledgeEarthCoverageColors[3],
      areas: [
        {
          west: -180,
          east: 180,
          south: 66.5,
          north: 90,
          labelPosition: { latitude: 75, longitude: -95 },
        },
      ],
    },
    {
      id: 'north-temperate-zone',
      label: '北温带',
      color: knowledgeEarthCoverageColors[0],
      areas: [
        {
          west: -180,
          east: 180,
          south: 23.5,
          north: 66.5,
          labelPosition: { latitude: 45, longitude: -95 },
        },
      ],
    },
    {
      id: 'tropical-zone',
      label: '热带',
      color: knowledgeEarthCoverageColors[1],
      areas: [
        {
          west: -180,
          east: 180,
          south: -23.5,
          north: 23.5,
          labelPosition: { latitude: 0, longitude: -95 },
        },
      ],
    },
    {
      id: 'south-temperate-zone',
      label: '南温带',
      color: knowledgeEarthCoverageColors[2],
      areas: [
        {
          west: -180,
          east: 180,
          south: -66.5,
          north: -23.5,
          labelPosition: { latitude: -45, longitude: -95 },
        },
      ],
    },
    {
      id: 'south-frigid-zone',
      label: '南寒带',
      color: knowledgeEarthCoverageColors[4],
      areas: [
        {
          west: -180,
          east: 180,
          south: -90,
          north: -66.5,
          labelPosition: { latitude: -78, longitude: -95 },
        },
      ],
    },
  ],
}

export function getKnowledgeEarthLineColor(line: ReferenceLine) {
  const topicLines = getGeographyTopicReferenceLines(line.topicId)
  const lineIndex = topicLines.findIndex((item) => item.id === line.id)
  return knowledgeEarthLineColors[Math.max(0, lineIndex)]
}

export function getKnowledgeEarthTopicLineColors(topicId: GeographyTopicId) {
  return new Map(
    getGeographyTopicReferenceLines(topicId).map((line, index) => [
      line.id,
      knowledgeEarthLineColors[index],
    ]),
  )
}

export function getKnowledgeEarthCoverageRegions(topicId: GeographyTopicId) {
  return knowledgeEarthCoverageByTopic[topicId]
}
