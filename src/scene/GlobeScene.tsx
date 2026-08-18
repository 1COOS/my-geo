import { OrbitControls, Stars } from '@react-three/drei'
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

import {
  cities,
  countryBoundaries,
  getCity,
  getCountry,
} from '../data/countries'
import { deserts, getDesert, getDesertGeometry } from '../data/deserts'
import type { ClimateTypeId } from '../data/climateLearningSchema'
import type { Desert } from '../data/desertSchema'
import {
  geographyReferenceLines,
  getReferenceLine,
} from '../data/geographyLearning'
import type {
  GeographyTopicId,
  ReferenceLine,
  ReferenceLineId,
} from '../data/geographyLearningSchema'
import { getLandmark, landmarks } from '../data/landmarks'
import type { Landmark } from '../data/landmarkSchema'
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
  getVisibleLayerCities,
  getVisibleLayerWaterbodies,
  getVisibleLinearFeatures,
  getWaterbodyIdForLayer,
  getWaterbodyLabelState,
  getWaterbodyMarker,
  getWaterbodyPolygonState,
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
  addGeographicPathAltitude,
  getGeographicPathAppearance,
  getGeographicPathPointAltitude,
  getGeographicPathPointLatitude,
  getGeographicPathPointLongitude,
} from './geographicPathStyle'
import {
  getMountainGeometryForScene,
  getMountainRangeIdForLayer,
  getVisibleMountainRanges,
} from './mountainSceneInteraction'
import {
  getLandmarkIdForLayer,
  getLandmarkLabelPriority,
  getLandmarkMarker,
  getVisibleLandmarks,
  type LandmarkMarker,
} from './landmarkSceneInteraction'
import {
  getDesertGeometryForScene,
  getDesertIdForLayer,
  getDesertPolygonState,
  getVisibleDeserts,
} from './desertSceneInteraction'
import {
  geographyCoordinateLabels,
  getGeographyReferencePaths,
  getReferenceLineIdForLayer,
} from './geographyLearningScene'

