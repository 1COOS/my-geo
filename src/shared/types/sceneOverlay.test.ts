import { describe, expect, it } from 'vitest'

import { measuredSceneOverlayRoles, sceneOverlayRoles } from './sceneOverlay'

describe('scene overlay roles', () => {
  it('keeps the complete typed role contract', () => {
    expect(Object.values(sceneOverlayRoles)).toEqual([
      'navigation',
      'layers',
      'mini-map',
      'controls',
      'detail',
    ])
  })

  it('reserves only navigation and interactive explore overlays', () => {
    expect(measuredSceneOverlayRoles).toEqual([
      'navigation',
      'layers',
      'mini-map',
      'controls',
    ])
    expect(measuredSceneOverlayRoles).not.toContain(sceneOverlayRoles.detail)
  })
})
