import { geoEquirectangular, geoPath } from 'd3-geo'
import { useMemo } from 'react'

import { loadCountryBoundaries } from '../../data/geometryResources'
import {
  knowledgeRegionByCountryCode,
  type KnowledgeContinentId,
  type KnowledgeRegionId,
} from '../../data/knowledgeRegions'
import { useGeometryResource } from '../../shared/hooks/useGeometryResource'

const MAP_WIDTH = 720
const MAP_HEIGHT = 340
const projection = geoEquirectangular()
  .scale(MAP_WIDTH / (2 * Math.PI))
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
  .clipExtent([
    [0, 0],
    [MAP_WIDTH, MAP_HEIGHT],
  ])
const pathGenerator = geoPath(projection)

type KnowledgeRegionMapProps = {
  continentId: KnowledgeContinentId
  regionId?: KnowledgeRegionId
  selectedCountryCode?: string
}

export function KnowledgeRegionMap({
  continentId,
  regionId,
  selectedCountryCode,
}: KnowledgeRegionMapProps) {
  const boundaryResource = useGeometryResource(loadCountryBoundaries)
  const paths = useMemo(
    () =>
      (boundaryResource.data?.features ?? []).map((feature) => ({
        code: feature.properties.code,
        path: pathGenerator(feature as never) ?? '',
      })),
    [boundaryResource.data],
  )

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
        <g className="knowledge-region-map-countries">
          {paths.map(({ code, path }) => {
            const region = knowledgeRegionByCountryCode.get(code)
            const stateClass = selectedCountryCode
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
            return (
              <path
                key={code}
                d={path}
                data-country-code={code}
                className={stateClass}
              />
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
