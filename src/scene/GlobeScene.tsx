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
import {
  getWaterbody,
  getWaterbodyGeometry,
  waterbodies,
  waterbodyKindLabels,
} from '../data/waterbodies'
import type { City } from '../data/citySchema'
import {
  getLinearGeoFeature,
  getLinearGeoFeatureGeometry,
  linearGeoFeatureKindLabels,
  linearGeoFeatures,
} from '../data/linearGeoFeatures'
import type { LinearGeoFeature } from '../data/linearGeoFeatureSchema'
import {
  getMountainRange,
  getMountainRangeGeometry,
  mountainRanges,
} from '../data/mountainRanges'
import type { MountainRange } from '../data/mountainRangeSchema'
import type { Waterbody } from '../data/waterbodySchema'
import type { CameraTarget, GlobeView } from '../shared/types/geo'
import {
  getBoundaryCode,
  getCameraFlightDuration,
  getCityLabelBudget,
  getCityIdForLayer,
  getCityMarker,
  getCountryCodeForLayer,
  getGlobeViewOffset,
  getLinearFeatureIdForLayer,
  getOverviewCameraPosition,
  getVisibleLayerCities,
  getVisibleLayerWaterbodies,
  getVisibleLinearFeatures,
  getWaterbodyIdForLayer,
  getWaterbodyMarker,
  OVERVIEW_CAMERA_DISTANCE,
  shouldApplyCameraTargetRequest,
  type CityMarker,
  type GlobePointMarker,
  type WaterbodyMarker,
} from './countrySceneInteraction'
import {
  getLinearFeatureEndpointPairs,
  getLinearFeatureGeometryForScene,
  getSelectedLinearFeatureLabelOffset,
} from './linearFeatureSceneInteraction'
import {
  getMountainGeometryForScene,
  getMountainRangeIdForLayer,
  getVisibleMountainRanges,
} from './mountainSceneInteraction'

export type GlobeSceneProps = {
  autoRotate: boolean
  cameraTarget: CameraTarget
  quality: 'balanced' | 'low'
  reducedMotion: boolean
  showCapitals: boolean
  showCities: boolean
  showOceanLayer: boolean
  showWaterwayLayer: boolean
  showRiverLayer: boolean
  showCanalLayer: boolean
  showMountainLayer: boolean
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
  onViewCenterChange: (view: GlobeView) => void
  onViewCenterCommit: (view: GlobeView) => void
}

type WorldProps = GlobeSceneProps & {
  labelItems: MapLabel[]
  labelLayerRef: RefObject<HTMLDivElement | null>
  selectedLinearFeatureOverlayRef: RefObject<SVGSVGElement | null>
  selectedMountainPeakRef: RefObject<HTMLButtonElement | null>
}

