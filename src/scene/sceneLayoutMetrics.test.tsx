// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'

import { SceneLayoutMetricsProvider } from './sceneLayoutMetrics'
import { useSceneLayoutMetrics } from './sceneLayoutMetricsState'

function MetricsProbe() {
  const viewportRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={viewportRef}>
      <SceneLayoutMetricsProvider viewportRef={viewportRef}>
        <Output />
      </SceneLayoutMetricsProvider>
    </div>
  )
}

function Output() {
  const metrics = useSceneLayoutMetrics()
  return <output>{metrics.profile}</output>
}

describe('SceneLayoutMetricsProvider', () => {
  it('provides a stable initial layout profile', () => {
    render(<MetricsProbe />)
    expect(screen.getByText('balanced')).toBeInTheDocument()
  })
})