export type GlobeSceneProps = {
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

type WorldProps = GlobeSceneProps & {
  labelItems: MapLabel[]
  labelLayerRef: RefObject<HTMLDivElement | null>
  controlsInteractingRef: { current: boolean }
  onControlsInteractionStart: () => void
  onControlsInteractionEnd: () => void
  selectedLinearFeatureOverlayRef: RefObject<SVGSVGElement | null>
  selectedMountainPeakRef: RefObject<HTMLButtonElement | null>
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
  | {
      id: string
      type: 'desert'
      latitude: number
      longitude: number
      desert: Desert
    }
  | {
      id: string
      type: 'landmark'
      latitude: number
      longitude: number
      landmark: Landmark
    }
  | {
      id: string
      type: 'referenceLine'
      latitude: number
      longitude: number
      line: ReferenceLine
    }
  | {
      id: string
      type: 'coordinateLabel'
      latitude: number
      longitude: number
      label: string
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

type LabelRect = {
  left: number
  top: number
  right: number
  bottom: number
}

type LabelGroup =
  | 'capital'
  | 'city'
  | 'ocean'
  | 'lake'
  | 'waterway'
  | 'river'
  | 'canal'
  | 'mountain'
  | 'desert'
  | 'landmark'
  | 'geography'

function getLabelGroup(item: MapLabel): LabelGroup {
  if (item.type === 'city') return item.city.isCapital ? 'capital' : 'city'
  if (item.type === 'waterbody') return item.waterbody.layer
  if (item.type === 'linearFeature') return item.feature.kind
  if (item.type === 'mountainRange') return 'mountain'
  if (item.type === 'referenceLine' || item.type === 'coordinateLabel')
    return 'geography'
  return item.type
}

function getWaterbodyLayerForScene(value: object | undefined) {
  return getWaterbody(getWaterbodyIdForLayer('polygon', value))?.layer
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
  selectedDesertId: string | null,
  hoveredDesertId: string | null,
  selectedLandmarkId: string | null,
  hoveredLandmarkId: string | null,
  selectedReferenceLineId: ReferenceLineId | null,
) {
  if (item.type === 'referenceLine' && item.line.id === selectedReferenceLineId)
    return 0
  if (item.type === 'referenceLine')
    return item.line.category === 'latitude-zone-boundary' ? 4.5 : 1.4
  if (item.type === 'coordinateLabel') return 6
  if (item.type === 'landmark') {
    return getLandmarkLabelPriority(item.landmark, {
      selectedLandmarkId,
      hoveredLandmarkId,
    })
  }
  if (
    item.id === selectedCityId ||
    item.id === selectedWaterbodyId ||
    item.id === selectedLinearFeatureId ||
    item.id === selectedMountainRangeId ||
    item.id === selectedDesertId ||
    item.id === selectedLandmarkId
  )
    return 0
  if (
    item.id === hoveredCityId ||
    item.id === hoveredWaterbodyId ||
    item.id === hoveredLinearFeatureId ||
    item.id === hoveredMountainRangeId ||
    item.id === hoveredDesertId ||
    item.id === hoveredLandmarkId
  )
    return 1
  if (item.type === 'waterbody') return 2 + item.waterbody.labelPriority / 100
  if (item.type === 'linearFeature')
    return 2.5 + item.feature.labelPriority / 100
  if (item.type === 'mountainRange') return 2.7 + item.range.labelPriority / 100
  if (item.type === 'desert') return 2.8 + item.desert.labelPriority / 100
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
    const handlePointerMove = (event: PointerEvent) => {
      if (event.buttons !== 0) onControlsInteractionStart()
    }
    canvas.addEventListener('pointerdown', onControlsInteractionStart, true)
    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('pointerup', onControlsInteractionEnd, true)
    window.addEventListener('pointercancel', onControlsInteractionEnd, true)

    return () => {
      canvas.removeEventListener(
        'pointerdown',
        onControlsInteractionStart,
        true,
      )
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('pointerup', onControlsInteractionEnd, true)
      window.removeEventListener(
        'pointercancel',
        onControlsInteractionEnd,
        true,
      )
    }
  }, [gl, onControlsInteractionEnd, onControlsInteractionStart])
  const pointMarkers = useMemo<GlobePointMarker[]>(() => {
    const markers: GlobePointMarker[] = []
    for (const item of labelItems) {
      if (item.type === 'city') {
        markers.push({
          markerType: 'city',
          cityId: item.city.id,
          countryCode: item.city.countryCode,
          lat: item.city.latitude,
          lng: item.city.longitude,
          name: item.city.name.zh,
          isCapital: item.city.isCapital,
        } satisfies CityMarker)
      } else if (item.type === 'waterbody') {
        markers.push({
          markerType: 'waterbody',
          waterbodyId: item.waterbody.id,
          layer: item.waterbody.layer,
          kind: item.waterbody.kind,
          lat: item.waterbody.center.latitude,
          lng: item.waterbody.center.longitude,
          name: item.waterbody.name.zh,
        } satisfies WaterbodyMarker)
      } else if (item.type === 'landmark') {
        markers.push({
          markerType: 'landmark',
          landmarkId: item.landmark.id,
          lat: item.landmark.position.latitude,
          lng: item.landmark.position.longitude,
          name: item.landmark.name.zh,
        } satisfies LandmarkMarker)
      }
    }
    if (selectedClimatePosition) {
      markers.push({
        markerType: 'climate',
        lat: selectedClimatePosition.latitude,
        lng: selectedClimatePosition.longitude,
        name: '气候判读点',
      })
    }
    return markers
  }, [labelItems, selectedClimatePosition])
  const selectedWaterbody = getWaterbody(selectedWaterbodyId)
  const selectedWaterbodyGeometry = getWaterbodyGeometry(selectedWaterbodyId)
  const selectedSurfaceFeature = useMemo(
    () =>
      selectedWaterbody?.layer !== 'lake' &&
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
    [quality, selectedWaterbody, selectedWaterbodyGeometry],
  )
  const visibleLakeSurfaceFeatures = useMemo(
    () =>
      labelItems.flatMap((item) => {
        if (item.type !== 'waterbody' || item.waterbody.layer !== 'lake') {
          return []
        }
        const geometry = getWaterbodyGeometry(item.waterbody.id)
        return geometry?.kind === 'surface'
          ? [
              {
                type: 'Feature' as const,
                properties: { waterbodyId: geometry.id },
                geometry:
                  quality === 'low'
                    ? geometry.lowDetailGeometry
                    : geometry.geometry,
              },
            ]
          : []
      }),
    [labelItems, quality],
  )
  const selectedTrenchPath = useMemo(() => {
    if (selectedWaterbodyGeometry?.kind !== 'trench') return null
    const pathState = {
      waterbodyId: selectedWaterbodyGeometry.id,
      kind: 'trench' as const,
      selected: true,
    }
    const appearance = getGeographicPathAppearance(pathState, quality)
    const points =
      quality === 'low'
        ? selectedWaterbodyGeometry.lowDetailPoints
        : selectedWaterbodyGeometry.points
    return {
      ...pathState,
      ...appearance,
      points: addGeographicPathAltitude(points, appearance.altitude),
    }
  }, [quality, selectedWaterbodyGeometry])
  const visibleDesertFeatures = useMemo(
    () =>
      getVisibleDeserts(deserts, {
        showDesertLayer,
      }).flatMap((desert) => {
        const geometry = getDesertGeometry(desert.id)
        return geometry
          ? [
              {
                type: 'Feature' as const,
                properties: { desertId: desert.id },
                geometry: getDesertGeometryForScene(geometry, quality),
              },
            ]
          : []
      }),
    [quality, showDesertLayer],
  )
  const selectedLinearFeature = getLinearGeoFeature(selectedLinearFeatureId)
  const selectedMountainRange = getMountainRange(selectedMountainRangeId)
  const selectedPathKind =
    selectedLinearFeature?.kind ??
    (selectedMountainRange ? ('mountain' as const) : undefined)
  const selectedPathAltitude = getGeographicPathAppearance(
    { kind: selectedPathKind, selected: true },
    quality,
  ).altitude
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
  const visibleLinearFeatures = useMemo(
    () =>
      getVisibleLinearFeatures(linearGeoFeatures, {
        showRiverAndCanalLayer,
        selectedLinearFeatureId,
        hoveredLinearFeatureId,
      }),
    [hoveredLinearFeatureId, selectedLinearFeatureId, showRiverAndCanalLayer],
  )
  const linearPaths = useMemo(
    () =>
      visibleLinearFeatures.flatMap((feature) => {
        const geometry = getLinearGeoFeatureGeometry(feature.id)
        if (!geometry) return []
        const lines = getLinearFeatureGeometryForScene(
          geometry,
          quality,
          feature.id === selectedLinearFeatureId,
        ).coordinates
        return lines.map((points, segmentIndex) => {
          const pathState = {
            kind: feature.kind,
            selected: feature.id === selectedLinearFeatureId,
            hovered: feature.id === hoveredLinearFeatureId,
          }
          const appearance = getGeographicPathAppearance(pathState, quality)
          return {
            linearFeatureId: feature.id,
            ...pathState,
            ...appearance,
            segmentIndex,
            points: addGeographicPathAltitude(
              points.map(([longitude, latitude]) => [latitude, longitude]),
              appearance.altitude,
            ),
          }
        })
      }),
    [
      hoveredLinearFeatureId,
      quality,
      selectedLinearFeatureId,
      visibleLinearFeatures,
    ],
  )
  const visibleMountains = useMemo(
    () =>
      getVisibleMountainRanges(mountainRanges, {
        showMountainLayer,
        selectedMountainRangeId,
        hoveredMountainRangeId,
      }),
    [hoveredMountainRangeId, selectedMountainRangeId, showMountainLayer],
  )
  const mountainPaths = useMemo(
    () =>
      visibleMountains.flatMap((range) => {
        const geometry = getMountainRangeGeometry(range.id)
        if (!geometry) return []
        const lines = getMountainGeometryForScene(
          geometry,
          quality,
          range.id === selectedMountainRangeId,
        ).coordinates
        return lines.map((points, segmentIndex) => {
          const pathState = {
            kind: 'mountain' as const,
            selected: range.id === selectedMountainRangeId,
            hovered: range.id === hoveredMountainRangeId,
          }
          const appearance = getGeographicPathAppearance(pathState, quality)
          return {
            mountainRangeId: range.id,
            ...pathState,
            ...appearance,
            segmentIndex,
            points: addGeographicPathAltitude(
              points.map(([longitude, latitude]) => [latitude, longitude]),
              appearance.altitude,
            ),
          }
        })
      }),
    [
      hoveredMountainRangeId,
      quality,
      selectedMountainRangeId,
      visibleMountains,
    ],
  )
  const geographyReferencePaths = useMemo(
    () =>
      showGeographyLearningLayer
        ? getGeographyReferencePaths(quality, selectedReferenceLineId)
        : [],
    [quality, selectedReferenceLineId, showGeographyLearningLayer],
  )
  const pathData = useMemo(
    () => [
      ...(selectedTrenchPath ? [selectedTrenchPath] : []),
      ...linearPaths,
      ...mountainPaths,
      ...geographyReferencePaths,
    ],
    [geographyReferencePaths, linearPaths, mountainPaths, selectedTrenchPath],
  )
  const polygonsData = useMemo(
    () => [
      ...countryBoundaries.features,
      ...visibleDesertFeatures,
      ...visibleLakeSurfaceFeatures,
      ...(selectedSurfaceFeature ? [selectedSurfaceFeature] : []),
    ],
    [selectedSurfaceFeature, visibleDesertFeatures, visibleLakeSurfaceFeatures],
  )

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
          selectedDesertId,
          hoveredDesertId,
          selectedLandmarkId,
          hoveredLandmarkId,
          selectedReferenceLineId,
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
          selectedDesertId,
          hoveredDesertId,
          selectedLandmarkId,
          hoveredLandmarkId,
          selectedReferenceLineId,
        ),
    )
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
        item.id === hoveredMountainRangeId ||
        item.id === selectedDesertId ||
        item.id === hoveredDesertId ||
        item.id === selectedLandmarkId ||
        item.id === hoveredLandmarkId ||
        (item.type === 'referenceLine' &&
          item.line.id === selectedReferenceLineId) ||
        (item.type === 'referenceLine' &&
          item.line.category !== 'latitude-zone-boundary')
      const labelGroup = getLabelGroup(item)
      if (
        !forced &&
        labelGroup !== 'geography' &&
        groupCount[labelGroup] >= ordinaryGroupLimit
      )
        continue

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
              : item.type === 'mountainRange'
                ? item.range.name.zh
                : item.type === 'desert'
                  ? item.desert.name.zh
                  : item.type === 'landmark'
                    ? item.landmark.name.zh
                    : item.type === 'referenceLine'
                      ? item.line.shortLabel
                      : item.label
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
      const labelPlacement = getMapLabelPlacement({
        x,
        y,
        labelWidth: width,
        labelHeight: height,
        viewportWidth: size.width,
        viewportHeight: size.height,
        isLake: item.type === 'waterbody' && item.waterbody.layer === 'lake',
      })
      x = labelPlacement.x
      y = labelPlacement.y
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
      if (item.type === 'waterbody' && item.waterbody.layer === 'lake') {
        element.style.setProperty(
          '--lake-label-leader-length',
          `${labelPlacement.leaderLength.toFixed(2)}px`,
        )
        element.style.setProperty(
          '--lake-label-leader-angle',
          `${labelPlacement.leaderAngleDegrees.toFixed(2)}deg`,
        )
      }
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
    hoveredDesertId,
    hoveredLandmarkId,
    labelItems,
    quality,
    projectSelectedMountainPeak,
    selectedCityId,
    selectedWaterbodyId,
    selectedLinearFeatureId,
    selectedMountainRangeId,
    selectedDesertId,
    selectedLandmarkId,
    selectedReferenceLineId,
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
          layoutCityLabels()
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
        onStart={onControlsInteractionStart}
        onChange={() => {
          syncPointOfView()
          labelLayoutPendingRef.current = true
          scheduleViewChange()
        }}
        onEnd={() => {
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

export function GlobeScene(props: GlobeSceneProps) {
  const {
    onHoverCity,
    onHoverCountry,
    onHoverLinearFeature,
    onHoverMountainRange,
    onHoverWaterbody,
    onHoverDesert,
    onHoverLandmark,
  } = props
  const tooltipRef = useRef<HTMLDivElement>(null)
  const labelLayerRef = useRef<HTMLDivElement>(null)
  const controlsInteractingRef = useRef(false)
  const [controlsInteracting, setControlsInteracting] = useState(false)
  const selectedLinearFeatureOverlayRef = useRef<SVGSVGElement>(null)
  const selectedMountainPeakRef = useRef<HTMLButtonElement>(null)
  const hoveredCountry = getCountry(props.hoveredCountryCode)
  const hoveredCity = getCity(props.hoveredCityId)
  const hoveredWaterbody = getWaterbody(props.hoveredWaterbodyId)
  const hoveredLinearFeature = getLinearGeoFeature(props.hoveredLinearFeatureId)
  const hoveredMountainRange = getMountainRange(props.hoveredMountainRangeId)
  const hoveredDesert = getDesert(props.hoveredDesertId)
  const hoveredLandmark = getLandmark(props.hoveredLandmarkId)
  const selectedLinearFeature = getLinearGeoFeature(
    props.selectedLinearFeatureId,
  )
  const selectedMountainRange = getMountainRange(props.selectedMountainRangeId)
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
        showLakeLayer: props.showLakeLayer,
        showWaterwayLayer: props.showWaterwayLayer,
        selectedWaterbodyId: props.selectedWaterbodyId,
        hoveredWaterbodyId: props.hoveredWaterbodyId,
      }),
    [
      props.hoveredWaterbodyId,
      props.selectedWaterbodyId,
      props.showOceanLayer,
      props.showLakeLayer,
      props.showWaterwayLayer,
    ],
  )
  const labelLinearFeatures = useMemo(
    () =>
      getVisibleLinearFeatures(linearGeoFeatures, {
        showRiverAndCanalLayer: props.showRiverAndCanalLayer,
        selectedLinearFeatureId: props.selectedLinearFeatureId,
        hoveredLinearFeatureId: props.hoveredLinearFeatureId,
      }),
    [
      props.hoveredLinearFeatureId,
      props.selectedLinearFeatureId,
      props.showRiverAndCanalLayer,
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
  const labelDeserts = useMemo(
    () =>
      getVisibleDeserts(deserts, {
        showDesertLayer: props.showDesertLayer,
      }),
    [props.showDesertLayer],
  )
  const labelLandmarks = useMemo(
    () =>
      getVisibleLandmarks(landmarks, {
        showLandmarkLayer: props.showLandmarkLayer,
      }),
    [props.showLandmarkLayer],
  )
  const labelReferenceLines = useMemo(
    () => (props.showGeographyLearningLayer ? geographyReferenceLines : []),
    [props.showGeographyLearningLayer],
  )
  const labelCoordinateItems = useMemo(
    () =>
      props.showGeographyLearningLayer
        ? props.quality === 'balanced'
          ? geographyCoordinateLabels
          : geographyCoordinateLabels.filter(
              (item) =>
                item.label === '0°' ||
                item.label.startsWith('60°') ||
                item.label.startsWith('120°'),
            )
        : [],
    [props.quality, props.showGeographyLearningLayer],
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
      ...labelDeserts.map((desert) => ({
        id: desert.id,
        type: 'desert' as const,
        latitude: desert.center.latitude,
        longitude: desert.center.longitude,
        desert,
      })),
      ...labelLandmarks.map((landmark) => ({
        id: landmark.id,
        type: 'landmark' as const,
        latitude: landmark.position.latitude,
        longitude: landmark.position.longitude,
        landmark,
      })),
      ...labelReferenceLines.map((line) => ({
        id: `reference-${line.id}`,
        type: 'referenceLine' as const,
        latitude: line.anchorPosition.latitude,
        longitude: line.anchorPosition.longitude,
        line,
      })),
      ...labelCoordinateItems.map((item) => ({
        ...item,
        id: `coordinate-${item.id}`,
        type: 'coordinateLabel' as const,
      })),
    ],
    [
      labelCities,
      labelDeserts,
      labelLinearFeatures,
      labelLandmarks,
      labelMountainRanges,
      labelCoordinateItems,
      labelReferenceLines,
      labelWaterbodies,
    ],
  )

  return (
    <div
      className="globe-canvas"
      data-testid="globe-scene"
      data-climate-highlight-id={
        props.showClimateLayer
          ? (props.selectedClimateTypeId ?? undefined)
          : undefined
      }
      data-climate-boundary-id={
        props.showClimateLayer && props.climateBoundaryRasterUrl
          ? (props.selectedClimateTypeId ?? undefined)
          : undefined
      }
      data-controls-interacting={controlsInteracting ? 'true' : 'false'}
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
        props.onHoverDesert(null)
        props.onHoverLandmark(null)
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
          controlsInteractingRef={controlsInteractingRef}
          onControlsInteractionStart={beginControlsInteraction}
          onControlsInteractionEnd={endControlsInteraction}
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
        aria-label="城市、水域、山脉、沙漠、古迹与经纬网地理标签"
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
            onPointerEnter={() => {
              if (!controlsInteractingRef.current) props.onHoverCity(city.id)
            }}
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
            className={`city-label waterbody-label is-${waterbody.layer} is-${getWaterbodyLabelState(
              waterbody.id,
              props.selectedWaterbodyId,
              props.hoveredWaterbodyId,
            )}`}
            data-map-label-id={waterbody.id}
            data-waterbody-id={waterbody.id}
            aria-label={`定位到${waterbody.name.zh}${waterbodyKindLabels[waterbody.kind]}`}
            onPointerEnter={() => {
              if (!controlsInteractingRef.current)
                props.onHoverWaterbody(waterbody.id)
            }}
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
            onPointerEnter={() => {
              if (!controlsInteractingRef.current)
                props.onHoverLinearFeature(feature.id)
            }}
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
            onPointerEnter={() => {
              if (!controlsInteractingRef.current)
                props.onHoverMountainRange(range.id)
            }}
            onPointerLeave={() => props.onHoverMountainRange(null)}
            onClick={() => props.onSelectMountainRange(range.id)}
          >
            <span aria-hidden="true" />
            {range.name.zh}
          </button>
        ))}
        {labelDeserts.map((desert) => (
          <button
            type="button"
            key={desert.id}
            hidden
            className={
              desert.id === props.selectedDesertId
                ? 'city-label desert-label is-selected'
                : 'city-label desert-label'
            }
            data-map-label-id={desert.id}
            data-desert-id={desert.id}
            aria-label={`定位到${desert.name.zh}`}
            onPointerEnter={() => {
              if (!controlsInteractingRef.current)
                props.onHoverDesert(desert.id)
            }}
            onPointerLeave={() => props.onHoverDesert(null)}
            onClick={() => props.onSelectDesert(desert.id)}
          >
            <span aria-hidden="true" />
            {desert.name.zh}
          </button>
        ))}
        {labelLandmarks.map((landmark) => (
          <button
            type="button"
            key={landmark.id}
            hidden
            className={
              landmark.id === props.selectedLandmarkId
                ? 'city-label landmark-label is-selected'
                : 'city-label landmark-label'
            }
            data-map-label-id={landmark.id}
            data-landmark-id={landmark.id}
            aria-label={`定位到古迹${landmark.name.zh}`}
            onPointerEnter={() => {
              if (!controlsInteractingRef.current)
                props.onHoverLandmark(landmark.id)
            }}
            onPointerLeave={() => props.onHoverLandmark(null)}
            onClick={() => props.onSelectLandmark(landmark.id)}
          >
            <span aria-hidden="true" />
            {landmark.name.zh}
          </button>
        ))}
        {labelReferenceLines.map((line) => (
          <button
            type="button"
            key={line.id}
            hidden
            className={
              line.id === props.selectedReferenceLineId
                ? `city-label geography-reference-label is-${line.category} is-selected`
                : `city-label geography-reference-label is-${line.category}`
            }
            data-map-label-id={`reference-${line.id}`}
            data-reference-line-id={line.id}
            aria-label={`打开${line.name.zh}知识`}
            onClick={() => props.onSelectGeographyTopic(line.topicId, line.id)}
          >
            <span aria-hidden="true" />
            {line.shortLabel}
          </button>
        ))}
        {labelCoordinateItems.map((item) => (
          <span
            key={item.id}
            hidden
            className="city-label geography-coordinate-label"
            data-map-label-id={`coordinate-${item.id}`}
            aria-hidden="true"
          >
            {item.label}
          </span>
        ))}
      </div>
      {!controlsInteracting &&
      (hoveredLandmark ||
        hoveredDesert ||
        hoveredMountainRange ||
        hoveredLinearFeature ||
        hoveredWaterbody ||
        hoveredCity ||
        hoveredCountry) ? (
        <div ref={tooltipRef} className="country-hover-tooltip" role="tooltip">
          {hoveredLandmark ? (
            <>
              <span>{hoveredLandmark.name.zh}</span>
              <small>古迹 · {hoveredLandmark.name.en}</small>
            </>
          ) : hoveredDesert ? (
            <>
              <span>{hoveredDesert.name.zh}</span>
              <small>沙漠 · {hoveredDesert.name.en}</small>
            </>
          ) : hoveredMountainRange ? (
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
