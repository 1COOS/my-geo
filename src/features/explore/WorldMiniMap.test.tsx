import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { ClimateTypeId } from '../../data/climateLearningSchema'
import { getClimateDisplayRasterAsset } from '../../data/climateRaster'
import { countryBoundaries } from '../../data/geometryData'
import type { WorldMiniMapNavigation } from '../../shared/types/geo'
import { WorldMiniMap, type WorldMiniMapHandle } from './WorldMiniMap'

function renderMiniMap(overrides?: {
  expanded?: boolean
  selectedCountryCode?: string | null
  showGeographyLearningLayer?: boolean
  showClimateLayer?: boolean
  quality?: 'balanced' | 'low'
  selectedClimateTypeId?: ClimateTypeId | null
  climateRasterUrl?: string
  climateBoundaryRasterUrl?: string | null
  selectedClimatePosition?: { latitude: number; longitude: number } | null
}) {
  const onNavigate = vi.fn<(navigation: WorldMiniMapNavigation) => void>()
  const onExpandedChange = vi.fn()
  const onSelectGeographyTopic = vi.fn()
  const onSelectClimatePosition = vi.fn()
  const ref = createRef<WorldMiniMapHandle>()
  const quality = overrides?.quality ?? 'balanced'
  const selectedClimateTypeId = overrides?.selectedClimateTypeId ?? null
  render(
    <WorldMiniMap
      countryBoundaries={countryBoundaries}
      ref={ref}
      expanded={overrides?.expanded ?? true}
      selectedCountryCode={overrides?.selectedCountryCode ?? null}
      showGeographyLearningLayer={
        overrides?.showGeographyLearningLayer ?? false
      }
      showClimateLayer={overrides?.showClimateLayer ?? false}
      selectedClimateTypeId={selectedClimateTypeId}
      climateRasterUrl={
        overrides?.climateRasterUrl ??
        getClimateDisplayRasterAsset(quality, selectedClimateTypeId).url
      }
      climateBoundaryRasterUrl={overrides?.climateBoundaryRasterUrl ?? null}
      selectedClimatePosition={overrides?.selectedClimatePosition ?? null}
      onSelectGeographyTopic={onSelectGeographyTopic}
      onSelectClimatePosition={onSelectClimatePosition}
      onExpandedChange={onExpandedChange}
      onNavigate={onNavigate}
    />,
  )
  return {
    onNavigate,
    onExpandedChange,
    onSelectGeographyTopic,
    onSelectClimatePosition,
    ref,
  }
}

