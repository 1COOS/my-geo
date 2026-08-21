import { Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import R3fGlobe, { type GlobeMethods } from 'r3f-globe'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  Color,
  MeshStandardMaterial,
  NearestFilter,
  PerspectiveCamera,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import type { CountryBoundaries } from '../data/countrySchema'
import type { DesertGeometry } from '../data/desertSchema'
import type { ClimateTypeId } from '../data/climateLearningSchema'
import { getReferenceLine } from '../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLineId,
} from '../data/geographyLearningSchema'
import { getWaterbody } from '../data/waterbodies'
import type { LinearGeoFeatureGeometry } from '../data/linearGeoFeatureSchema'
import type { MountainRangeGeometry } from '../data/mountainRangeSchema'
import type { WaterbodyGeometry } from '../data/waterbodySchema'
import type { CameraTarget, GeoPosition, GlobeView } from '../shared/types/geo'
import {
  getBoundaryCode,
  getCameraFlightDuration,
  getCityLabelBudget,
  getClimateMarker,
  getCityIdForLayer,
  getCityMarker,
  getCountryCodeForLayer,
  getGlobeViewOffset,
  getLinearFeatureIdForLayer,
  getMapLabelPlacement,
  getOverviewCameraPosition,
  getWaterbodyIdForLayer,
  getWaterbodyMarker,
  getWaterbodyPolygonState,
  OVERVIEW_CAMERA_DISTANCE,
  shouldApplyCameraTargetRequest,
} from './countrySceneInteraction'
import {
  getLinearFeatureEndpointPairs,
  getSelectedLinearFeatureLabelOffset,
} from './linearFeatureSceneInteraction'
import {
  getGeographicPathPointAltitude,
  getGeographicPathPointLatitude,
  getGeographicPathPointLongitude,
} from './geographicPathStyle'
import { getMountainRangeIdForLayer } from './mountainSceneInteraction'
import {
  getLandmarkIdForLayer,
  getLandmarkMarker,
} from './landmarkSceneInteraction'
import {
  getDesertIdForLayer,
  getDesertPolygonState,
} from './desertSceneInteraction'
import {
  getGeographyCanvasCursor,
  getReferenceLineIdForLayer,
  hasExceededGeographyDragThreshold,
} from './geographyLearningScene'
import { advanceGlobeLabelFrame } from './globeFrameScheduling'
import { GlobeCameraControls } from './GlobeCameraControls'
import { GlobeDomOverlay } from './GlobeDomOverlay'
import {
  getLabelGroup,
  getLabelPriority,
  getLabelVisibilityChanges,
  getMapLabelName,
  labelRectsOverlap,
  type LabelGroup,
  type LabelRect,
  type MapLabel,
} from './globeLabelLayout'
import { useGlobeLabelData } from './useGlobeLabelData'
import { useGlobeRenderData } from './useGlobeRenderData'

export type GlobeWorldProps = {
  countryBoundaries: CountryBoundaries | null
  waterbodyGeometries: WaterbodyGeometry[] | null
  linearFeatureGeometries: LinearGeoFeatureGeometry[] | null
  mountainGeometries: MountainRangeGeometry[] | null
  desertGeometries: DesertGeometry[] | null
  autoRotate: boolean
  cameraTarget: CameraTarget
  quality: 'balanced' | 'low'
  reducedMotion: boolean
  showCapitals: boolean
  showCities: boolean
  showOceanLayer: boolean
  showLakeLayer: boolean
  showWaterwayLayer: boolean
  showRiverAndCanalLayer: boolean
  showMountainLayer: boolean
  showDesertLayer: boolean
  showLandmarkLayer: boolean
  showGeographyLearningLayer: boolean
  showClimateLayer: boolean
  selectedClimateTypeId: ClimateTypeId | null
  climateRasterUrl: string
  climateBoundaryRasterUrl: string | null
  selectedClimatePosition: GeoPosition | null
  selectedGeographyTopicId: GeographyTopicId | null
  selectedReferenceLineId: ReferenceLineId | null
  selectedCountryCode: string | null
  selectedCityId: string | null
  hoveredCountryCode: string | null
  hoveredCityId: string | null
  selectedWaterbodyId: string | null
  hoveredWaterbodyId: string | null
  selectedLinearFeatureId: string | null
  hoveredLinearFeatureId: string | null
  selectedMountainRangeId: string | null
  hoveredMountainRangeId: string | null
  selectedDesertId: string | null
  hoveredDesertId: string | null
  selectedLandmarkId: string | null
  hoveredLandmarkId: string | null
  onSelectCountry: (countryCode: string) => void
  onSelectCity: (cityId: string) => void
  onHoverCountry: (countryCode: string | null) => void
  onHoverCity: (cityId: string | null) => void
  onSelectWaterbody: (waterbodyId: string) => void
  onHoverWaterbody: (waterbodyId: string | null) => void
  onSelectLinearFeature: (featureId: string) => void
  onHoverLinearFeature: (featureId: string | null) => void
  onSelectMountainRange: (rangeId: string) => void
  onHoverMountainRange: (rangeId: string | null) => void
  onSelectDesert: (desertId: string) => void
  onHoverDesert: (desertId: string | null) => void
  onSelectLandmark: (landmarkId: string) => void
  onHoverLandmark: (landmarkId: string | null) => void
  onSelectGeographyTopic: (
    topicId: GeographyTopicId,
    referenceLineId?: ReferenceLineId | null,
  ) => void
  onSelectClimatePosition: (position: GeoPosition) => void
  onViewCenterChange: (view: GlobeView) => void
  onViewCenterCommit: (view: GlobeView) => void
}

