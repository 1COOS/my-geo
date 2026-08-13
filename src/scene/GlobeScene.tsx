import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import R3fGlobe, { type GlobeMethods } from 'r3f-globe'
import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import {
  Color,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector2,
  Vector3,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import {
  cities,
  countryBoundaries,
  getCity,
  getCountry,
} from '../data/countries'
import type { City } from '../data/citySchema'
import type { CameraTarget, GlobeView } from '../shared/types/geo'
import {
  getBoundaryCode,
  getCameraFlightDuration,
  getCityLabelBudget,
  getCityIdForLayer,
  getCityMarker,
  getCountryCodeForLayer,
  getGlobeViewOffset,
  getOverviewCameraPosition,
  getVisibleLayerCities,
  OVERVIEW_CAMERA_DISTANCE,
  shouldApplyCameraTargetRequest,
  type CityMarker,
} from './countrySceneInteraction'

export type GlobeSceneProps = {
  autoRotate: boolean
  cameraTarget: CameraTarget
  quality: 'balanced' | 'low'
  reducedMotion: boolean
  showCapitals: boolean
  showCities: boolean
  selectedCountryCode: string | null
  selectedCityId: string | null
  hoveredCountryCode: string | null
  hoveredCityId: string | null
  onSelectCountry: (countryCode: string) => void
  onSelectCity: (cityId: string) => void
  onHoverCountry: (countryCode: string | null) => void
  onHoverCity: (cityId: string | null) => void
  onViewCenterChange: (view: GlobeView) => void
  onViewCenterCommit: (view: GlobeView) => void
}

type WorldProps = GlobeSceneProps & {
  labelCities: City[]
  labelLayerRef: RefObject<HTMLDivElement | null>
}

const INITIAL_CAMERA_POSITION: [number, number, number] = [
  0,
  18,
  Math.sqrt(OVERVIEW_CAMERA_DISTANCE ** 2 - 18 ** 2),
]

type CameraFlight = {
  from: Vector3
  to: Vector3
  elapsed: number
  duration: number
}

type LabelRect = {
  left: number
  top: number
  right: number
  bottom: number
}

function overlaps(left: LabelRect, right: LabelRect) {
  return !(
    left.right < right.left ||
    left.left > right.right ||
    left.bottom < right.top ||
    left.top > right.bottom
  )
}

function getLabelPriority(
  city: City,
  selectedCityId: string | null,
  hoveredCityId: string | null,
) {
  if (city.id === selectedCityId) return 0
  if (city.id === hoveredCityId) return 1
  return (city.isCapital ? 2 : 10) + city.order / 10
}

function World({
  autoRotate,
  cameraTarget,
  quality,
  reducedMotion,
  selectedCountryCode,
  selectedCityId,
  hoveredCountryCode,
  hoveredCityId,
  onSelectCountry,
  onSelectCity,
  onHoverCountry,
  onHoverCity,
  onViewCenterChange,
  onViewCenterCommit,
  labelCities,
  labelLayerRef,
}: WorldProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const globeReadyRef = useRef(false)
  const cameraTargetRef = useRef(cameraTarget)
  const appliedCameraRequestIdRef = useRef<number | null>(null)
  const cameraFlightRef = useRef<CameraFlight | null>(null)
  const labelLayoutPendingRef = useRef(true)
  const viewCenterFrameRef = useRef<number | null>(null)
  const labelElementsRef = useRef(new Map<string, HTMLElement>())
  const visibleLabelIdsRef = useRef(new Set<string>())
  const flyToTargetRef = useRef<(target: CameraTarget) => void>(() => undefined)
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
  const cityMarkers = useMemo<CityMarker[]>(() => {
    return labelCities.map((city) => ({
      cityId: city.id,
      countryCode: city.countryCode,
      lat: city.latitude,
      lng: city.longitude,
      name: city.name.zh,
      isCapital: city.isCapital,
    }))
  }, [labelCities])

  const syncPointOfView = useCallback(() => {
    globeRef.current?.setPointOfView(camera)
  }, [camera])

  const layoutCityLabels = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return

    // OrbitControls updates the camera before Three.js refreshes its matrices.
    // Project labels from the current camera pose so the DOM overlay shares the
    // exact frame rendered by WebGL.
    camera.updateMatrixWorld()

    const labelElements = labelElementsRef.current
    for (const cityId of visibleLabelIdsRef.current) {
      const element = labelElements.get(cityId)
      if (element) element.hidden = true
    }
    const nextVisibleIds = new Set<string>()

    const touchDevice = navigator.maxTouchPoints > 0
    const budget = getCityLabelBudget(quality, touchDevice)
    const globeRadius = globe.getGlobeRadius()
    const acceptedRects: LabelRect[] = []
    let visibleCount = 0

    const sortedCities = [...labelCities].sort(
      (left, right) =>
        getLabelPriority(left, selectedCityId, hoveredCityId) -
        getLabelPriority(right, selectedCityId, hoveredCityId),
    )

    for (const city of sortedCities) {
      if (visibleCount >= budget) break
      const element = labelElements.get(city.id)
      if (!element) continue

      const coordinate = globe.getCoords(city.latitude, city.longitude, 0.04)
      const worldPosition = new Vector3(
        coordinate.x,
        coordinate.y,
        coordinate.z,
      )
      if (worldPosition.dot(camera.position) <= globeRadius ** 2) continue

      const screenPosition = worldPosition.clone().project(camera)
      const x = (screenPosition.x * 0.5 + 0.5) * size.width
      const y = (-screenPosition.y * 0.5 + 0.5) * size.height
      if (x < 12 || x > size.width - 12 || y < 12 || y > size.height - 12) {
        continue
      }

      const width = Math.max(56, city.name.zh.length * 14 + 28)
      const height = 28
      const rect = {
        left: x - width / 2 - 5,
        top: y - height / 2 - 5,
        right: x + width / 2 + 5,
        bottom: y + height / 2 + 5,
      }
      const forced = city.id === selectedCityId || city.id === hoveredCityId
      if (
        !forced &&
        acceptedRects.some((accepted) => overlaps(rect, accepted))
      ) {
        continue
      }

      element.hidden = false
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      nextVisibleIds.add(city.id)
      acceptedRects.push(rect)
      visibleCount += 1
    }
    visibleLabelIdsRef.current = nextVisibleIds
  }, [
    camera,
    hoveredCityId,
    labelCities,
    quality,
    selectedCityId,
    size.height,
    size.width,
  ])

  useEffect(() => {
    const labelLayer = labelLayerRef.current
    if (!labelLayer) return
    labelElementsRef.current = new Map(
      [...labelLayer.querySelectorAll<HTMLElement>('[data-city-id]')].map(
        (element) => [element.dataset.cityId ?? '', element],
      ),
    )
    visibleLabelIdsRef.current.clear()
    layoutCityLabels()
  }, [labelCities, labelLayerRef, layoutCityLabels])

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const viewOffset = getGlobeViewOffset(size.width, size.height)
    camera.setViewOffset(
      viewOffset.fullWidth,
      viewOffset.fullHeight,
      viewOffset.offsetX,
      viewOffset.offsetY,
      viewOffset.width,
      viewOffset.height,
    )
    camera.updateProjectionMatrix()
    syncPointOfView()
    layoutCityLabels()

    return () => {
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
    }
  }, [camera, layoutCityLabels, size.height, size.width, syncPointOfView])

  const getView = useCallback((): GlobeView | null => {
    const coordinate = globeRef.current?.toGeoCoords(camera.position)
    if (!coordinate) return null
    return {
      position: {
        latitude: coordinate.lat,
        longitude: coordinate.lng,
      },
      distance: camera.position.length(),
    }
  }, [camera])

  const scheduleViewChange = useCallback(() => {
    if (viewCenterFrameRef.current !== null) return
    viewCenterFrameRef.current = window.requestAnimationFrame(() => {
      viewCenterFrameRef.current = null
      const view = getView()
      if (view) onViewCenterChange(view)
    })
  }, [getView, onViewCenterChange])

  const commitView = useCallback(() => {
    layoutCityLabels()
    const view = getView()
    if (!view) return
    onViewCenterChange(view)
    onViewCenterCommit(view)
  }, [getView, layoutCityLabels, onViewCenterChange, onViewCenterCommit])

  const flyToTarget = useCallback(
    (target: CameraTarget) => {
      if (!globeReadyRef.current || !globeRef.current) return
      const destination = globeRef.current.getCoords(
        target.position.latitude,
        target.position.longitude,
        1.42,
      )
      const overviewPosition = getOverviewCameraPosition(
        destination,
        target.distance,
      )
      const targetPosition = new Vector3(
        overviewPosition.x,
        overviewPosition.y,
        overviewPosition.z,
      )

      const flightDuration = getCameraFlightDuration(reducedMotion)
      if (flightDuration === 0) {
        camera.position.copy(targetPosition)
        camera.lookAt(0, 0, 0)
        controlsRef.current?.target.set(0, 0, 0)
        controlsRef.current?.update()
        syncPointOfView()
        commitView()
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
    [camera, commitView, reducedMotion, syncPointOfView],
  )

  const applyCameraTargetRequest = useCallback(() => {
    const target = cameraTargetRef.current
    if (
      !globeReadyRef.current ||
      !globeRef.current ||
      !shouldApplyCameraTargetRequest(
        appliedCameraRequestIdRef.current,
        target.requestId,
      )
    ) {
      return
    }

    appliedCameraRequestIdRef.current = target.requestId
    cameraFlightRef.current = null
    if (controlsRef.current) controlsRef.current.enabled = true
    flyToTargetRef.current(target)
  }, [])

  useFrame((_state, delta) => {
    const flight = cameraFlightRef.current
    if (flight) {
      flight.elapsed = Math.min(flight.elapsed + delta, flight.duration)
      const progress = flight.elapsed / flight.duration
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      camera.position.lerpVectors(flight.from, flight.to, easedProgress)
      camera.lookAt(0, 0, 0)
      controlsRef.current?.target.set(0, 0, 0)
      syncPointOfView()
      labelLayoutPendingRef.current = true
      scheduleViewChange()

      if (progress >= 1) {
        cameraFlightRef.current = null
        if (controlsRef.current) {
          controlsRef.current.enabled = true
          controlsRef.current.update()
        }
        commitView()
      }
    }

    if (autoRotate || labelLayoutPendingRef.current) {
      labelLayoutPendingRef.current = false
      layoutCityLabels()
    }
  })

  useEffect(() => {
    cameraTargetRef.current = cameraTarget
    flyToTargetRef.current = flyToTarget
    applyCameraTargetRequest()
  }, [applyCameraTargetRequest, cameraTarget, flyToTarget])

  useEffect(() => {
    gl.setPixelRatio(
      Math.min(window.devicePixelRatio, quality === 'balanced' ? 1.75 : 1.2),
    )
  }, [gl, quality])

  useEffect(() => {
    layoutCityLabels()
  }, [layoutCityLabels])

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
        pointsData={cityMarkers}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.018}
        pointRadius={(value) => {
          const marker = getCityMarker(value)
          if (marker?.cityId === selectedCityId) return 0.58
          if (marker?.cityId === hoveredCityId) return 0.5
          if (!marker?.isCapital) return 0.3
          return marker.countryCode === selectedCountryCode ? 0.46 : 0.34
        }}
        pointColor={(value) => {
          const marker = getCityMarker(value)
          if (marker?.cityId === selectedCityId) return '#ffffff'
          if (marker?.cityId === hoveredCityId) return '#b8f5ff'
          if (!marker?.isCapital) return '#4dcfff'
          if (marker.countryCode === selectedCountryCode) return '#ffd85e'
          return '#f5cf62'
        }}
        pointResolution={quality === 'balanced' ? 16 : 8}
        pointsTransitionDuration={reducedMotion ? 0 : 220}
        onGlobeReady={() => {
          globeReadyRef.current = true
          syncPointOfView()
          layoutCityLabels()
          applyCameraTargetRequest()
        }}
        onHover={(layer, value) => {
          const cityId = getCityIdForLayer(layer, value)
          onHoverCity(cityId)
          onHoverCountry(cityId ? null : getCountryCodeForLayer(layer, value))
        }}
        onClick={(layer, value) => {
          const cityId = getCityIdForLayer(layer, value)
          if (cityId) {
            onSelectCity(cityId)
            return
          }
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
        maxDistance={OVERVIEW_CAMERA_DISTANCE}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI - 0.18}
        rotateSpeed={0.62}
        zoomSpeed={0.72}
        autoRotate={autoRotate}
        autoRotateSpeed={0.42}
        onChange={() => {
          syncPointOfView()
          labelLayoutPendingRef.current = true
          scheduleViewChange()
        }}
        onEnd={commitView}
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
  const labelLayerRef = useRef<HTMLDivElement>(null)
  const hoveredCountry = getCountry(props.hoveredCountryCode)
  const hoveredCity = getCity(props.hoveredCityId)
  const labelCities = useMemo(
    () =>
      getVisibleLayerCities(cities, {
        showCapitals: props.showCapitals,
        showCities: props.showCities,
        selectedCityId: props.selectedCityId,
        hoveredCityId: props.hoveredCityId,
      }),
    [
      props.hoveredCityId,
      props.selectedCityId,
      props.showCapitals,
      props.showCities,
    ],
  )

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
      onPointerLeave={() => {
        props.onHoverCountry(null)
        props.onHoverCity(null)
      }}
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
        <World
          {...props}
          labelCities={labelCities}
          labelLayerRef={labelLayerRef}
        />
      </Canvas>
      <div
        ref={labelLayerRef}
        className="globe-city-labels"
        aria-label="首都与主要城市标签"
      >
        {labelCities.map((city) => (
          <button
            type="button"
            key={city.id}
            hidden
            className={city.isCapital ? 'city-label is-capital' : 'city-label'}
            data-city-id={city.id}
            aria-label={`定位到${city.name.zh}${city.isCapital ? '首都' : '城市'}`}
            onPointerEnter={() => props.onHoverCity(city.id)}
            onPointerLeave={() => props.onHoverCity(null)}
            onClick={() => props.onSelectCity(city.id)}
          >
            <span aria-hidden="true" />
            {city.name.zh}
          </button>
        ))}
      </div>
      {hoveredCity || hoveredCountry ? (
        <div ref={tooltipRef} className="country-hover-tooltip" role="tooltip">
          {hoveredCity ? (
            <>
              <span>{hoveredCity.name.zh}</span>
              <small>
                {hoveredCity.isCapital ? '首都' : hoveredCity.name.en}
              </small>
            </>
          ) : hoveredCountry ? (
            <>
              <img src={hoveredCountry.flagAsset} alt="" />
              <span>{hoveredCountry.name.zh}</span>
              <small>{hoveredCountry.code}</small>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
