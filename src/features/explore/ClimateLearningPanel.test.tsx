import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ClimateLearningPanel } from './ClimateLearningPanel'

describe('ClimateLearningPanel', () => {
  it('shows the 13-type overview and navigates to a type', () => {
    const onSelectType = vi.fn()
    render(
      <ClimateLearningPanel
        selection={{ kind: 'overview' }}
        onSelectType={onSelectType}
        onShowOverview={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('13类世界气候图例')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(14)
    fireEvent.click(screen.getByRole('button', { name: '地中海气候' }))
    expect(onSelectType).toHaveBeenCalledWith('mediterranean')
  })

  it('shows a selected coordinate, climate facts, and ocean state', () => {
    const { rerender } = render(
      <ClimateLearningPanel
        selection={{
          kind: 'type',
          climateTypeId: 'temperate-monsoon',
          classification: {
            position: { latitude: 39.9, longitude: 116.4 },
            climateTypeId: 'temperate-monsoon',
            period: '1991–2020',
          },
        }}
        onSelectType={vi.fn()}
        onShowOverview={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('气候坐标判读')).toHaveTextContent(
      '39.9°N · 116.4°E',
    )
    expect(screen.getByText('气温特征')).toBeInTheDocument()
    expect(screen.getByText('降水特征')).toBeInTheDocument()

    rerender(
      <ClimateLearningPanel
        selection={{
          kind: 'overview',
          classification: {
            position: { latitude: 0, longitude: -140 },
            climateTypeId: null,
            period: '1991–2020',
          },
        }}
        onSelectType={vi.fn()}
        onShowOverview={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('海洋区域，无陆地气候类型')).toBeInTheDocument()
  })
})
