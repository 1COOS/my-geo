import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { countries } from '../../data/countries'
import {
  getKnowledgeRegion,
  knowledgeRegionByCountryCode,
  type KnowledgeContinentId,
  type KnowledgeRegionId,
} from '../../data/knowledgeRegions'
import { WorldMapResourceStatus } from '../../shared/maps/WorldMapResourceStatus'
import { useWorldBoundaryPaths } from '../../shared/maps/useWorldBoundaryPaths'
import {
  getKnowledgeWorldMapPath,
  KNOWLEDGE_WORLD_MAP_HEIGHT as MAP_HEIGHT,
  KNOWLEDGE_WORLD_MAP_WIDTH as MAP_WIDTH,
  projectKnowledgeWorldPosition,
} from './knowledgeWorldMap'
import {
  createKnowledgeRegionMapProjection,
  projectKnowledgeRegionMapPosition,
  type KnowledgeRegionMapViewport,
} from './knowledgeRegionMapProjection'

const MICROSTATE_RADIUS = 4
const DEFAULT_REGION_VIEWPORT = { width: 720, height: 240 }

type KnowledgeRegionMapProps = {
  continentId: KnowledgeContinentId
  regionId?: KnowledgeRegionId
  selectedCountryCode?: string
  onSelectContinent?: (continentId: KnowledgeContinentId) => void
}

function useFocusedRegionViewport(active: boolean) {
  const mapRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewport] = useState<KnowledgeRegionMapViewport>(
    DEFAULT_REGION_VIEWPORT,
  )

  useEffect(() => {
    const map = mapRef.current
    if (!active || !map || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)
      if (width <= 0 || height <= 0) return
      setViewport((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      )
    })
    observer.observe(map)
    return () => observer.disconnect()
  }, [active])

  return { mapRef, viewport }
}

