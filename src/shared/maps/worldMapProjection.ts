import { geoEquirectangular, geoPath, type GeoProjection } from 'd3-geo'

export type WorldMapProjectionSpec = {
  width: number
  height: number
  precision?: number
}

export type WorldMapProjection = {
  width: number
  height: number
  projection: GeoProjection
  path: ReturnType<typeof geoPath>
}

export function createWorldMapProjection({
  width,
  height,
  precision,
}: WorldMapProjectionSpec): WorldMapProjection {
  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2])
    .clipExtent([
      [0, 0],
      [width, height],
    ])

  if (precision !== undefined) projection.precision(precision)

  return { width, height, projection, path: geoPath(projection) }
}

export function projectWorldPosition(
  projection: GeoProjection,
  position: { latitude: number; longitude: number },
) {
  return projection([position.longitude, position.latitude])
}

export function getWorldFeaturePath(
  path: ReturnType<typeof geoPath>,
  geometry: unknown,
) {
  return path(geometry as never) ?? ''
}
