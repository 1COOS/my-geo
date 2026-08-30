import { useMemo, type CSSProperties } from 'react'

import { countries } from '../../data/countries'
import { loadCountryBoundaries } from '../../data/geometryResources'
import {
  knowledgeRegionByCountryCode,
  type KnowledgeContinentId,
  type KnowledgeRegionId,
} from '../../data/knowledgeRegions'
import { useGeometryResource } from '../../shared/hooks/useGeometryResource'
import {
  getKnowledgeWorldMapPath,
  KNOWLEDGE_WORLD_MAP_HEIGHT as MAP_HEIGHT,
  KNOWLEDGE_WORLD_MAP_WIDTH as MAP_WIDTH,
  projectKnowledgeWorldPosition,
} from './knowledgeWorldMap'

const MICROSTATE_RADIUS = 4

type KnowledgeRegionMapProps = {
  continentId: KnowledgeContinentId
  regionId?: KnowledgeRegionId
  selectedCountryCode?: string
  onSelectContinent?: (continentId: KnowledgeContinentId) => void
}

export function KnowledgeRegionMap({
  continentId,
  regionId,
  selectedCountryCode,
  onSelectContinent,
}: KnowledgeRegionMapProps) {
  const boundaryResource = useGeometryResource(loadCountryBoundaries)
  const paths = useMemo(
    () =>
      (boundaryResource.data?.features ?? []).map((feature) => ({
        code: feature.properties.code,
        path: getKnowledgeWorldMapPath(feature),
      })),
    [boundaryResource.data],
  )
  const landmassPaths = useMemo(
    () =>
      (boundaryResource.data?.landmasses ?? []).map((landmass) => ({
        id: landmass.properties.id,
        path: getKnowledgeWorldMapPath(landmass),
      })),
    [boundaryResource.data],
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
      return point && region ? [{ country, point, region }] : []
    })
  }, [boundaryResource.data])

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
        className="knowledge-region-map"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label={
          selectedCountryCode
            ? '当前选择国家世界位置图'
            : regionId
              ? '当前学习区域世界位置图'
              : '当前大洲世界位置图'
        }
      >
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} />
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
        <g className="knowledge-region-map-countries">
          {paths.map(({ code, path }) => {
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
      {boundaryResource.status === 'loading' ? (
        <output className="geometry-resource-status" role="status">
          正在加载世界边界…
        </output>
      ) : boundaryResource.status === 'error' ? (
        <div className="geometry-resource-status" role="alert">
          世界边界加载失败。
          <button type="button" onClick={boundaryResource.retry}>
            重新加载
          </button>
        </div>
      ) : null}
    </>
  )
}
