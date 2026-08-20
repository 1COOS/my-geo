import { OrbitControls } from '@react-three/drei'
import type { RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { OVERVIEW_CAMERA_DISTANCE } from './countrySceneInteraction'

type GlobeCameraControlsProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>
  autoRotate: boolean
  onInteractionStart: () => void
  onInteractionChange: () => void
  onInteractionEnd: () => void
}

export function GlobeCameraControls({
  controlsRef,
  autoRotate,
  onInteractionStart,
  onInteractionChange,
  onInteractionEnd,
}: GlobeCameraControlsProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      keyEvents
      enableDamping
      dampingFactor={0.055}
      enablePan={false}
      minDistance={155}
      maxDistance={OVERVIEW_CAMERA_DISTANCE}
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI - 0.18}
      rotateSpeed={0.62}
      zoomSpeed={0.72}
      autoRotate={autoRotate}
      autoRotateSpeed={0.42}
      onStart={onInteractionStart}
      onChange={onInteractionChange}
      onEnd={onInteractionEnd}
    />
  )
}
