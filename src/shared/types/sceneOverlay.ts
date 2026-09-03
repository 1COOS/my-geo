export const sceneOverlayRoles = {
  navigation: 'navigation',
  layers: 'layers',
  miniMap: 'mini-map',
  controls: 'controls',
  detail: 'detail',
} as const

export type SceneOverlayRole =
  (typeof sceneOverlayRoles)[keyof typeof sceneOverlayRoles]

export const measuredSceneOverlayRoles = [
  sceneOverlayRoles.navigation,
  sceneOverlayRoles.layers,
  sceneOverlayRoles.miniMap,
  sceneOverlayRoles.controls,
] as const satisfies readonly SceneOverlayRole[]