export type GlobeSceneProps = {
  geometry: Pick<
    GlobeWorldProps,
    | 'countryBoundaries'
    | 'waterbodyGeometries'
    | 'linearFeatureGeometries'
    | 'mountainGeometries'
    | 'desertGeometries'
  >
  view: Pick<
    GlobeWorldProps,
    'autoRotate' | 'cameraTarget' | 'quality' | 'reducedMotion'
  >
  layers: Pick<
    GlobeWorldProps,
    | 'showCapitals'
    | 'showCities'
    | 'showOceanLayer'
    | 'showLakeLayer'
    | 'showWaterwayLayer'
    | 'showRiverAndCanalLayer'
    | 'showMountainLayer'
    | 'showDesertLayer'
    | 'showLandmarkLayer'
    | 'showGeographyLearningLayer'
    | 'showClimateLayer'
  >
  climate: Pick<
    GlobeWorldProps,
    | 'selectedClimateTypeId'
    | 'climateRasterUrl'
    | 'climateBoundaryRasterUrl'
    | 'selectedClimatePosition'
  >
  selection: Pick<
    GlobeWorldProps,
    | 'selectedGeographyTopicId'
    | 'selectedReferenceLineId'
    | 'selectedCountryCode'
    | 'selectedCityId'
    | 'selectedWaterbodyId'
    | 'selectedLinearFeatureId'
    | 'selectedMountainRangeId'
    | 'selectedDesertId'
    | 'selectedLandmarkId'
  >
  hover: Pick<
    GlobeWorldProps,
    | 'hoveredCountryCode'
    | 'hoveredCityId'
    | 'hoveredWaterbodyId'
    | 'hoveredLinearFeatureId'
    | 'hoveredMountainRangeId'
    | 'hoveredDesertId'
    | 'hoveredLandmarkId'
  >
  events: Pick<
    GlobeWorldProps,
    | 'onSelectCountry'
    | 'onSelectCity'
    | 'onHoverCountry'
    | 'onHoverCity'
    | 'onSelectWaterbody'
    | 'onHoverWaterbody'
    | 'onSelectLinearFeature'
    | 'onHoverLinearFeature'
    | 'onSelectMountainRange'
    | 'onHoverMountainRange'
    | 'onSelectDesert'
    | 'onHoverDesert'
    | 'onSelectLandmark'
    | 'onHoverLandmark'
    | 'onSelectGeographyTopic'
    | 'onSelectClimatePosition'
    | 'onViewCenterChange'
    | 'onViewCenterCommit'
  >
}

type WorldProps = GlobeWorldProps & {
  labelItems: MapLabel[]
  labelLayerRef: RefObject<HTMLDivElement | null>
  controlsInteractingRef: { current: boolean }
  onControlsInteractionStart: () => void
  onControlsInteractionEnd: () => void
  selectedLinearFeatureOverlayRef: RefObject<SVGSVGElement | null>
  selectedMountainPeakRef: RefObject<HTMLButtonElement | null>
}

type LabelLayoutCandidate = {
  item: MapLabel
  group: LabelGroup
  width: number
  height: number
}

type MutableLabelProjection = {
  x: number
  y: number
  leaderLength: number
  leaderAngleDegrees: number
}

function resetClimateBoundaryMaterial(material: MeshStandardMaterial) {
  material.emissiveMap = null
  material.emissive.set('#061f33')
  material.emissiveIntensity = 0.22
  material.needsUpdate = true
}

function applyClimateBoundaryMaterial(
  material: MeshStandardMaterial,
  texture: Texture,
  quality: 'balanced' | 'low',
) {
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.wrapS = RepeatWrapping
  texture.needsUpdate = true
  material.emissiveMap = texture
  material.emissive.set('#fff4bd')
  material.emissiveIntensity = quality === 'balanced' ? 2.6 : 2
  material.needsUpdate = true
}

function releaseClimateBoundaryTexture(
  material: MeshStandardMaterial,
  texture: Texture,
) {
  if (material.emissiveMap === texture) material.emissiveMap = null
  texture.dispose()
}

type GlobeLayerObject = {
  parent?: GlobeLayerObject | null
  __globeObjType?: string
}

function getGlobeLayerType(object: unknown) {
  let current = object as GlobeLayerObject | null | undefined
  while (current) {
    if (current.__globeObjType) return current.__globeObjType
    current = current.parent
  }
  return null
}

