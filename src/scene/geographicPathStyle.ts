export type GeographicPathKind = 'river' | 'canal' | 'mountain' | 'trench'

export type GeographicPathStyleInput = {
  kind?: string
  selected?: boolean
  hovered?: boolean
}

export type GeographicPathAppearance = {
  altitude: number
  color: string
  stroke: number
  dashLength: number
  dashGap: number
}

export type GeographicPathPoint = readonly [
  latitude: number,
  longitude: number,
  altitude: number,
]

function getKind(kind: string | undefined): GeographicPathKind {
  if (kind === 'river' || kind === 'canal' || kind === 'mountain') return kind
  return 'trench'
}

export function getGeographicPathAppearance(
  input: GeographicPathStyleInput,
  quality: 'balanced' | 'low',
): GeographicPathAppearance {
  const kind = getKind(input.kind)
  const selected = input.selected === true
  const hovered = !selected && input.hovered === true
  const balanced = quality === 'balanced'

  const altitude = selected
    ? kind === 'mountain'
      ? 0.07
      : 0.065
    : kind === 'mountain'
      ? 0.058
      : kind === 'river'
        ? 0.054
        : kind === 'canal'
          ? 0.05
          : 0.04

  const stroke = selected
    ? balanced
      ? 1.5
      : 1.08
    : hovered
      ? balanced
        ? 1.25
        : 0.9
      : kind === 'mountain'
        ? balanced
          ? 0.95
          : 0.68
        : kind === 'river'
          ? balanced
            ? 1
            : 0.72
          : kind === 'canal'
            ? balanced
              ? 0.65
              : 0.48
            : balanced
              ? 0.14
              : 0.09

  const color = selected
    ? kind === 'canal'
      ? '#ffd66b'
      : '#ffffff'
    : hovered
      ? kind === 'mountain'
        ? '#fff0c7'
        : kind === 'canal'
          ? '#fff0b3'
          : kind === 'river'
            ? '#d7fcff'
            : '#dbc8ff'
      : kind === 'mountain'
        ? '#ff9f32'
        : kind === 'canal'
          ? '#ffc62f'
          : kind === 'river'
            ? '#00f0ff'
            : '#c493ff'

  return {
    altitude,
    color,
    stroke,
    dashLength: kind === 'canal' ? 0.1 : 1,
    dashGap: kind === 'canal' ? 0.06 : 0,
  }
}

export function addGeographicPathAltitude(
  points: readonly (readonly [number, number])[],
  altitude: number,
): GeographicPathPoint[] {
  return points.map(([latitude, longitude]) => [latitude, longitude, altitude])
}

function getGeographicPathPoint(value: object): GeographicPathPoint {
  return value as unknown as GeographicPathPoint
}

export function getGeographicPathPointLatitude(value: object): number {
  return getGeographicPathPoint(value)[0]
}

export function getGeographicPathPointLongitude(value: object): number {
  return getGeographicPathPoint(value)[1]
}

export function getGeographicPathPointAltitude(value: object): number {
  return getGeographicPathPoint(value)[2]
}