type MapLabel =
  | {
      id: string
      type: 'city'
      latitude: number
      longitude: number
      city: City
    }
  | {
      id: string
      type: 'waterbody'
      latitude: number
      longitude: number
      waterbody: Waterbody
    }
  | {
      id: string
      type: 'linearFeature'
      latitude: number
      longitude: number
      feature: LinearGeoFeature
    }
  | {
      id: string
      type: 'mountainRange'
      latitude: number
      longitude: number
      range: MountainRange
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

type LabelGroup =
  'capital' | 'city' | 'ocean' | 'waterway' | 'river' | 'canal' | 'mountain'

function getLabelGroup(item: MapLabel): LabelGroup {
  if (item.type === 'city') return item.city.isCapital ? 'capital' : 'city'
  if (item.type === 'waterbody') return item.waterbody.layer
  if (item.type === 'linearFeature') return item.feature.kind
  return 'mountain'
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
  item: MapLabel,
  selectedCityId: string | null,
  hoveredCityId: string | null,
  selectedWaterbodyId: string | null,
  hoveredWaterbodyId: string | null,
  selectedLinearFeatureId: string | null,
  hoveredLinearFeatureId: string | null,
  selectedMountainRangeId: string | null,
  hoveredMountainRangeId: string | null,
) {
  if (
    item.id === selectedCityId ||
    item.id === selectedWaterbodyId ||
    item.id === selectedLinearFeatureId ||
    item.id === selectedMountainRangeId
  )
    return 0
  if (
    item.id === hoveredCityId ||
    item.id === hoveredWaterbodyId ||
    item.id === hoveredLinearFeatureId ||
    item.id === hoveredMountainRangeId
  )
    return 1
  if (item.type === 'waterbody') return 2 + item.waterbody.labelPriority / 100
  if (item.type === 'linearFeature')
    return 2.5 + item.feature.labelPriority / 100
  if (item.type === 'mountainRange') return 2.7 + item.range.labelPriority / 100
  return (item.city.isCapital ? 3 : 10) + item.city.order / 10
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
  selectedWaterbodyId,
  hoveredWaterbodyId,
  selectedLinearFeatureId,
  hoveredLinearFeatureId,
  selectedMountainRangeId,
  hoveredMountainRangeId,
  showRiverLayer,
  showCanalLayer,
  showMountainLayer,
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
  onViewCenterChange,
  onViewCenterCommit,
  labelItems,
  labelLayerRef,
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
  const pointMarkers = useMemo<GlobePointMarker[]>(() => {
    return labelItems
      .map((item) =>
        item.type === 'city'
          ? ({
              markerType: 'city',
              cityId: item.city.id,
              countryCode: item.city.countryCode,
              lat: item.city.latitude,
              lng: item.city.longitude,
              name: item.city.name.zh,
              isCapital: item.city.isCapital,
            } satisfies CityMarker)
          : item.type === 'waterbody'
            ? ({
                markerType: 'waterbody',
                waterbodyId: item.waterbody.id,
                layer: item.waterbody.layer,
                kind: item.waterbody.kind,
                lat: item.waterbody.center.latitude,
                lng: item.waterbody.center.longitude,
                name: item.waterbody.name.zh,
              } satisfies WaterbodyMarker)
            : null,
      )
      .filter((marker): marker is GlobePointMarker => marker !== null)
  }, [labelItems])
  const selectedWaterbodyGeometry = getWaterbodyGeometry(selectedWaterbodyId)
  const selectedSurfaceFeature = useMemo(
    () =>
      selectedWaterbodyGeometry?.kind === 'surface'
        ? {
            type: 'Feature' as const,
            properties: { waterbodyId: selectedWaterbodyGeometry.id },
            geometry:
              quality === 'low'
                ? selectedWaterbodyGeometry.lowDetailGeometry
                : selectedWaterbodyGeometry.geometry,
          }
        : null,
    [quality, selectedWaterbodyGeometry],
  )
  const selectedTrenchPath =
    selectedWaterbodyGeometry?.kind === 'trench'
      ? {
          waterbodyId: selectedWaterbodyGeometry.id,
          points:
            quality === 'low'
              ? selectedWaterbodyGeometry.lowDetailPoints
              : selectedWaterbodyGeometry.points,
        }
      : null
  const selectedLinearFeature = getLinearGeoFeature(selectedLinearFeatureId)
  const selectedMountainRange = getMountainRange(selectedMountainRangeId)
  const selectedLinearFeatureGeometry = useMemo(() => {
    if (selectedLinearFeature) {
      const geometry = getLinearGeoFeatureGeometry(selectedLinearFeature.id)
      return geometry
        ? getLinearFeatureGeometryForScene(geometry, quality, true)
        : null
    }
    if (selectedMountainRange) {
      const geometry = getMountainRangeGeometry(selectedMountainRange.id)
      return geometry
        ? getMountainGeometryForScene(geometry, quality, true)
        : null
    }
    return null
  }, [quality, selectedLinearFeature, selectedMountainRange])
  const visibleLinearFeatures = getVisibleLinearFeatures(linearGeoFeatures, {
    showRiverLayer,
    showCanalLayer,
    selectedLinearFeatureId,
    hoveredLinearFeatureId,
  })
  const linearPaths = visibleLinearFeatures.flatMap((feature) => {
    const geometry = getLinearGeoFeatureGeometry(feature.id)
    if (!geometry) return []
    const lines = getLinearFeatureGeometryForScene(
      geometry,
      quality,
      feature.id === selectedLinearFeatureId,
    ).coordinates
    return lines.map((points, segmentIndex) => ({
      linearFeatureId: feature.id,
      kind: feature.kind,
      segmentIndex,
      selected: feature.id === selectedLinearFeatureId,
      hovered: feature.id === hoveredLinearFeatureId,
      points: points.map(([longitude, latitude]) => [latitude, longitude]),
    }))
  })
  const visibleMountains = getVisibleMountainRanges(mountainRanges, {
    showMountainLayer,
    selectedMountainRangeId,
    hoveredMountainRangeId,
  })
  const mountainPaths = visibleMountains.flatMap((range) => {
    const geometry = getMountainRangeGeometry(range.id)
    if (!geometry) return []
    const lines = getMountainGeometryForScene(
      geometry,
      quality,
      range.id === selectedMountainRangeId,
    ).coordinates
    return lines.map((points, segmentIndex) => ({
      mountainRangeId: range.id,
      kind: 'mountain' as const,
      segmentIndex,
      selected: range.id === selectedMountainRangeId,
      hovered: range.id === hoveredMountainRangeId,
      points: points.map(([longitude, latitude]) => [latitude, longitude]),
    }))
  })
  const pathData = [
    ...(selectedTrenchPath
      ? [{ ...selectedTrenchPath, kind: 'trench' as const }]
      : []),
    ...linearPaths,
    ...mountainPaths,
  ]
  const polygonsData = useMemo(
    () =>
      selectedSurfaceFeature
        ? [...countryBoundaries.features, selectedSurfaceFeature]
        : countryBoundaries.features,
    [selectedSurfaceFeature],
  )

  const syncPointOfView = useCallback(() => {
    globeRef.current?.setPointOfView(camera)
  }, [camera])

  const projectSelectedLinearFeaturePoint = useCallback(
    ([longitude, latitude]: readonly [number, number]) => {
      const globe = globeRef.current
      if (!globe) return null
      const coordinate = globe.getCoords(latitude, longitude, 0.055)
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
    [camera, size.height, size.width],
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

    const sortedItems = [...labelItems].sort(
      (left, right) =>
        getLabelPriority(
          left,
          selectedCityId,
          hoveredCityId,
          selectedWaterbodyId,
          hoveredWaterbodyId,
          selectedLinearFeatureId,
          hoveredLinearFeatureId,
          selectedMountainRangeId,
          hoveredMountainRangeId,
        ) -
        getLabelPriority(
          right,
          selectedCityId,
          hoveredCityId,
          selectedWaterbodyId,
          hoveredWaterbodyId,
          selectedLinearFeatureId,
          hoveredLinearFeatureId,
          selectedMountainRangeId,
          hoveredMountainRangeId,
        ),
    )
    const groupCount: Record<LabelGroup, number> = {
      capital: 0,
      city: 0,
      ocean: 0,
      waterway: 0,
      river: 0,
      canal: 0,
      mountain: 0,
    }
    const activeGroups = new Set(labelItems.map(getLabelGroup)).size
    const ordinaryGroupLimit = Math.ceil(budget / Math.max(activeGroups, 1))

    for (const item of sortedItems) {
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
        item.id === hoveredMountainRangeId
      const labelGroup = getLabelGroup(item)
      if (!forced && groupCount[labelGroup] >= ordinaryGroupLimit) continue

      const coordinate = globe.getCoords(item.latitude, item.longitude, 0.04)
      const worldPosition = new Vector3(
        coordinate.x,
        coordinate.y,
        coordinate.z,
      )
      if (worldPosition.dot(camera.position) <= globeRadius ** 2) continue

      const screenPosition = worldPosition.clone().project(camera)
      let x = (screenPosition.x * 0.5 + 0.5) * size.width
      let y = (-screenPosition.y * 0.5 + 0.5) * size.height
      if (x < 12 || x > size.width - 12 || y < 12 || y > size.height - 12) {
        continue
      }

      const labelName =
        item.type === 'city'
          ? item.city.name.zh
          : item.type === 'waterbody'
            ? item.waterbody.name.zh
            : item.type === 'linearFeature'
              ? item.feature.name.zh
              : item.range.name.zh
      const width = Math.max(56, labelName.length * 14 + 28)
      const height = 28
      if (
        (item.type === 'linearFeature' &&
          item.id === selectedLinearFeatureId) ||
        (item.type === 'mountainRange' && item.id === selectedMountainRangeId)
      ) {
        const projectedRoute = getProjectedSelectedLinearFeatureLines()
          .flat()
          .filter((point) => point.visible)
        const offset = getSelectedLinearFeatureLabelOffset(projectedRoute)
        x = Math.max(
          width / 2 + 12,
          Math.min(size.width - width / 2 - 12, x + offset.x),
        )
        y = Math.max(
          height / 2 + 12,
          Math.min(size.height - height / 2 - 12, y + offset.y),
        )
        if (
          projectedPeak?.visible &&
          Math.hypot(x - projectedPeak.x, y - projectedPeak.y) < 64
        ) {
          y = Math.max(height / 2 + 12, y - 48)
        }
      }
      const rect = {
        left: x - width / 2 - 5,
        top: y - height / 2 - 5,
        right: x + width / 2 + 5,
        bottom: y + height / 2 + 5,
      }
      if (
        !forced &&
        acceptedRects.some((accepted) => overlaps(rect, accepted))
      ) {
        continue
      }

      element.hidden = false
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      nextVisibleIds.add(item.id)
      acceptedRects.push(rect)
      visibleCount += 1
      groupCount[labelGroup] += 1
    }
    visibleLabelIdsRef.current = nextVisibleIds
  }, [
    camera,
    getProjectedSelectedLinearFeatureLines,
    hoveredCityId,
    hoveredWaterbodyId,
    hoveredLinearFeatureId,
    hoveredMountainRangeId,
    labelItems,
    quality,
    projectSelectedMountainPeak,
    selectedCityId,
    selectedWaterbodyId,
    selectedLinearFeatureId,
    selectedMountainRangeId,
    size.height,
    size.width,
  ])

  useEffect(() => {
    const labelLayer = labelLayerRef.current
    if (!labelLayer) return
    labelElementsRef.current = new Map(
      [...labelLayer.querySelectorAll<HTMLElement>('[data-map-label-id]')].map(
        (element) => [element.dataset.mapLabelId ?? '', element],
      ),
    )
    visibleLabelIdsRef.current.clear()
    layoutCityLabels()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()
  }, [
    labelItems,
    labelLayerRef,
    layoutCityLabels,
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
    layoutCityLabels()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()

    return () => {
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
    }
  }, [
    camera,
    layoutCityLabels,
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
    layoutCityLabels()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()
    const view = getView()
    if (!view) return
    onViewCenterChange(view)
    onViewCenterCommit(view)
  }, [
    getView,
    layoutCityLabels,
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

    if (autoRotate || labelLayoutPendingRef.current) {
      labelLayoutPendingRef.current = false
      layoutCityLabels()
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
    layoutCityLabels()
    layoutSelectedLinearFeatureOverlay()
    layoutSelectedMountainPeak()
  }, [
    layoutCityLabels,
    layoutSelectedLinearFeatureOverlay,
    layoutSelectedMountainPeak,
  ])

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
        polygonsData={polygonsData}
        polygonGeoJsonGeometry="geometry"
        polygonCapColor={(value) => {
          if (getWaterbodyIdForLayer('polygon', value)) return '#24d4ff55'
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return '#f2c75c'
          if (countryCode === hoveredCountryCode) return '#68d7ff'
          return '#176593'
        }}
        polygonSideColor={(value) =>
          getWaterbodyIdForLayer('polygon', value)
            ? '#086e8f44'
            : getBoundaryCode(value) === selectedCountryCode
              ? '#b88927'
              : '#0a3552'
        }
        polygonStrokeColor={(value) => {
          if (getWaterbodyIdForLayer('polygon', value)) return '#83ecff'
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return '#fff1a8'
          if (countryCode === hoveredCountryCode) return '#d8f7ff'
          return '#6cb4d4'
        }}
        polygonAltitude={(value) => {
          if (getWaterbodyIdForLayer('polygon', value)) return 0.034
          const countryCode = getBoundaryCode(value)
          if (countryCode === selectedCountryCode) return 0.027
          if (countryCode === hoveredCountryCode) return 0.017
          return 0.006
        }}
        polygonCapCurvatureResolution={quality === 'balanced' ? 2 : 4}
        polygonsTransitionDuration={reducedMotion ? 0 : 260}
        pointsData={pointMarkers}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.018}
        pointRadius={(value) => {
          const waterbodyMarker = getWaterbodyMarker(value)
          if (waterbodyMarker) {
            if (waterbodyMarker.waterbodyId === selectedWaterbodyId) return 0.62
            if (waterbodyMarker.waterbodyId === hoveredWaterbodyId) return 0.54
            return waterbodyMarker.layer === 'ocean' ? 0.4 : 0.34
          }
          const marker = getCityMarker(value)
          if (marker?.cityId === selectedCityId) return 0.58
          if (marker?.cityId === hoveredCityId) return 0.5
          if (!marker?.isCapital) return 0.3
          return marker.countryCode === selectedCountryCode ? 0.46 : 0.34
        }}
        pointColor={(value) => {
          const waterbodyMarker = getWaterbodyMarker(value)
          if (waterbodyMarker) {
            if (waterbodyMarker.waterbodyId === selectedWaterbodyId)
              return '#ffffff'
            if (waterbodyMarker.waterbodyId === hoveredWaterbodyId)
              return '#d9bcff'
            return waterbodyMarker.layer === 'ocean' ? '#31e4ff' : '#aa7cff'
          }
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
        pathPointLat={0}
        pathPointLng={1}
        pathPointAlt={(value: object) => {
          const path = value as { kind?: string; selected?: boolean }
          if (path.kind === 'mountain' && path.selected) return 0.066
          if (path.selected) return 0.055
          if (path.kind === 'mountain') return 0.05
          if (path.kind === 'river') return 0.043
          return 0.035
        }}
        pathColor={(value: object) => {
          const path = value as {
            kind?: string
            selected?: boolean
            hovered?: boolean
          }
          if (path.kind === 'canal' && path.selected) return '#ffd66b'
          if (path.selected) return '#ffffff'
          if (path.kind === 'mountain')
            return path.hovered ? '#ffe8ae' : '#d99b52'
          if (path.kind === 'canal') return path.hovered ? '#ffe9a5' : '#f7bf4f'
          if (path.kind === 'river') return path.hovered ? '#d7fcff' : '#49e8f6'
          return '#c493ff'
        }}
        pathStroke={(value: object) => {
          const path = value as {
            kind?: string
            selected?: boolean
            hovered?: boolean
          }
          if (path.selected) return quality === 'balanced' ? 0.34 : 0.24
          if (path.hovered) return quality === 'balanced' ? 0.24 : 0.18
          if (path.kind === 'mountain')
            return quality === 'balanced' ? 0.2 : 0.14
          if (path.kind === 'canal') return quality === 'balanced' ? 0.12 : 0.08
          if (path.kind === 'river') return quality === 'balanced' ? 0.2 : 0.14
          return quality === 'balanced' ? 0.14 : 0.09
        }}
        pathDashLength={(value: object) =>
          (value as { kind?: string }).kind === 'canal' ? 0.1 : 1
        }
        pathDashGap={(value: object) =>
          (value as { kind?: string }).kind === 'canal' ? 0.06 : 0
        }
        pathTransitionDuration={reducedMotion ? 0 : 220}
        onGlobeReady={() => {
          globeReadyRef.current = true
          syncPointOfView()
          layoutCityLabels()
          layoutSelectedLinearFeatureOverlay()
          layoutSelectedMountainPeak()
          applyCameraTargetRequest()
        }}
        onHover={(layer, value) => {
          const waterbodyId = getWaterbodyIdForLayer(layer, value)
          onHoverWaterbody(waterbodyId)
          const linearFeatureId = getLinearFeatureIdForLayer(layer, value)
          onHoverLinearFeature(linearFeatureId)
          const mountainRangeId = getMountainRangeIdForLayer(layer, value)
          onHoverMountainRange(mountainRangeId)
          const cityId = getCityIdForLayer(layer, value)
          onHoverCity(cityId)
          onHoverCountry(
            cityId || waterbodyId || linearFeatureId || mountainRangeId
              ? null
              : getCountryCodeForLayer(layer, value),
          )
        }}
        onClick={(layer, value) => {
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
  const selectedLinearFeatureOverlayRef = useRef<SVGSVGElement>(null)
  const selectedMountainPeakRef = useRef<HTMLButtonElement>(null)
  const hoveredCountry = getCountry(props.hoveredCountryCode)
  const hoveredCity = getCity(props.hoveredCityId)
  const hoveredWaterbody = getWaterbody(props.hoveredWaterbodyId)
  const hoveredLinearFeature = getLinearGeoFeature(props.hoveredLinearFeatureId)
  const hoveredMountainRange = getMountainRange(props.hoveredMountainRangeId)
  const selectedLinearFeature = getLinearGeoFeature(
    props.selectedLinearFeatureId,
  )
  const selectedMountainRange = getMountainRange(props.selectedMountainRangeId)
  const selectedLinearFeatureStemCount = selectedLinearFeature
    ? (getLinearGeoFeatureGeometry(selectedLinearFeature.id)?.geometry
        .coordinates.length ?? 0)
    : 0
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
  const labelWaterbodies = useMemo(
    () =>
      getVisibleLayerWaterbodies(waterbodies, {
        showOceanLayer: props.showOceanLayer,
        showWaterwayLayer: props.showWaterwayLayer,
        selectedWaterbodyId: props.selectedWaterbodyId,
        hoveredWaterbodyId: props.hoveredWaterbodyId,
      }),
    [
      props.hoveredWaterbodyId,
      props.selectedWaterbodyId,
      props.showOceanLayer,
      props.showWaterwayLayer,
    ],
  )
  const labelLinearFeatures = useMemo(
    () =>
      getVisibleLinearFeatures(linearGeoFeatures, {
        showRiverLayer: props.showRiverLayer,
        showCanalLayer: props.showCanalLayer,
        selectedLinearFeatureId: props.selectedLinearFeatureId,
        hoveredLinearFeatureId: props.hoveredLinearFeatureId,
      }),
    [
      props.hoveredLinearFeatureId,
      props.selectedLinearFeatureId,
      props.showCanalLayer,
      props.showRiverLayer,
    ],
  )
  const labelMountainRanges = useMemo(
    () =>
      getVisibleMountainRanges(mountainRanges, {
        showMountainLayer: props.showMountainLayer,
        selectedMountainRangeId: props.selectedMountainRangeId,
        hoveredMountainRangeId: props.hoveredMountainRangeId,
      }),
    [
      props.hoveredMountainRangeId,
      props.selectedMountainRangeId,
      props.showMountainLayer,
    ],
  )
  const labelItems = useMemo<MapLabel[]>(
    () => [
      ...labelCities.map((city) => ({
        id: city.id,
        type: 'city' as const,
        latitude: city.latitude,
        longitude: city.longitude,
        city,
      })),
      ...labelWaterbodies.map((waterbody) => ({
        id: waterbody.id,
        type: 'waterbody' as const,
        latitude: waterbody.center.latitude,
        longitude: waterbody.center.longitude,
        waterbody,
      })),
      ...labelLinearFeatures.map((feature) => ({
        id: feature.id,
        type: 'linearFeature' as const,
        latitude: feature.labelPosition.latitude,
        longitude: feature.labelPosition.longitude,
        feature,
      })),
      ...labelMountainRanges.map((range) => ({
        id: range.id,
        type: 'mountainRange' as const,
        latitude: range.labelPosition.latitude,
        longitude: range.labelPosition.longitude,
        range,
      })),
    ],
    [labelCities, labelLinearFeatures, labelMountainRanges, labelWaterbodies],
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
        props.onHoverWaterbody(null)
        props.onHoverLinearFeature(null)
        props.onHoverMountainRange(null)
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
          labelItems={labelItems}
          labelLayerRef={labelLayerRef}
          selectedLinearFeatureOverlayRef={selectedLinearFeatureOverlayRef}
          selectedMountainPeakRef={selectedMountainPeakRef}
        />
      </Canvas>
      {selectedLinearFeature || selectedMountainRange ? (
        <svg
          ref={selectedLinearFeatureOverlayRef}
          className={`selected-linear-feature-overlay is-${selectedLinearFeature?.kind ?? 'mountain'}`}
          data-testid={
            selectedLinearFeature
              ? 'selected-linear-feature-overlay'
              : 'selected-mountain-overlay'
          }
          data-linear-feature-id={selectedLinearFeature?.id}
          data-mountain-range-id={selectedMountainRange?.id}
          data-linear-detail={selectedLinearFeature ? 'high' : undefined}
          data-mountain-detail={selectedMountainRange ? 'high' : undefined}
          style={{ display: 'none' }}
          aria-hidden="true"
        >
          <path
            className="selected-linear-feature-route-outer"
            data-testid={
              selectedLinearFeature
                ? 'selected-linear-feature-route'
                : 'selected-mountain-route'
            }
            data-linear-route-layer="outer"
          />
          <path
            className="selected-linear-feature-route-core"
            data-linear-route-layer="core"
          />
          {selectedLinearFeature
            ? Array.from(
                { length: selectedLinearFeatureStemCount },
                (_, index) => (
                  <g key={index} data-linear-endpoint-pair={index}>
                    <circle
                      className="selected-linear-feature-endpoint is-start"
                      data-testid="selected-linear-feature-start"
                      data-linear-endpoint="start"
                      r="6"
                    />
                    <polygon
                      className="selected-linear-feature-endpoint is-end"
                      data-testid="selected-linear-feature-end"
                      data-linear-endpoint="end"
                    />
                  </g>
                ),
              )
            : null}
        </svg>
      ) : null}
      {selectedMountainRange ? (
        <button
          ref={selectedMountainPeakRef}
          type="button"
          hidden
          className="mountain-peak-marker"
          data-testid="selected-mountain-peak"
          data-mountain-range-id={selectedMountainRange.id}
          aria-label={`${selectedMountainRange.highestPeak.name.zh}，海拔${selectedMountainRange.highestPeak.elevationMeters}米`}
          onClick={() => props.onSelectMountainRange(selectedMountainRange.id)}
        >
          <span className="mountain-peak-marker-shape" aria-hidden="true" />
          <span className="mountain-peak-marker-tooltip">
            <strong>{selectedMountainRange.highestPeak.name.zh}</strong>
            <small>{selectedMountainRange.highestPeak.name.en}</small>
            <b>
              {selectedMountainRange.highestPeak.approximateElevation
                ? '约 '
                : ''}
              {selectedMountainRange.highestPeak.elevationMeters.toLocaleString(
                'zh-CN',
              )}{' '}
              m
            </b>
          </span>
        </button>
      ) : null}
      <div
        ref={labelLayerRef}
        className="globe-city-labels"
        aria-label="城市、水域与地理地点标签"
      >
        {labelCities.map((city) => (
          <button
            type="button"
            key={city.id}
            hidden
            className={city.isCapital ? 'city-label is-capital' : 'city-label'}
            data-map-label-id={city.id}
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
        {labelWaterbodies.map((waterbody) => (
          <button
            type="button"
            key={waterbody.id}
            hidden
            className={`city-label waterbody-label is-${waterbody.layer}`}
            data-map-label-id={waterbody.id}
            data-waterbody-id={waterbody.id}
            aria-label={`定位到${waterbody.name.zh}${waterbodyKindLabels[waterbody.kind]}`}
            onPointerEnter={() => props.onHoverWaterbody(waterbody.id)}
            onPointerLeave={() => props.onHoverWaterbody(null)}
            onClick={() => props.onSelectWaterbody(waterbody.id)}
          >
            <span aria-hidden="true" />
            {waterbody.name.zh}
          </button>
        ))}
        {labelLinearFeatures.map((feature) => (
          <button
            type="button"
            key={feature.id}
            hidden
            className={
              feature.id === props.selectedLinearFeatureId
                ? `city-label linear-feature-label is-${feature.kind} is-selected`
                : `city-label linear-feature-label is-${feature.kind}`
            }
            data-map-label-id={feature.id}
            data-linear-feature-id={feature.id}
            aria-label={`定位到${feature.name.zh}${linearGeoFeatureKindLabels[feature.kind]}`}
            onPointerEnter={() => props.onHoverLinearFeature(feature.id)}
            onPointerLeave={() => props.onHoverLinearFeature(null)}
            onClick={() => props.onSelectLinearFeature(feature.id)}
          >
            <span aria-hidden="true" />
            {feature.name.zh}
          </button>
        ))}
        {labelMountainRanges.map((range) => (
          <button
            type="button"
            key={range.id}
            hidden
            className={
              range.id === props.selectedMountainRangeId
                ? 'city-label mountain-range-label is-selected'
                : 'city-label mountain-range-label'
            }
            data-map-label-id={range.id}
            data-mountain-range-id={range.id}
            aria-label={`定位到${range.name.zh}`}
            onPointerEnter={() => props.onHoverMountainRange(range.id)}
            onPointerLeave={() => props.onHoverMountainRange(null)}
            onClick={() => props.onSelectMountainRange(range.id)}
          >
            <span aria-hidden="true" />
            {range.name.zh}
          </button>
        ))}
      </div>
      {hoveredMountainRange ||
      hoveredLinearFeature ||
      hoveredWaterbody ||
      hoveredCity ||
      hoveredCountry ? (
        <div ref={tooltipRef} className="country-hover-tooltip" role="tooltip">
          {hoveredMountainRange ? (
            <>
              <span>{hoveredMountainRange.name.zh}</span>
              <small>山脉 · {hoveredMountainRange.name.en}</small>
            </>
          ) : hoveredLinearFeature ? (
            <>
              <span>{hoveredLinearFeature.name.zh}</span>
              <small>
                {linearGeoFeatureKindLabels[hoveredLinearFeature.kind]}
              </small>
            </>
          ) : hoveredWaterbody ? (
            <>
              <span>{hoveredWaterbody.name.zh}</span>
              <small>{waterbodyKindLabels[hoveredWaterbody.kind]}</small>
            </>
          ) : hoveredCity ? (
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