function getGlobeClickPoint(event: unknown) {
  const globeEvent = event as {
    point?: Vector3
    intersections?: Array<{ object: unknown; point: Vector3 }>
  }
  if (globeEvent.point) return globeEvent.point
  return (
    globeEvent.intersections?.find(
      (intersection) => getGlobeLayerType(intersection.object) !== 'atmosphere',
    )?.point ?? null
  )
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

function getWaterbodyLayerForScene(value: object | undefined) {
  return getWaterbody(getWaterbodyIdForLayer('polygon', value))?.layer
}

function World({
  countryBoundaries,
  waterbodyGeometries,
  linearFeatureGeometries,
  mountainGeometries,
  desertGeometries,
  autoRotate,
  cameraTarget,
  quality,
  reducedMotion,
  selectedCountryCode,
  selectedCityId,
  hoveredCountryCode,
  hoveredCityId,
  selectedWaterbodyId,
  hoveredWaterbodyId,
  selectedLinearFeatureId,
  hoveredLinearFeatureId,
  selectedMountainRangeId,
  hoveredMountainRangeId,
  selectedDesertId,
  hoveredDesertId,
  selectedLandmarkId,
  hoveredLandmarkId,
  showGeographyLearningLayer,
  showClimateLayer,
  climateRasterUrl,
  climateBoundaryRasterUrl,
  selectedClimatePosition,
  selectedReferenceLineId,
  showRiverAndCanalLayer,
  showMountainLayer,
  showDesertLayer,
  onSelectCountry,
  onSelectCity,
  onHoverCountry,
  onHoverCity,
  onSelectWaterbody,
  onHoverWaterbody,
  onSelectLinearFeature,
  onHoverLinearFeature,
  onSelectMountainRange,
  onHoverMountainRange,
  onSelectDesert,
  onHoverDesert,
  onSelectLandmark,
  onHoverLandmark,
  onSelectGeographyTopic,
  onSelectClimatePosition,
  onViewCenterChange,
  onViewCenterCommit,
  labelItems,
  labelLayerRef,
  controlsInteractingRef,
  onControlsInteractionStart,
  onControlsInteractionEnd,
  selectedLinearFeatureOverlayRef,
  selectedMountainPeakRef,
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
  const admittedLabelIdsRef = useRef(new Set<string>())
  const visibleLabelIdsRef = useRef(new Set<string>())
  const labelWorldPositionsRef = useRef(new Map<string, Vector3>())
  const projectedLabelPositionRef = useRef(new Vector3())
  const labelProjectionRef = useRef<MutableLabelProjection>({
    x: 0,
    y: 0,
    leaderLength: 0,
    leaderAngleDegrees: 0,
  })
  const labelCollisionFrameAccumulatorRef = useRef(0)
  const flyToTargetRef = useRef<(target: CameraTarget) => void>(() => undefined)
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)
  const geographyPointerGestureRef = useRef<{
    pointerId: number
    pointerType: string
    x: number
    y: number
    dragged: boolean
  } | null>(null)
  const suppressGeographyClickRef = useRef(false)
  const { camera, gl, size } = useThree()
  const touchDevice = useMemo(() => navigator.maxTouchPoints > 0, [])
  const rendererSize = useMemo(
    () => new Vector2(size.width, size.height),
    [size.height, size.width],
  )
  const globeMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color('#ffffff'),
        emissive: new Color('#061f33'),
        emissiveIntensity: 0.22,
        roughness: 0.74,
        metalness: 0.04,
      }),
    [],
  )
  useEffect(() => {
    let active = true
    let loadedTexture: Texture | null = null
    resetClimateBoundaryMaterial(globeMaterial)
    if (!showClimateLayer || !climateBoundaryRasterUrl) {
      return () => {
        active = false
      }
    }
    new TextureLoader().load(
      climateBoundaryRasterUrl,
      (texture) => {
        if (!active) {
          texture.dispose()
          return
        }
        loadedTexture = texture
        applyClimateBoundaryMaterial(globeMaterial, texture, quality)
      },
      undefined,
      () => {
        if (active) resetClimateBoundaryMaterial(globeMaterial)
      },
    )
    return () => {
      active = false
      if (loadedTexture) {
        releaseClimateBoundaryTexture(globeMaterial, loadedTexture)
      }
      resetClimateBoundaryMaterial(globeMaterial)
    }
  }, [climateBoundaryRasterUrl, globeMaterial, quality, showClimateLayer])
  useEffect(() => {
    const canvas = gl.domElement
    canvasElementRef.current = canvas
    const handlePointerDown = (event: PointerEvent) => {
      geographyPointerGestureRef.current = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        x: event.clientX,
        y: event.clientY,
        dragged: false,
      }
      suppressGeographyClickRef.current = false
      canvas.style.cursor = 'grabbing'
      onControlsInteractionStart()
    }
    const handlePointerMove = (event: PointerEvent) => {
      const gesture = geographyPointerGestureRef.current
      if (
        gesture?.pointerId !== event.pointerId ||
        (event.pointerType !== 'touch' && event.buttons === 0)
      )
        return
      if (
        !gesture.dragged &&
        hasExceededGeographyDragThreshold(gesture, {
          x: event.clientX,
          y: event.clientY,
        })
      ) {
        gesture.dragged = true
      }
      onControlsInteractionStart()
    }
    const handlePointerUp = (event: PointerEvent) => {
      const gesture = geographyPointerGestureRef.current
      if (gesture?.pointerId === event.pointerId) {
        suppressGeographyClickRef.current = gesture.dragged
        geographyPointerGestureRef.current = null
      }
      canvas.style.cursor = ''
      onControlsInteractionEnd()
    }
    const handlePointerCancel = () => {
      suppressGeographyClickRef.current = true
      geographyPointerGestureRef.current = null
      canvas.style.cursor = ''
      onControlsInteractionEnd()
    }
    canvas.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('pointerup', handlePointerUp, true)
    window.addEventListener('pointercancel', handlePointerCancel, true)

    return () => {
      canvas.style.cursor = ''
      canvasElementRef.current = null
      canvas.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('pointerup', handlePointerUp, true)
      window.removeEventListener('pointercancel', handlePointerCancel, true)
    }
  }, [gl, onControlsInteractionEnd, onControlsInteractionStart])
  const {
    pointMarkers,
    selectedMountainRange,
    selectedPathAltitude,
    selectedLinearFeatureGeometry,
    pathData,
    polygonsData,
  } = useGlobeRenderData({
    countryBoundaries,
    waterbodyGeometries,
    linearFeatureGeometries,
    mountainGeometries,
    desertGeometries,
    quality,
    labelItems,
    selectedClimatePosition,
    selectedWaterbodyId,
    showDesertLayer,
    selectedLinearFeatureId,
    selectedMountainRangeId,
    showRiverAndCanalLayer,
    hoveredLinearFeatureId,
    showMountainLayer,
    hoveredMountainRangeId,
    selectedReferenceLineId,
    showGeographyLearningLayer,
    touchDevice,
  })

  const syncPointOfView = useCallback(() => {
    globeRef.current?.setPointOfView(camera)
  }, [camera])

  const projectSelectedLinearFeaturePoint = useCallback(
    ([longitude, latitude]: readonly [number, number]) => {
      const globe = globeRef.current
      if (!globe) return null
      const coordinate = globe.getCoords(
        latitude,
        longitude,
        selectedPathAltitude,
      )
      const worldPosition = new Vector3(
        coordinate.x,
        coordinate.y,
        coordinate.z,
      )
      const globeRadius = globe.getGlobeRadius()
      const visible = worldPosition.dot(camera.position) > globeRadius ** 2
      const screenPosition = worldPosition.project(camera)
      return {
        x: (screenPosition.x * 0.5 + 0.5) * size.width,
        y: (-screenPosition.y * 0.5 + 0.5) * size.height,
        visible,
      }
    },
    [camera, selectedPathAltitude, size.height, size.width],
  )

  const projectSelectedMountainPeak = useCallback(() => {
    const globe = globeRef.current
    if (!globe || !selectedMountainRange) return null
    const { latitude, longitude } = selectedMountainRange.highestPeak.position
    const coordinate = globe.getCoords(latitude, longitude, 0.072)
    const worldPosition = new Vector3(coordinate.x, coordinate.y, coordinate.z)
    const globeRadius = globe.getGlobeRadius()
    const screenPosition = worldPosition.clone().project(camera)
    return {
      x: (screenPosition.x * 0.5 + 0.5) * size.width,
      y: (-screenPosition.y * 0.5 + 0.5) * size.height,
      visible: worldPosition.dot(camera.position) > globeRadius ** 2,
    }
  }, [camera, selectedMountainRange, size.height, size.width])

  const layoutSelectedMountainPeak = useCallback(() => {
    const marker = selectedMountainPeakRef.current
    if (!marker) return
    camera.updateMatrixWorld()
    const projected = projectSelectedMountainPeak()
    if (!projected?.visible) {
      marker.hidden = true
      return
    }
    marker.hidden = false
    marker.style.transform = `translate3d(${projected.x}px, ${projected.y}px, 0) translate(-50%, -100%)`
  }, [camera, projectSelectedMountainPeak, selectedMountainPeakRef])

  const getProjectedSelectedLinearFeatureLines = useCallback(() => {
    if (!selectedLinearFeatureGeometry) return []
    return selectedLinearFeatureGeometry.coordinates.map((line) =>
      line
        .map(projectSelectedLinearFeaturePoint)
        .filter((point): point is NonNullable<typeof point> => point !== null),
    )
  }, [projectSelectedLinearFeaturePoint, selectedLinearFeatureGeometry])

  const layoutSelectedLinearFeatureOverlay = useCallback(() => {
    const overlay = selectedLinearFeatureOverlayRef.current
    if (!overlay || !selectedLinearFeatureGeometry) return

    camera.updateMatrixWorld()
    const projectedLines = getProjectedSelectedLinearFeatureLines()
    const pathParts: string[] = []
    for (const line of projectedLines) {
      let visibleRun: typeof line = []
      const flushVisibleRun = () => {
        if (visibleRun.length >= 2) {
          pathParts.push(
            visibleRun
              .map(
                (point, index) =>
                  `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
              )
              .join(' '),
          )
        }
        visibleRun = []
      }
      for (const point of line) {
        if (point.visible) visibleRun.push(point)
        else flushVisibleRun()
      }
      flushVisibleRun()
    }

    const projectedEndpoints = getLinearFeatureEndpointPairs(
      selectedLinearFeatureGeometry,
    ).map((endpoints) => ({
      start: projectSelectedLinearFeaturePoint([
        endpoints.start.longitude,
        endpoints.start.latitude,
      ]),
      end: projectSelectedLinearFeaturePoint([
        endpoints.end.longitude,
        endpoints.end.latitude,
      ]),
    }))
    const route = pathParts.join(' ')
    if (!route || projectedEndpoints.length === 0) {
      overlay.style.display = 'none'
      return
    }

    overlay.style.display = 'block'
    overlay.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`)
    overlay
      .querySelectorAll<SVGPathElement>('[data-linear-route-layer]')
      .forEach((path) => path.setAttribute('d', route))
    overlay
      .querySelectorAll<SVGGElement>('[data-linear-endpoint-pair]')
      .forEach((group, index) => {
        const endpoints = projectedEndpoints[index]
        if (!endpoints?.start?.visible && !endpoints?.end?.visible) {
          group.style.display = 'none'
          return
        }
        group.style.display = 'block'
        const startMarker = group.querySelector<SVGCircleElement>(
          '[data-linear-endpoint="start"]',
        )
        if (endpoints.start?.visible) {
          startMarker?.setAttribute('cx', endpoints.start.x.toFixed(2))
          startMarker?.setAttribute('cy', endpoints.start.y.toFixed(2))
          startMarker?.setAttribute('visibility', 'visible')
        } else {
          startMarker?.setAttribute('visibility', 'hidden')
        }
        const endMarker = group.querySelector<SVGPolygonElement>(
          '[data-linear-endpoint="end"]',
        )
        if (!endpoints.end?.visible) {
          endMarker?.setAttribute('visibility', 'hidden')
          return
        }
        endMarker?.setAttribute('visibility', 'visible')
        const end = endpoints.end
        const endRadius = 7
        endMarker?.setAttribute(
          'points',
          `${end.x.toFixed(2)},${(end.y - endRadius).toFixed(2)} ${(end.x + endRadius).toFixed(2)},${end.y.toFixed(2)} ${end.x.toFixed(2)},${(end.y + endRadius).toFixed(2)} ${(end.x - endRadius).toFixed(2)},${end.y.toFixed(2)}`,
        )
      })
  }, [
    camera,
    getProjectedSelectedLinearFeatureLines,
    projectSelectedLinearFeaturePoint,
    selectedLinearFeatureGeometry,
    selectedLinearFeatureOverlayRef,
    size.height,
    size.width,
  ])

  const labelLayoutItems = useMemo<LabelLayoutCandidate[]>(() => {
    const priorityState = {
      selectedCityId,
      hoveredCityId,
      selectedWaterbodyId,
      hoveredWaterbodyId,
      selectedLinearFeatureId,
      hoveredLinearFeatureId,
      selectedMountainRangeId,
      hoveredMountainRangeId,
      selectedDesertId,
      hoveredDesertId,
      selectedLandmarkId,
      hoveredLandmarkId,
      selectedReferenceLineId,
    }
    return [...labelItems]
      .sort(
        (left, right) =>
          getLabelPriority(left, priorityState) -
          getLabelPriority(right, priorityState),
      )
      .map((item) => ({
        item,
        group: getLabelGroup(item),
        width: Math.max(56, getMapLabelName(item).length * 14 + 28),
        height: 28,
      }))
  }, [
    hoveredCityId,
    hoveredDesertId,
    hoveredLandmarkId,
    hoveredLinearFeatureId,
    hoveredMountainRangeId,
    hoveredWaterbodyId,
    labelItems,
    selectedCityId,
    selectedDesertId,
    selectedLandmarkId,
    selectedLinearFeatureId,
    selectedMountainRangeId,
    selectedReferenceLineId,
    selectedWaterbodyId,
  ])
  const activeLabelGroupCount = useMemo(
    () => new Set(labelLayoutItems.map((candidate) => candidate.group)).size,
    [labelLayoutItems],
  )
  const labelLayoutCandidatesById = useMemo(
    () =>
      new Map(
        labelLayoutItems.map((candidate) => [candidate.item.id, candidate]),
      ),
    [labelLayoutItems],
  )

  const cacheLabelWorldPositions = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return

    const currentPositions = labelWorldPositionsRef.current
    const nextPositions = new Map<string, Vector3>()
    for (const { item } of labelLayoutItems) {
      const coordinate = globe.getCoords(item.latitude, item.longitude, 0.04)
      const worldPosition = currentPositions.get(item.id) ?? new Vector3()
      worldPosition.set(coordinate.x, coordinate.y, coordinate.z)
      nextPositions.set(item.id, worldPosition)
    }
    labelWorldPositionsRef.current = nextPositions
  }, [labelLayoutItems])

  const getSelectedLabelOffset = useCallback(() => {
    if (!selectedLinearFeatureId && !selectedMountainRangeId) return null
    const projectedRoute = getProjectedSelectedLinearFeatureLines()
      .flat()
      .filter((point) => point.visible)
    return getSelectedLinearFeatureLabelOffset(projectedRoute)
  }, [
    getProjectedSelectedLinearFeatureLines,
    selectedLinearFeatureId,
    selectedMountainRangeId,
  ])

  const projectLabelCandidate = useCallback(
    (
      candidate: LabelLayoutCandidate,
      globeRadius: number,
      projectedPeak: ReturnType<typeof projectSelectedMountainPeak>,
      selectedLabelOffset: ReturnType<
        typeof getSelectedLinearFeatureLabelOffset
      > | null,
    ) => {
      const { item, width, height } = candidate
      const worldPosition = labelWorldPositionsRef.current.get(item.id)
      if (!worldPosition) return false
      if (worldPosition.dot(camera.position) <= globeRadius ** 2) return false

      const screenPosition = projectedLabelPositionRef.current
        .copy(worldPosition)
        .project(camera)
      let x = (screenPosition.x * 0.5 + 0.5) * size.width
      let y = (-screenPosition.y * 0.5 + 0.5) * size.height
      if (x < 12 || x > size.width - 12 || y < 12 || y > size.height - 12) {
        return false
      }

      if (
        selectedLabelOffset &&
        ((item.type === 'linearFeature' &&
          item.id === selectedLinearFeatureId) ||
          (item.type === 'mountainRange' &&
            item.id === selectedMountainRangeId))
      ) {
        x = Math.max(
          width / 2 + 12,
          Math.min(size.width - width / 2 - 12, x + selectedLabelOffset.x),
        )
        y = Math.max(
          height / 2 + 12,
          Math.min(size.height - height / 2 - 12, y + selectedLabelOffset.y),
        )
        if (
          projectedPeak?.visible &&
          Math.hypot(x - projectedPeak.x, y - projectedPeak.y) < 64
        ) {
          y = Math.max(height / 2 + 12, y - 48)
        }
      }

      const labelPlacement = getMapLabelPlacement({
        x,
        y,
        labelWidth: width,
        labelHeight: height,
        viewportWidth: size.width,
        viewportHeight: size.height,
        isLake: item.type === 'waterbody' && item.waterbody.layer === 'lake',
      })
      const projection = labelProjectionRef.current
      projection.x = labelPlacement.x
      projection.y = labelPlacement.y
      projection.leaderLength = labelPlacement.leaderLength
      projection.leaderAngleDegrees = labelPlacement.leaderAngleDegrees
      return true
    },
    [
      camera,
      selectedLinearFeatureId,
      selectedMountainRangeId,
      size.height,
      size.width,
    ],
  )

  const applyLabelProjection = useCallback(
    (candidate: LabelLayoutCandidate, element: HTMLElement) => {
      const projection = labelProjectionRef.current
      const transform = `translate3d(${projection.x}px, ${projection.y}px, 0) translate(-50%, -50%)`
      if (element.style.transform !== transform) {
        element.style.transform = transform
      }
      if (
        candidate.item.type === 'waterbody' &&
        candidate.item.waterbody.layer === 'lake'
      ) {
        element.style.setProperty(
          '--lake-label-leader-length',
          `${projection.leaderLength.toFixed(2)}px`,
        )
        element.style.setProperty(
          '--lake-label-leader-angle',
          `${projection.leaderAngleDegrees.toFixed(2)}deg`,
        )
      }
    },
    [],
  )

  const reconcileLabelLayout = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return

    // OrbitControls updates the camera before Three.js refreshes its matrices.
    // Project labels from the current camera pose so the DOM overlay shares the
    // exact frame rendered by WebGL.
    camera.updateMatrixWorld()

    const labelElements = labelElementsRef.current
    const nextAdmittedIds = new Set<string>()
    const nextVisibleIds = new Set<string>()

    const touchDevice = navigator.maxTouchPoints > 0
    const budget = getCityLabelBudget(quality, touchDevice)
    const globeRadius = globe.getGlobeRadius()
    const acceptedRects: LabelRect[] = []
    const projectedPeak = projectSelectedMountainPeak()
    if (projectedPeak?.visible) {
      acceptedRects.push({
        left: projectedPeak.x - 20,
        top: projectedPeak.y - 38,
        right: projectedPeak.x + 20,
        bottom: projectedPeak.y + 12,
      })
    }
    let visibleCount = 0

    const groupCount: Record<LabelGroup, number> = {
      capital: 0,
      city: 0,
      ocean: 0,
      lake: 0,
      waterway: 0,
      river: 0,
      canal: 0,
      mountain: 0,
      desert: 0,
      landmark: 0,
      geography: 0,
    }
    const ordinaryGroupLimit = Math.ceil(
      budget / Math.max(activeLabelGroupCount, 1),
    )
    const selectedLabelOffset = getSelectedLabelOffset()

    for (const candidate of labelLayoutItems) {
      const { item, group: labelGroup, width, height } = candidate
      if (visibleCount >= budget) break
      const element = labelElements.get(item.id)
      if (!element) continue

      const forced =
        item.id === selectedCityId ||
        item.id === hoveredCityId ||
        item.id === selectedWaterbodyId ||
        item.id === hoveredWaterbodyId ||
        item.id === selectedLinearFeatureId ||
        item.id === hoveredLinearFeatureId ||
        item.id === selectedMountainRangeId ||
        item.id === hoveredMountainRangeId ||
        item.id === selectedDesertId ||
        item.id === hoveredDesertId ||
        item.id === selectedLandmarkId ||
        item.id === hoveredLandmarkId ||
        (item.type === 'referenceLine' &&
          item.line.id === selectedReferenceLineId)
      if (
        !forced &&
        labelGroup !== 'geography' &&
        groupCount[labelGroup] >= ordinaryGroupLimit
      )
        continue

      if (
        !projectLabelCandidate(
          candidate,
          globeRadius,
          projectedPeak,
          selectedLabelOffset,
        )
      )
        continue
      const projection = labelProjectionRef.current
      const rect = {
        left: projection.x - width / 2 - 5,
        top: projection.y - height / 2 - 5,
        right: projection.x + width / 2 + 5,
        bottom: projection.y + height / 2 + 5,
      }
      if (
        !forced &&
        acceptedRects.some((accepted) => labelRectsOverlap(rect, accepted))
      ) {
        continue
      }

      applyLabelProjection(candidate, element)
      nextAdmittedIds.add(item.id)
      nextVisibleIds.add(item.id)
      acceptedRects.push(rect)
      visibleCount += 1
      groupCount[labelGroup] += 1
    }

    const { hiddenIds, shownIds } = getLabelVisibilityChanges(
      visibleLabelIdsRef.current,
      nextVisibleIds,
    )
    for (const id of hiddenIds) {
      const element = labelElements.get(id)
      if (element && !element.hidden) element.hidden = true
    }
    for (const id of shownIds) {
      const element = labelElements.get(id)
      if (element?.hidden) element.hidden = false
    }
    admittedLabelIdsRef.current = nextAdmittedIds
    visibleLabelIdsRef.current = nextVisibleIds
  }, [
    applyLabelProjection,
    camera,
    getSelectedLabelOffset,
    hoveredCityId,
    hoveredWaterbodyId,
    hoveredLinearFeatureId,
    hoveredMountainRangeId,
    hoveredDesertId,
    hoveredLandmarkId,
    activeLabelGroupCount,
    labelLayoutItems,
    projectLabelCandidate,
    quality,
    projectSelectedMountainPeak,
    selectedCityId,
    selectedWaterbodyId,
    selectedLinearFeatureId,
    selectedMountainRangeId,
    selectedDesertId,
    selectedLandmarkId,
    selectedReferenceLineId,
  ])

  const trackAdmittedLabelPositions = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return

    camera.updateMatrixWorld()
    const globeRadius = globe.getGlobeRadius()
    const projectedPeak = projectSelectedMountainPeak()
    const selectedLabelOffset = getSelectedLabelOffset()
    const labelElements = labelElementsRef.current
    const visibleLabelIds = visibleLabelIdsRef.current

    for (const id of admittedLabelIdsRef.current) {
      const candidate = labelLayoutCandidatesById.get(id)
      const element = labelElements.get(id)
      if (!candidate || !element) continue
      const isVisible = projectLabelCandidate(
        candidate,
        globeRadius,
        projectedPeak,
        selectedLabelOffset,
      )
      if (!isVisible) {
        if (!element.hidden) element.hidden = true
        visibleLabelIds.delete(id)
        continue
      }

      applyLabelProjection(candidate, element)
      if (element.hidden) element.hidden = false
      visibleLabelIds.add(id)
    }
  }, [
    applyLabelProjection,
    camera,
    getSelectedLabelOffset,
    labelLayoutCandidatesById,
    projectLabelCandidate,
    projectSelectedMountainPeak,
  ])

  useEffect(() => {
    const labelLayer = labelLayerRef.current
    if (!labelLayer) return
    labelElementsRef.current = new Map(
      [...labelLayer.querySelectorAll<HTMLElement>('[data-map-label-id]')].map(
        (element) => [element.dataset.mapLabelId ?? '', element],
      ),
    )
    cacheLabelWorldPositions()
    reconcileLabelLayout()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()
  }, [
    cacheLabelWorldPositions,
    labelItems,
    labelLayerRef,
    reconcileLabelLayout,
    layoutSelectedLinearFeatureOverlay,
    layoutSelectedMountainPeak,
  ])

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
    reconcileLabelLayout()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()

    return () => {
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
    }
  }, [
    camera,
    reconcileLabelLayout,
    layoutSelectedLinearFeatureOverlay,
    layoutSelectedMountainPeak,
    size.height,
    size.width,
    syncPointOfView,
  ])

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
    labelLayoutPendingRef.current = false
    labelCollisionFrameAccumulatorRef.current = 0
    reconcileLabelLayout()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()
    const view = getView()
    if (!view) return
    onViewCenterChange(view)
    onViewCenterCommit(view)
  }, [
    getView,
    reconcileLabelLayout,
    layoutSelectedLinearFeatureOverlay,
    layoutSelectedMountainPeak,
    onViewCenterChange,
    onViewCenterCommit,
  ])

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

    const labelFrame = advanceGlobeLabelFrame(
      labelCollisionFrameAccumulatorRef.current,
      delta,
      quality,
      labelLayoutPendingRef.current,
    )
    labelCollisionFrameAccumulatorRef.current = labelFrame.accumulatedSeconds
    if (labelFrame.shouldTrackPositions) {
      labelLayoutPendingRef.current = false
      if (labelFrame.shouldReconcileLayout) reconcileLabelLayout()
      else trackAdmittedLabelPositions()
      layoutSelectedLinearFeatureOverlay()
      layoutSelectedMountainPeak()
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
    reconcileLabelLayout()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()
  }, [
    reconcileLabelLayout,
    layoutSelectedLinearFeatureOverlay,
    layoutSelectedMountainPeak,
  ])

  useEffect(
    () => () => {
      globeMaterial.dispose()
    },
    [globeMaterial],
  )

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
        globeImageUrl={
          showClimateLayer ? climateRasterUrl : '/climate/globe-base.svg'
        }
        showGlobe
        showGraticules
        showAtmosphere
        atmosphereColor="#70dfff"
        atmosphereAltitude={0.18}
        globeCurvatureResolution={quality === 'balanced' ? 3 : 5}
        polygonsData={polygonsData}
        polygonGeoJsonGeometry="geometry"
        polygonCapColor={(value) => {
          const waterbodyLayer = getWaterbodyLayerForScene(value)
          const waterbodyState = getWaterbodyPolygonState(
            value,
            selectedWaterbodyId,
            hoveredWaterbodyId,
          )
          if (waterbodyLayer === 'lake') {
            if (waterbodyState === 'selected') return '#7fffd4a8'
            if (waterbodyState === 'hovered') return '#5fe9c58c'
            return '#42cfaa40'
          }
          if (waterbodyLayer) return '#24d4ff55'
          const desertState = getDesertPolygonState(
            value,
            selectedDesertId,
            hoveredDesertId,
          )
          if (desertState === 'selected') return '#ffd878e8'
          if (desertState === 'hovered') return '#f6bc5dcc'
          if (desertState === 'ordinary') return '#c98a3a94'
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return '#f2c75c'
          if (countryCode === hoveredCountryCode) return '#68d7ff'
          return showClimateLayer ? '#17659324' : '#176593'
        }}
        polygonSideColor={(value) => {
          const waterbodyLayer = getWaterbodyLayerForScene(value)
          const waterbodyState = getWaterbodyPolygonState(
            value,
            selectedWaterbodyId,
            hoveredWaterbodyId,
          )
          if (waterbodyLayer === 'lake') {
            return waterbodyState === 'ordinary' ? '#0c755d30' : '#0c755d66'
          }
          if (waterbodyLayer) return '#086e8f44'
          const desertState = getDesertPolygonState(
            value,
            selectedDesertId,
            hoveredDesertId,
          )
          if (desertState === 'selected') return '#a8651ccc'
          if (desertState) return '#73451688'
          return getBoundaryCode(value) === selectedCountryCode
            ? '#b88927'
            : showClimateLayer
              ? '#0a355226'
              : '#0a3552'
        }}
        polygonStrokeColor={(value) => {
          const waterbodyLayer = getWaterbodyLayerForScene(value)
          const waterbodyState = getWaterbodyPolygonState(
            value,
            selectedWaterbodyId,
            hoveredWaterbodyId,
          )
          if (waterbodyLayer === 'lake') {
            if (waterbodyState === 'selected') return '#e1fff6'
            if (waterbodyState === 'hovered') return '#baffeb'
            return '#8ef2d5'
          }
          if (waterbodyLayer) return '#83ecff'
          const desertState = getDesertPolygonState(
            value,
            selectedDesertId,
            hoveredDesertId,
          )
          if (desertState === 'selected') return '#fff0bd'
          if (desertState === 'hovered') return '#ffe09a'
          if (desertState === 'ordinary') return '#e9ad58'
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return '#fff1a8'
          if (countryCode === hoveredCountryCode) return '#d8f7ff'
          return '#6cb4d4'
        }}
        polygonAltitude={(value) => {
          const waterbodyLayer = getWaterbodyLayerForScene(value)
          const waterbodyState = getWaterbodyPolygonState(
            value,
            selectedWaterbodyId,
            hoveredWaterbodyId,
          )
          if (waterbodyLayer === 'lake') {
            if (waterbodyState === 'selected') return 0.038
            if (waterbodyState === 'hovered') return 0.026
            return 0.012
          }
          if (waterbodyLayer) return 0.034
          const desertState = getDesertPolygonState(
            value,
            selectedDesertId,
            hoveredDesertId,
          )
          if (desertState === 'selected') return 0.042
          if (desertState === 'hovered') return 0.032
          if (desertState === 'ordinary') return 0.021
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return 0.027
          if (countryCode === hoveredCountryCode) return 0.017
          return showClimateLayer ? 0.002 : 0.006
        }}
        polygonCapCurvatureResolution={quality === 'balanced' ? 2 : 4}
        polygonsTransitionDuration={reducedMotion ? 0 : 260}
        pointsData={pointMarkers}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.018}
        pointRadius={(value) => {
          if (getClimateMarker(value)) return 0.54
          const waterbodyMarker = getWaterbodyMarker(value)
          if (waterbodyMarker) {
            if (waterbodyMarker.waterbodyId === selectedWaterbodyId) return 0.62
            if (waterbodyMarker.waterbodyId === hoveredWaterbodyId) return 0.54
            return waterbodyMarker.layer === 'ocean'
              ? 0.4
              : waterbodyMarker.layer === 'lake'
                ? 0.36
                : 0.34
          }
          const landmarkMarker = getLandmarkMarker(value)
          if (landmarkMarker?.landmarkId === selectedLandmarkId) return 0.6
          if (landmarkMarker?.landmarkId === hoveredLandmarkId) return 0.52
          if (landmarkMarker) return 0.36
          const marker = getCityMarker(value)
          if (marker?.cityId === selectedCityId) return 0.58
          if (marker?.cityId === hoveredCityId) return 0.5
          if (!marker?.isCapital) return 0.3
          return marker.countryCode === selectedCountryCode ? 0.46 : 0.34
        }}
        pointColor={(value) => {
          if (getClimateMarker(value)) return '#ffffff'
          const waterbodyMarker = getWaterbodyMarker(value)
          if (waterbodyMarker) {
            if (waterbodyMarker.waterbodyId === selectedWaterbodyId)
              return '#ffffff'
            if (waterbodyMarker.waterbodyId === hoveredWaterbodyId)
              return waterbodyMarker.layer === 'lake' ? '#b9ffec' : '#d9bcff'
            return waterbodyMarker.layer === 'ocean'
              ? '#31e4ff'
              : waterbodyMarker.layer === 'lake'
                ? '#53e6bd'
                : '#aa7cff'
          }
          const landmarkMarker = getLandmarkMarker(value)
          if (landmarkMarker?.landmarkId === selectedLandmarkId)
            return '#ffffff'
          if (landmarkMarker?.landmarkId === hoveredLandmarkId) return '#fff1bd'
          if (landmarkMarker) return '#ffc85c'
          const marker = getCityMarker(value)
          if (marker?.cityId === selectedCityId) return '#ffffff'
          if (marker?.cityId === hoveredCityId) return '#b8f5ff'
          if (!marker?.isCapital) return '#4dcfff'
          if (marker.countryCode === selectedCountryCode) return '#ffd85e'
          return '#f5cf62'
        }}
        pointResolution={quality === 'balanced' ? 16 : 8}
        pointsTransitionDuration={reducedMotion ? 0 : 220}
        pathsData={pathData}
        pathPoints="points"
        pathPointLat={getGeographicPathPointLatitude}
        pathPointLng={getGeographicPathPointLongitude}
        pathPointAlt={getGeographicPathPointAltitude}
        pathColor="color"
        pathStroke="stroke"
        pathDashLength="dashLength"
        pathDashGap="dashGap"
        pathTransitionDuration={0}
        onGlobeReady={() => {
          globeReadyRef.current = true
          syncPointOfView()
          cacheLabelWorldPositions()
          reconcileLabelLayout()
          layoutSelectedLinearFeatureOverlay()
          layoutSelectedMountainPeak()
          applyCameraTargetRequest()
        }}
        onHover={(layer, value) => {
          if (controlsInteractingRef.current) return
          const waterbodyId = getWaterbodyIdForLayer(layer, value)
          onHoverWaterbody(waterbodyId)
          const linearFeatureId = getLinearFeatureIdForLayer(layer, value)
          onHoverLinearFeature(linearFeatureId)
          const mountainRangeId = getMountainRangeIdForLayer(layer, value)
          onHoverMountainRange(mountainRangeId)
          const desertId = getDesertIdForLayer(layer, value)
          onHoverDesert(desertId)
          const landmarkId = getLandmarkIdForLayer(layer, value)
          onHoverLandmark(landmarkId)
          const referenceLineId = getReferenceLineIdForLayer(layer, value)
          const canvas = canvasElementRef.current
          if (canvas) {
            canvas.style.cursor = getGeographyCanvasCursor(referenceLineId)
          }
          const cityId = getCityIdForLayer(layer, value)
          onHoverCity(cityId)
          onHoverCountry(
            cityId ||
              waterbodyId ||
              linearFeatureId ||
              mountainRangeId ||
              desertId ||
              landmarkId ||
              referenceLineId
              ? null
              : getCountryCodeForLayer(layer, value),
          )
        }}
        onClick={(layer, value, event) => {
          const waterbodyId = getWaterbodyIdForLayer(layer, value)
          if (waterbodyId) {
            onSelectWaterbody(waterbodyId)
            return
          }
          const linearFeatureId = getLinearFeatureIdForLayer(layer, value)
          if (linearFeatureId) {
            onSelectLinearFeature(linearFeatureId)
            return
          }
          const mountainRangeId = getMountainRangeIdForLayer(layer, value)
          if (mountainRangeId) {
            onSelectMountainRange(mountainRangeId)
            return
          }
          const desertId = getDesertIdForLayer(layer, value)
          if (desertId) {
            onSelectDesert(desertId)
            return
          }
          const landmarkId = getLandmarkIdForLayer(layer, value)
          if (landmarkId) {
            onSelectLandmark(landmarkId)
            return
          }
          const referenceLineId = getReferenceLineIdForLayer(layer, value)
          const referenceLine = getReferenceLine(referenceLineId)
          if (referenceLine) {
            if (suppressGeographyClickRef.current) {
              suppressGeographyClickRef.current = false
              return
            }
            onSelectGeographyTopic(referenceLine.topicId, referenceLine.id)
            return
          }
          const cityId = getCityIdForLayer(layer, value)
          if (cityId) {
            onSelectCity(cityId)
            return
          }
          if (showClimateLayer) {
            const point = getGlobeClickPoint(event)
            if (point) {
              const coordinate = globeRef.current?.toGeoCoords(point)
              if (coordinate) {
                onSelectClimatePosition({
                  latitude: coordinate.lat,
                  longitude: coordinate.lng,
                })
                return
              }
            }
          }
          const countryCode = getCountryCodeForLayer(layer, value)
          if (countryCode) onSelectCountry(countryCode)
        }}
      />

      <GlobeCameraControls
        controlsRef={controlsRef}
        autoRotate={autoRotate}
        onInteractionStart={onControlsInteractionStart}
        onInteractionChange={() => {
          syncPointOfView()
          labelLayoutPendingRef.current = true
          scheduleViewChange()
        }}
        onInteractionEnd={() => {
          onControlsInteractionEnd()
          commitView()
        }}
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

