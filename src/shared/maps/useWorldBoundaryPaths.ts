import { useMemo } from 'react'

import type { CountryBoundary, Landmass } from '../../data/countrySchema'
import { loadCountryBoundaries } from '../../data/geometryResources'
import { useGeometryResource } from '../hooks/useGeometryResource'

export function useWorldBoundaryPaths(
  getPath: (geometry: CountryBoundary | Landmass) => string,
) {
  const resource = useGeometryResource(loadCountryBoundaries)
  const countryPaths = useMemo(
    () =>
      (resource.data?.features ?? []).map((feature) => ({
        code: feature.properties.code,
        path: getPath(feature),
      })),
    [getPath, resource.data],
  )
  const landmassPaths = useMemo(
    () =>
      (resource.data?.landmasses ?? []).map((landmass) => ({
        id: landmass.properties.id,
        path: getPath(landmass),
      })),
    [getPath, resource.data],
  )

  return { resource, countryPaths, landmassPaths }
}
