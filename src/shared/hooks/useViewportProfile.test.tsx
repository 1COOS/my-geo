import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ViewportProfileProvider } from '../components/ViewportProfileProvider'
import {
  resolveViewportProfile,
  useViewportProfile,
} from './useViewportProfile'

describe('resolveViewportProfile', () => {
  it.each([
    [{ width: 568, height: 320 }, 'compact-landscape'],
    [{ width: 844, height: 390 }, 'compact-landscape'],
    [{ width: 1024, height: 600 }, 'compact-landscape'],
    [{ width: 1194, height: 834 }, 'balanced'],
    [{ width: 1366, height: 768 }, 'wide'],
    [{ width: 2560, height: 1440 }, 'wide'],
    [{ width: 900, height: 1000 }, 'balanced'],
  ] as const)('classifies %o as %s', (size, expected) => {
    expect(resolveViewportProfile(size)).toBe(expected)
  })
})

function ProfileProbe({ testId }: { testId: string }) {
  return <output data-testid={testId}>{useViewportProfile()}</output>
}

describe('ViewportProfileProvider', () => {
  it('shares one viewport listener across all consumers and publishes updates', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })
    const addListener = vi.spyOn(window, 'addEventListener')

    render(
      <ViewportProfileProvider>
        <ProfileProbe testId="first-profile" />
        <ProfileProbe testId="second-profile" />
      </ViewportProfileProvider>,
    )

    expect(screen.getByTestId('first-profile')).toHaveTextContent('wide')
    expect(screen.getByTestId('second-profile')).toHaveTextContent('wide')
    expect(
      addListener.mock.calls.filter(([eventName]) => eventName === 'resize'),
    ).toHaveLength(1)

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 844,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 390,
    })
    void act(() => window.dispatchEvent(new Event('resize')))

    expect(screen.getByTestId('first-profile')).toHaveTextContent(
      'compact-landscape',
    )
    expect(screen.getByTestId('second-profile')).toHaveTextContent(
      'compact-landscape',
    )
  })

  it('uses the balanced profile when rendered outside the application provider', () => {
    render(<ProfileProbe testId="standalone-profile" />)

    expect(screen.getByTestId('standalone-profile')).toHaveTextContent(
      'balanced',
    )
  })
})
