import type { GeoPosition } from '../types/geo'

export type GeoClassification = {
  formattedCoordinate: string
  latitudeHemisphere: '北半球' | '南半球' | '赤道（南北半球分界线）'
  longitudeHemisphere: '东半球' | '西半球' | '东西半球分界线上'
  latitudeZone:
    | '低纬度'
    | '中纬度'
    | '高纬度'
    | '低纬度与中纬度分界线上'
    | '中纬度与高纬度分界线上'
  earthZone:
    | '热带'
    | '北温带'
    | '南温带'
    | '北寒带'
    | '南寒带'
    | '热带与温带分界线上'
    | '温带与寒带分界线上'
}

const DISPLAY_PRECISION = 10

function roundForDisplay(value: number) {
  return Math.round(value * DISPLAY_PRECISION) / DISPLAY_PRECISION
}

export function normalizeLongitude(longitude: number) {
  const normalized = ((((longitude + 180) % 360) + 360) % 360) - 180
  return Object.is(normalized, -0) ? 0 : normalized
}

export function formatGeoCoordinate(position: GeoPosition) {
  const latitude = roundForDisplay(position.latitude)
  const longitude = roundForDisplay(normalizeLongitude(position.longitude))
  const latitudeLabel =
    latitude === 0
      ? '0.0°'
      : `${Math.abs(latitude).toFixed(1)}°${latitude > 0 ? 'N' : 'S'}`
  const longitudeLabel =
    longitude === 0
      ? '0.0°'
      : Math.abs(longitude) === 180
        ? '180.0°'
        : `${Math.abs(longitude).toFixed(1)}°${longitude > 0 ? 'E' : 'W'}`
  return `${latitudeLabel} · ${longitudeLabel}`
}

export function classifyGeoPosition(position: GeoPosition): GeoClassification {
  const latitude = roundForDisplay(position.latitude)
  const longitude = roundForDisplay(normalizeLongitude(position.longitude))
  const absoluteLatitude = Math.abs(latitude)

  const latitudeHemisphere =
    latitude === 0
      ? '赤道（南北半球分界线）'
      : latitude > 0
        ? '北半球'
        : '南半球'

  const longitudeHemisphere =
    longitude === -20 || longitude === 160
      ? '东西半球分界线上'
      : longitude > -20 && longitude < 160
        ? '东半球'
        : '西半球'

  const latitudeZone =
    absoluteLatitude === 30
      ? '低纬度与中纬度分界线上'
      : absoluteLatitude === 60
        ? '中纬度与高纬度分界线上'
        : absoluteLatitude < 30
          ? '低纬度'
          : absoluteLatitude < 60
            ? '中纬度'
            : '高纬度'

  const earthZone =
    absoluteLatitude === 23.5
      ? '热带与温带分界线上'
      : absoluteLatitude === 66.5
        ? '温带与寒带分界线上'
        : absoluteLatitude < 23.5
          ? '热带'
          : absoluteLatitude < 66.5
            ? latitude > 0
              ? '北温带'
              : '南温带'
            : latitude > 0
              ? '北寒带'
              : '南寒带'

  return {
    formattedCoordinate: formatGeoCoordinate(position),
    latitudeHemisphere,
    longitudeHemisphere,
    latitudeZone,
    earthZone,
  }
}
