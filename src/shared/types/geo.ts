export type GeoPosition = {
  latitude: number
  longitude: number
}

export type CameraTarget = {
  requestId: number
  position: GeoPosition
}

export type WorldMiniMapNavigation =
  | {
      kind: 'country'
      countryCode: string
    }
  | {
      kind: 'coordinate'
      position: GeoPosition
    }