describe('WorldMiniMap', () => {
  it('applies the expanded class used by the mobile layout', () => {
    renderMiniMap({ expanded: true })

    expect(screen.getByLabelText('2D 世界定位图')).toHaveClass(
      'world-mini-map',
      'is-expanded',
    )
    expect(screen.queryByText('世界定位图')).not.toBeInTheDocument()
    expect(screen.queryByText('当前视角')).not.toBeInTheDocument()
    expect(screen.queryByText('选中国家')).not.toBeInTheDocument()
  })

  it('navigates countries and coordinates from pointer clicks', () => {
    const { onNavigate } = renderMiniMap()
    const map = screen.getByTestId('world-mini-map')
    vi.spyOn(map, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 360,
      bottom: 180,
      left: 0,
      width: 360,
      height: 180,
      toJSON: () => ({}),
    })

    fireEvent.click(document.querySelector('[data-country-code="CN"]')!, {
      clientX: 296,
      clientY: 50,
    })
    expect(onNavigate).toHaveBeenCalledWith({
      kind: 'country',
      countryCode: 'CN',
    })

    fireEvent.click(map, { clientX: 40, clientY: 90 })
    const navigation = onNavigate.mock.lastCall?.[0]
    expect(navigation?.kind).toBe('coordinate')
    if (navigation?.kind !== 'coordinate')
      throw new Error('Expected coordinate')
    expect(navigation.position.latitude).toBeCloseTo(0, 4)
    expect(navigation.position.longitude).toBeCloseTo(-140, 4)
  })

  it('updates the live marker through its imperative handle', () => {
    const { ref } = renderMiniMap()
    const marker = screen.getByTestId('world-mini-map-view-marker')
    const previousTransform = marker.getAttribute('transform')

    ref.current!.setViewCenter({ latitude: 48.8, longitude: 2.3 })

    expect(marker.getAttribute('transform')).not.toBe(previousTransform)
    expect(screen.getByText('48.8°N · 2.3°E')).toBeInTheDocument()
  })

  it('renders the selected quality climate raster and prioritizes climate clicks', () => {
    const { onNavigate, onSelectClimatePosition } = renderMiniMap({
      showClimateLayer: true,
      quality: 'low',
      selectedClimateTypeId: 'temperate-monsoon',
      climateBoundaryRasterUrl:
        '/climate/highlight-boundaries/low/temperate-monsoon.png',
      selectedClimatePosition: { latitude: 39.9, longitude: 116.4 },
    })
    const map = screen.getByTestId('world-mini-map')
    vi.spyOn(map, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 360,
      bottom: 180,
      left: 0,
      width: 360,
      height: 180,
      toJSON: () => ({}),
    })

    expect(screen.getByTestId('world-mini-map-climate')).toHaveAttribute(
      'href',
      '/climate/highlights-v2/low/temperate-monsoon.png',
    )
    expect(screen.getByTestId('world-mini-map-climate')).toHaveAttribute(
      'data-climate-highlight-id',
      'temperate-monsoon',
    )
    expect(
      screen.getByTestId('world-mini-map-climate-boundary'),
    ).toHaveAttribute(
      'href',
      '/climate/highlight-boundaries/low/temperate-monsoon.png',
    )
    expect(screen.getByTestId('world-mini-map-climate-marker')).toBeVisible()
    fireEvent.click(document.querySelector('[data-country-code="CN"]')!, {
      clientX: 296,
      clientY: 50,
    })
    expect(onSelectClimatePosition).toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('supports keyboard positioning and mobile collapse', () => {
    const { onNavigate, onExpandedChange } = renderMiniMap()
    const map = screen.getByTestId('world-mini-map')

    fireEvent.keyDown(map, { key: 'Home' })
    fireEvent.keyDown(map, { key: 'Enter' })
    expect(onNavigate).toHaveBeenCalledWith({
      kind: 'country',
      countryCode: 'CN',
    })

    fireEvent.keyDown(map, { key: 'Escape' })
    expect(onExpandedChange).toHaveBeenCalledWith(false)
  })

  it('shows synchronized reference lines and updates the live interpretation', () => {
    const { ref, onSelectGeographyTopic } = renderMiniMap({
      showGeographyLearningLayer: true,
    })

    expect(
      document.querySelector('[data-reference-line-id="equator"]'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('2D定位图当前中心判读')).toHaveTextContent(
      '北半球',
    )

    ref.current!.setViewCenter({ latitude: -66.5, longitude: 160 })
    expect(screen.getByLabelText('2D定位图当前中心判读')).toHaveTextContent(
      '东西半球分界线上',
    )
    expect(screen.getByLabelText('2D定位图当前中心判读')).toHaveTextContent(
      '温带与寒带分界线上',
    )

    fireEvent.click(
      document.querySelector('[data-reference-line-label="equator"]')!,
    )
    expect(onSelectGeographyTopic).toHaveBeenCalledWith(
      'hemispheres',
      'equator',
    )
  })

  it('keeps the latest view center when the learning layer is enabled later', () => {
    const ref = createRef<WorldMiniMapHandle>()
    const onNavigate = vi.fn<(navigation: WorldMiniMapNavigation) => void>()
    const onExpandedChange = vi.fn()
    const onSelectGeographyTopic = vi.fn()
    const { rerender } = render(
      <WorldMiniMap
        countryBoundaries={countryBoundaries}
        ref={ref}
        expanded
        selectedCountryCode={null}
        showGeographyLearningLayer={false}
        showClimateLayer={false}
        selectedClimateTypeId={null}
        climateRasterUrl="/climate/climate-types-2048-v2.png"
        climateBoundaryRasterUrl={null}
        selectedClimatePosition={null}
        onSelectGeographyTopic={onSelectGeographyTopic}
        onSelectClimatePosition={vi.fn()}
        onExpandedChange={onExpandedChange}
        onNavigate={onNavigate}
      />,
    )

    ref.current!.setViewCenter({ latitude: -66.5, longitude: 160 })
    rerender(
      <WorldMiniMap
        countryBoundaries={countryBoundaries}
        ref={ref}
        expanded
        selectedCountryCode={null}
        showGeographyLearningLayer
        showClimateLayer={false}
        selectedClimateTypeId={null}
        climateRasterUrl="/climate/climate-types-2048-v2.png"
        climateBoundaryRasterUrl={null}
        selectedClimatePosition={null}
        onSelectGeographyTopic={onSelectGeographyTopic}
        onSelectClimatePosition={vi.fn()}
        onExpandedChange={onExpandedChange}
        onNavigate={onNavigate}
      />,
    )

    expect(screen.getByText('66.5°S · 160.0°E')).toBeInTheDocument()
    expect(screen.getByLabelText('2D定位图当前中心判读')).toHaveTextContent(
      '东西半球分界线上',
    )
  })
})
