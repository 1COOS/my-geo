import { geoEquirectangular, geoPath } from 'd3-geo'

export const KNOWLEDGE_WORLD_MAP_WIDTH = 720
export const KNOWLEDGE_WORLD_MAP_HEIGHT = 340

const knowledgeWorldMapProjection = geoEquirectangular()
  .scale(KNOWLEDGE_WORLD_MAP_WIDTH / (2 * Math.PI))
  .translate([KNOWLEDGE_WORLD_MAP_WIDTH / 2, KNOWLEDGE_WORLD_MAP_HEIGHT / 2])
  .clipExtent([
    [0, 0],
    [KNOWLEDGE_WORLD_MAP_WIDTH, KNOWLEDGE_WORLD_MAP_HEIGHT],
  ])

const knowledgeWorldMapPath = geoPath(knowledgeWorldMapProjection)

export function getKnowledgeWorldMapPath(geometry: unknown) {
  return knowledgeWorldMapPath(geometry as never) ?? ''
}

export function projectKnowledgeWorldPosition(position: {
  latitude: number
  longitude: number
}) {
  return knowledgeWorldMapProjection([position.longitude, position.latitude])
}
