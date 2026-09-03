import {
  createWorldMapProjection,
  getWorldFeaturePath,
  projectWorldPosition,
} from '../../shared/maps/worldMapProjection'

const knowledgeWorldMap = createWorldMapProjection({
  width: 720,
  height: 340,
})

export const KNOWLEDGE_WORLD_MAP_WIDTH = knowledgeWorldMap.width
export const KNOWLEDGE_WORLD_MAP_HEIGHT = knowledgeWorldMap.height

export function getKnowledgeWorldMapPath(geometry: unknown) {
  return getWorldFeaturePath(knowledgeWorldMap.path, geometry)
}

export function projectKnowledgeWorldPosition(position: {
  latitude: number
  longitude: number
}) {
  return projectWorldPosition(knowledgeWorldMap.projection, position)
}
