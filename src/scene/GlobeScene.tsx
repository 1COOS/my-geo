import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import R3fGlobe, { type GlobeMethods } from 'r3f-globe'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Color, MeshStandardMaterial, Vector2, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { countries, countryBoundaries, getCountry } from '../data/countries'
import type { CameraTarget, GeoPosition } from '../shared/types/geo'
import {
  getBoundaryCode,
  getCameraFlightDuration,
  getCapitalMarkerCode,
  getCountryCodeForLayer,
  type CapitalMarker,
} from './countrySceneInteraction'

type GlobeSceneProps = {
  autoRotate: boolean
  cameraTarget: CameraTarget
  quality: 'balanced' | 'low'
  reducedMotion: boolean
  selectedCountryCode: string | null
  hoveredCountryCode: string | null
  onSelectCountry: (countryCode: string) => void
  onHoverCountry: (countryCode: string | null) => void
  onViewCenterChange: (position: GeoPosition) => void
  onViewCenterCommit: (position: GeoPosition) => void
}

const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 18, 285]

type CameraFlight = {
  from: Vector3
  to: Vector3
  elapsed: number
  duration: number
}

function World({
  autoRotate,
  cameraTarget,
  quality,
  reducedMotion,
  selectedCountryCode,
  hoveredCountryCode,
  onSelectCountry,
  onHoverCountry,
  onViewCenterChange,
  onViewCenterCommit,
}: GlobeSceneProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const globeReadyRef = useRef(false)
  const cameraTargetRef = useRef(cameraTarget)
  const cameraFlightRef = useRef<CameraFlight | null>(null)
  const viewCenterFrameRef = useRef<number | null>(null)
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
  const capitalMarkers = useMemo<CapitalMarker[]>(
    () =>
      countries.flatMap((country) =>
        country.hasGeometry
          ? []
          : country.capitals.slice(0, 1).map((capital) => ({
              countryCode: country.code,
              lat: capital.latitude,
              lng: capital.longitude,
              name: capital.name.zh,
            })),
      ),
    [],
  )

  const syncPointOfView = useCallback(() => {
    globeRef.current?.setPointOfView(camera)
  }, [camera])

  const getViewCenter = useCallback((): GeoPosition | null => {
    const coordinate = globeRef.current?.toGeoCoords(camera.position)
    if (!coordinate) return null
    return {
      latitude: coordinate.lat,
      longitude: coordinate.lng,
    }
  }, [camera])

  const scheduleViewCenterChange = useCallback(() => {
    if (viewCenterFrameRef.current !== null) return
    viewCenterFrameRef.current = window.requestAnimationFrame(() => {
      viewCenterFrameRef.current = null
      const position = getViewCenter()
      if (position) onViewCenterChange(position)
    })
  }, [getViewCenter, onViewCenterChange])

  const commitViewCenter = useCallback(() => {
    const position = getViewCenter()
    if (!position) return
    onViewCenterChange(position)
    onViewCenterCommit(position)
  }, [getViewCenter, onViewCenterChange, onViewCenterCommit])

  const flyToPosition = useCallback(
    (position: GeoPosition) => {
      if (!globeReadyRef.current || !globeRef.current) return
      const destination = globeRef.current.getCoords(
        position.latitude,
        position.longitude,
        1.42,
      )
      const targetPosition = new Vector3(
        destination.x,
        destination.y,
        destination.z,
      )

      const flightDuration = getCameraFlightDuration(reducedMotion)
      if (flightDuration === 0) {
        camera.position.copy(targetPosition)
        camera.lookAt(0, 0, 0)
        controlsRef.current?.target.set(0, 0, 0)
        controlsRef.current?.update()
        syncPointOfView()
        commitViewCenter()
        return
      }

      cameraFlightRef.current = {
        from: camera.position.clone(),
        to: targetPosition,
        elapsed: 0,
        duration: flightDuration,
      }
      if (controlsRef.current) controlsRef.current.enabled = false
    },
    [camera, commitViewCenter, reducedMotion, syncPointOfView],
  )

  useFrame((_state, delta) => {
    const flight = cameraFlightRef.current
    if (!flight) return

    flight.elapsed = Math.min(flight.elapsed + delta, flight.duration)
    const progress = flight.elapsed / flight.duration
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    camera.position.lerpVectors(flight.from, flight.to, easedProgress)
    camera.lookAt(0, 0, 0)
    controlsRef.current?.target.set(0, 0, 0)
    syncPointOfView()
    scheduleViewCenterChange()

    if (progress >= 1) {
      cameraFlightRef.current = null
      if (controlsRef.current) {
        controlsRef.current.enabled = true
        controlsRef.current.update()
      }
      commitViewCenter()
    }
  })

  useEffect(() => {
    cameraTargetRef.current = cameraTarget
    cameraFlightRef.current = null
    if (controlsRef.current) controlsRef.current.enabled = true
    flyToPosition(cameraTarget.position)
  }, [cameraTarget, flyToPosition])

  useEffect(() => {
    gl.setPixelRatio(
      Math.min(window.devicePixelRatio, quality === 'balanced' ? 1.75 : 1.2),
    )
  }, [gl, quality])

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial])

  useEffect(
    () => () => {
      if (viewCenterFrameRef.current !== null) {
        window.cancelAnimationFrame(viewCenterFrameRef.current)
      }
    },
    [],
  )

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
        polygonsData={countryBoundaries.features}
        polygonGeoJsonGeometry="geometry"
        polygonCapColor={(value) => {
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return '#f2c75c'
          if (countryCode === hoveredCountryCode) return '#68d7ff'
          return '#176593'
        }}
        polygonSideColor={(value) =>
          getBoundaryCode(value) === selectedCountryCode ? '#b88927' : '#0a3552'
        }
        polygonStrokeColor={(value) => {
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return '#fff1a8'
          if (countryCode === hoveredCountryCode) return '#d8f7ff'
          return '#6cb4d4'
        }}
        polygonAltitude={(value) => {
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return 0.027
          if (countryCode === hoveredCountryCode) return 0.017
          return 0.006
        }}
        polygonCapCurvatureResolution={quality === 'balanced' ? 2 : 4}
        polygonsTransitionDuration={reducedMotion ? 0 : 260}
        pointsData={capitalMarkers}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.018}
        pointRadius={(value) =>
          getCapitalMarkerCode(value) === selectedCountryCode ? 0.48 : 0.34
        }
        pointColor={(value) => {
          const countryCode = getCapitalMarkerCode(value)
          if (countryCode === selectedCountryCode) return '#ffd85e'
          if (countryCode === hoveredCountryCode) return '#9ff2ff'
          return '#f5f0c7'
        }}
        pointResolution={quality === 'balanced' ? 16 : 8}
        pointsTransitionDuration={reducedMotion ? 0 : 220}
        onGlobeReady={() => {
          globeReadyRef.current = true
          syncPointOfView()
          flyToPosition(cameraTargetRef.current.position)
        }}
        onHover={(layer, value) => {
          onHoverCountry(getCountryCodeForLayer(layer, value))
        }}
        onClick={(layer, value) => {
          const countryCode = getCountryCodeForLayer(layer, value)
          if (countryCode) onSelectCountry(countryCode)
        }}
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
        onChange={() => {
          syncPointOfView()
          scheduleViewCenterChange()
        }}
        onEnd={commitViewCenter}
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
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hoveredCountry = getCountry(props.hoveredCountryCode)

  return (
    <div
      className="globe-canvas"
      data-testid="globe-scene"
      role="application"
      aria-label="交互式 3D 地球。拖动旋转，滚轮缩放，方向键移动视角。"
      tabIndex={0}
      onPointerMove={(event) => {
        if (!tooltipRef.current) return
        tooltipRef.current.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
      }}
      onPointerLeave={() => props.onHoverCountry(null)}
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
      {hoveredCountry ? (
        <div ref={tooltipRef} className="country-hover-tooltip" role="tooltip">
          <img src={hoveredCountry.flagAsset} alt="" />
          <span>{hoveredCountry.name.zh}</span>
          <small>{hoveredCountry.code}</small>
        </div>
      ) : null}
    </div>
  )
}
