import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import R3fGlobe, { type GlobeMethods } from 'r3f-globe'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Color, MeshStandardMaterial, Vector2 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type GlobeSceneProps = {
  autoRotate: boolean
  quality: 'balanced' | 'low'
  resetToken: number
}

const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 18, 285]

function World({ autoRotate, quality, resetToken }: GlobeSceneProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl, size } = useThree()
  const rendererSize = useMemo(
    () => new Vector2(size.width, size.height),
    [size.height, size.width],
  )
  const globeMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color('#1685cc'),
        emissive: new Color('#073454'),
        emissiveIntensity: 0.32,
        roughness: 0.74,
        metalness: 0.04,
      }),
    [],
  )

  const syncPointOfView = useCallback(() => {
    globeRef.current?.setPointOfView(camera)
  }, [camera])

  useEffect(() => {
    camera.position.set(...INITIAL_CAMERA_POSITION)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    controlsRef.current?.target.set(0, 0, 0)
    controlsRef.current?.update()
    syncPointOfView()
  }, [camera, resetToken, syncPointOfView])

  useEffect(() => {
    gl.setPixelRatio(
      Math.min(window.devicePixelRatio, quality === 'balanced' ? 1.75 : 1.2),
    )
  }, [gl, quality])

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial])

  return (
    <>
      <color attach="background" args={['#030812']} />
      <fog attach="fog" args={['#030812', 360, 760]} />

      <ambientLight intensity={0.82} color="#9edcff" />
      <hemisphereLight intensity={1.45} color="#d8f6ff" groundColor="#061729" />
      <directionalLight
        position={[-120, 90, 160]}
        intensity={3.4}
        color="#fff6d7"
      />
      <pointLight
        position={[170, -70, -120]}
        intensity={45}
        distance={520}
        color="#2187ff"
      />

      <Stars
        radius={quality === 'balanced' ? 330 : 290}
        depth={130}
        count={quality === 'balanced' ? 2800 : 1200}
        factor={3.2}
        saturation={0.28}
        fade
        speed={0.18}
      />

      <R3fGlobe
        ref={globeRef}
        rendererSize={rendererSize}
        globeMaterial={globeMaterial}
        showGlobe
        showGraticules
        showAtmosphere
        atmosphereColor="#70dfff"
        atmosphereAltitude={0.18}
        globeCurvatureResolution={quality === 'balanced' ? 3 : 5}
        onGlobeReady={syncPointOfView}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        keyEvents
        enableDamping
        dampingFactor={0.055}
        enablePan={false}
        minDistance={155}
        maxDistance={425}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI - 0.18}
        rotateSpeed={0.62}
        zoomSpeed={0.72}
        autoRotate={autoRotate}
        autoRotateSpeed={0.42}
        onChange={syncPointOfView}
      />

      {quality === 'balanced' ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            mipmapBlur
            intensity={0.42}
            luminanceThreshold={0.7}
            luminanceSmoothing={0.28}
          />
        </EffectComposer>
      ) : null}
    </>
  )
}

export function GlobeScene(props: GlobeSceneProps) {
  return (
    <div
      className="globe-canvas"
      data-testid="globe-scene"
      role="application"
      aria-label="交互式 3D 地球。拖动旋转，滚轮缩放，方向键移动视角。"
    >
      <Canvas
        camera={{
          fov: 42,
          near: 0.5,
          far: 1200,
          position: INITIAL_CAMERA_POSITION,
        }}
        dpr={props.quality === 'balanced' ? [1, 1.75] : [1, 1.2]}
        gl={{
          antialias: props.quality === 'balanced',
          alpha: false,
          powerPreference: 'high-performance',
        }}
        fallback={null}
      >
        <World {...props} />
      </Canvas>
    </div>
  )
}