export function GlobeScene({
  geometry,
  view,
  layers,
  climate,
  selection,
  hover,
  events,
}: GlobeSceneProps) {
  const props = useMemo<GlobeWorldProps>(
    () => ({
      ...geometry,
      ...view,
      ...layers,
      ...climate,
      ...selection,
      ...hover,
      ...events,
    }),
    [climate, events, geometry, hover, layers, selection, view],
  )
  const {
    onHoverCity,
    onHoverCountry,
    onHoverLinearFeature,
    onHoverMountainRange,
    onHoverWaterbody,
    onHoverDesert,
    onHoverLandmark,
  } = props
  const labelLayerRef = useRef<HTMLDivElement>(null)
  const controlsInteractingRef = useRef(false)
  const [controlsInteracting, setControlsInteracting] = useState(false)
  const selectedLinearFeatureOverlayRef = useRef<SVGSVGElement>(null)
  const selectedMountainPeakRef = useRef<HTMLButtonElement>(null)
  const clearHoveredEntities = useCallback(() => {
    onHoverCountry(null)
    onHoverCity(null)
    onHoverWaterbody(null)
    onHoverLinearFeature(null)
    onHoverMountainRange(null)
    onHoverDesert(null)
    onHoverLandmark(null)
  }, [
    onHoverCity,
    onHoverCountry,
    onHoverLinearFeature,
    onHoverMountainRange,
    onHoverWaterbody,
    onHoverDesert,
    onHoverLandmark,
  ])
  const beginControlsInteraction = useCallback(() => {
    if (controlsInteractingRef.current) return
    controlsInteractingRef.current = true
    setControlsInteracting(true)
    clearHoveredEntities()
  }, [clearHoveredEntities])
  const endControlsInteraction = useCallback(() => {
    if (!controlsInteractingRef.current) return
    controlsInteractingRef.current = false
    setControlsInteracting(false)
  }, [])
  const labelData = useGlobeLabelData(props)

  return (
    <GlobeDomOverlay
      worldProps={props}
      labels={labelData}
      controlsInteracting={controlsInteracting}
      controlsInteractingRef={controlsInteractingRef}
      labelLayerRef={labelLayerRef}
      selectedLinearFeatureOverlayRef={selectedLinearFeatureOverlayRef}
      selectedMountainPeakRef={selectedMountainPeakRef}
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
          labelItems={labelData.labelItems}
          labelLayerRef={labelLayerRef}
          controlsInteractingRef={controlsInteractingRef}
          onControlsInteractionStart={beginControlsInteraction}
          onControlsInteractionEnd={endControlsInteraction}
          selectedLinearFeatureOverlayRef={selectedLinearFeatureOverlayRef}
          selectedMountainPeakRef={selectedMountainPeakRef}
        />
      </Canvas>
    </GlobeDomOverlay>
  )
}
