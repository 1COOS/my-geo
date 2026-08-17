import { describe, expect, it } from 'vitest'

import {
  classifyGeoPosition,
  formatGeoCoordinate,
  normalizeLongitude,
} from './geoClassification'

describe('geographic position classification', () => {
  it.each([
    [
      { latitude: 0, longitude: 30 },
      {
        latitudeHemisphere: '赤道（南北半球分界线）',
        longitudeHemisphere: '东半球',
        latitudeZone: '低纬度',
        earthZone: '热带',
      },
    ],
    [
      { latitude: 23.5, longitude: -20 },
      {
        latitudeHemisphere: '北半球',
        longitudeHemisphere: '东西半球分界线上',
        latitudeZone: '低纬度',
        earthZone: '热带与温带分界线上',
      },
    ],
    [
      { latitude: -30, longitude: 160 },
      {
        latitudeHemisphere: '南半球',
        longitudeHemisphere: '东西半球分界线上',
        latitudeZone: '低纬度与中纬度分界线上',
        earthZone: '南温带',
      },
    ],
    [
      { latitude: 60, longitude: 180 },
      {
        latitudeHemisphere: '北半球',
        longitudeHemisphere: '西半球',
        latitudeZone: '中纬度与高纬度分界线上',
        earthZone: '北温带',
      },
    ],
    [
      { latitude: -66.5, longitude: -19.9 },
      {
        latitudeHemisphere: '南半球',
        longitudeHemisphere: '东半球',
        latitudeZone: '高纬度',
        earthZone: '温带与寒带分界线上',
      },
    ],
    [
      { latitude: 66.6, longitude: 160.1 },
      {
        latitudeHemisphere: '北半球',
        longitudeHemisphere: '西半球',
        latitudeZone: '高纬度',
        earthZone: '北寒带',
      },
    ],
  ])('classifies boundary and neighbouring positions', (position, expected) => {
    expect(classifyGeoPosition(position)).toMatchObject(expected)
  })

  it('normalizes longitude before formatting and hemisphere checks', () => {
    expect(normalizeLongitude(200)).toBe(-160)
    expect(normalizeLongitude(-200)).toBe(160)
    expect(formatGeoCoordinate({ latitude: 39.91, longitude: 116.36 })).toBe(
      '39.9°N · 116.4°E',
    )
    expect(formatGeoCoordinate({ latitude: 0, longitude: 180 })).toBe(
      '0.0° · 180.0°',
    )
  })
})