export function KnowledgeRegionMap({
  continentId,
  regionId,
  selectedCountryCode,
  onSelectContinent,
}: KnowledgeRegionMapProps) {
  const {
    resource: boundaryResource,
    countryPaths: paths,
    landmassPaths,
  } = useWorldBoundaryPaths(getKnowledgeWorldMapPath)
  const focusedRegion = getKnowledgeRegion(regionId)
  const { mapRef, viewport: focusedViewport } = useFocusedRegionViewport(
    focusedRegion !== undefined,
  )
  const focusedCountries = useMemo(
    () =>
      focusedRegion
        ? countries.filter((country) =>
            focusedRegion.countryCodes.includes(country.code),
          )
        : [],
    [focusedRegion],
  )
  const focusedBoundaries = useMemo(() => {
    if (!focusedRegion) return []
    const regionCodes = new Set(focusedRegion.countryCodes)
    return (boundaryResource.data?.features ?? []).filter((feature) =>
      regionCodes.has(feature.properties.code),
    )
  }, [boundaryResource.data, focusedRegion])
  const focusedProjection = useMemo(
    () =>
      focusedRegion
        ? createKnowledgeRegionMapProjection({
            boundaries: focusedBoundaries,
            positions: focusedCountries.map((country) => country.center),
            viewport: focusedViewport,
          })
        : null,
    [focusedBoundaries, focusedCountries, focusedRegion, focusedViewport],
  )
  const focusedPaths = useMemo(
    () =>
      focusedProjection
        ? focusedBoundaries.map((feature) => ({
            code: feature.properties.code,
            path: focusedProjection.path(feature as never) ?? '',
          }))
        : [],
    [focusedBoundaries, focusedProjection],
  )
  const microstateMarkers = useMemo(() => {
    const boundaryCodes = new Set(
      (boundaryResource.data?.features ?? []).map(
        (feature) => feature.properties.code,
      ),
    )
    return countries.flatMap((country) => {
      if (boundaryCodes.has(country.code)) return []
      const point = projectKnowledgeWorldPosition(country.center)
      const region = knowledgeRegionByCountryCode.get(country.code)
      if (!region || (focusedRegion && region.id !== focusedRegion.id))
        return []
      const displayedPoint = focusedProjection
        ? projectKnowledgeRegionMapPosition(
            focusedProjection.projection,
            country.center,
          )
        : point
      return displayedPoint ? [{ country, point: displayedPoint, region }] : []
    })
  }, [boundaryResource.data, focusedProjection, focusedRegion])

  const displayedPaths = focusedRegion ? focusedPaths : paths
  const mapWidth = focusedProjection?.width ?? MAP_WIDTH
  const mapHeight = focusedProjection?.height ?? MAP_HEIGHT

  const getStateClass = (
    code: string,
    region: ReturnType<typeof knowledgeRegionByCountryCode.get>,
  ) =>
    selectedCountryCode
      ? code === selectedCountryCode
        ? 'is-country'
        : region?.id === regionId
          ? 'is-region'
          : undefined
      : regionId
        ? region?.id === regionId
          ? 'is-region'
          : undefined
        : region?.continentId === continentId
          ? 'is-continent'
          : undefined

  const getAccentStyle = (
    stateClass: string | undefined,
    accent: string | undefined,
  ) =>
    stateClass === 'is-continent' && accent
      ? ({ '--knowledge-region-accent': accent } as CSSProperties)
      : undefined

  return (
    <>
      <svg
        ref={focusedRegion ? mapRef : undefined}
        className={
          focusedRegion
            ? 'knowledge-region-map is-focused-region'
            : 'knowledge-region-map'
        }
        data-map-scope={focusedRegion ? 'region' : 'world'}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        role="img"
        aria-label={
          selectedCountryCode
            ? '当前选择国家区域地图'
            : focusedRegion
              ? `${focusedRegion.name.zh}区域地图`
              : '当前大洲世界位置图'
        }
      >
        <rect width={mapWidth} height={mapHeight} />
        {focusedRegion ? null : (
          <>
            <g aria-hidden="true" className="knowledge-region-map-grid">
              {[120, 240, 360, 480, 600].map((x) => (
                <line key={`x-${x}`} x1={x} x2={x} y1={0} y2={MAP_HEIGHT} />
              ))}
              {[85, 170, 255].map((y) => (
                <line key={`y-${y}`} x1={0} x2={MAP_WIDTH} y1={y} y2={y} />
              ))}
            </g>
            <g aria-hidden="true" className="knowledge-region-map-landmasses">
              {landmassPaths.map(({ id, path }) => (
                <path key={id} data-landmass-id={id} d={path} />
              ))}
            </g>
          </>
        )}
        <g className="knowledge-region-map-countries">
          {displayedPaths.map(({ code, path }) => {
            const region = knowledgeRegionByCountryCode.get(code)
            const stateClass = getStateClass(code, region)
            return (
              <path
                key={code}
                d={path}
                data-country-code={code}
                style={getAccentStyle(stateClass, region?.accent)}
                className={
                  onSelectContinent && region
                    ? `${stateClass ?? ''} is-selectable`.trim()
                    : stateClass
                }
                onClick={
                  onSelectContinent && region
                    ? () => onSelectContinent(region.continentId)
                    : undefined
                }
              />
            )
          })}
        </g>
        <g className="knowledge-region-map-microstates">
          {microstateMarkers.map(({ country, point, region }) => {
            const stateClass = getStateClass(country.code, region)
            return (
              <circle
                key={country.code}
                cx={point[0]}
                cy={point[1]}
                r={MICROSTATE_RADIUS}
                data-country-code={country.code}
                style={getAccentStyle(stateClass, region.accent)}
                className={
                  onSelectContinent
                    ? `${stateClass ?? ''} is-selectable`.trim()
                    : stateClass
                }
                onClick={
                  onSelectContinent
                    ? () => onSelectContinent(region.continentId)
                    : undefined
                }
              >
                <title>{country.name.zh}</title>
              </circle>
            )
          })}
        </g>
      </svg>
      <WorldMapResourceStatus
        loading={boundaryResource.status === 'loading'}
        failed={boundaryResource.status === 'error'}
        loadingText={focusedRegion ? '正在加载区域边界…' : '正在加载世界边界…'}
        errorText={focusedRegion ? '区域边界加载失败。' : '世界边界加载失败。'}
        onRetry={boundaryResource.retry}
      />
    </>
  )
}
