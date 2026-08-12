import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { WorldMiniMapNavigation } from '../../shared/types/geo'
import { WorldMiniMap, type WorldMiniMapHandle } from './WorldMiniMap'

function renderMiniMap(overrides?: {
  expanded?: boolean
  selectedCountryCode?: string | null
}) {
  const onNavigate = vi.fn<(navigation: WorldMiniMapNavigation) => void>()
  const onExpandedChange = vi.fn()
  const ref = createRef<WorldMiniMapHandle>()
  render(
    <WorldMiniMap
      ref={ref}
      expanded={overrides?.expanded ?? true}
      selectedCountryCode={overrides?.selectedCountryCode ?? null}
      onExpandedChange={onExpandedChange}
      onNavigate={onNavigate}
    />,
  )
  return { onNavigate, onExpandedChange, ref }
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
})
