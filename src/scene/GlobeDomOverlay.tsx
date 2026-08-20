import { useRef, type ReactNode, type RefObject } from 'react'

import { getCity, getCountry } from '../data/countries'
import { getDesert } from '../data/deserts'
import { getLandmark } from '../data/landmarks'
import {
  getLinearGeoFeature,
  linearGeoFeatureKindLabels,
} from '../data/linearGeoFeatures'
import { getMountainRange } from '../data/mountainRanges'
import { getWaterbody, waterbodyKindLabels } from '../data/waterbodies'
import { getWaterbodyLabelState } from './countrySceneInteraction'
import type { GlobeWorldProps } from './GlobeScene'
import type { GlobeLabelData } from './useGlobeLabelData'

type GlobeDomOverlayProps = {
  children: ReactNode
  worldProps: GlobeWorldProps
  labels: GlobeLabelData
  controlsInteracting: boolean
  controlsInteractingRef: { current: boolean }
  labelLayerRef: RefObject<HTMLDivElement | null>
  selectedLinearFeatureOverlayRef: RefObject<SVGSVGElement | null>
  selectedMountainPeakRef: RefObject<HTMLButtonElement | null>
}

export function GlobeDomOverlay({
  children,
  worldProps: props,
  labels: {
    labelCities,
    labelWaterbodies,
    labelLinearFeatures,
    labelMountainRanges,
    labelDeserts,
    labelLandmarks,
    labelReferenceLines,
    labelCoordinateItems,
  },
  controlsInteracting,
  controlsInteractingRef,
  labelLayerRef,
  selectedLinearFeatureOverlayRef,
  selectedMountainPeakRef,
}: GlobeDomOverlayProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
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
  const selectedLinearFeatureStemCount = selectedLinearFeature
    ? (props.linearFeatureGeometries?.find(
        (geometry) => geometry.id === selectedLinearFeature.id,
      )?.geometry.coordinates.length ?? 0)
    : 0

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
      {children}
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
              if (!controlsInteractingRef.current) {
                props.onHoverWaterbody(waterbody.id)
              }
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
              if (!controlsInteractingRef.current) {
                props.onHoverLinearFeature(feature.id)
              }
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
              if (!controlsInteractingRef.current) {
                props.onHoverMountainRange(range.id)
              }
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
              if (!controlsInteractingRef.current) {
                props.onHoverDesert(desert.id)
              }
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
              if (!controlsInteractingRef.current) {
                props.onHoverLandmark(landmark.id)
              }
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
