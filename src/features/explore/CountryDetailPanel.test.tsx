import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getCitiesForCountry, getCountry } from '../../data/countries'
import { CountryDetailPanel } from './CountryDetailPanel'

function renderCountry(code: string, onSelectCountry = vi.fn()) {
  const country = getCountry(code)
  expect(country).toBeDefined()
  render(
    <CountryDetailPanel
      country={country!}
      cities={getCitiesForCountry(code)}
      selectedCity={undefined}
      onClose={vi.fn()}
      onSelectCountry={onSelectCountry}
      onSelectCity={vi.fn()}
      onBackToCountry={vi.fn()}
    />,
  )
  return onSelectCountry
}

function renderCountryData(
  country: NonNullable<ReturnType<typeof getCountry>>,
  onSelectCountry = vi.fn(),
) {
  render(
    <CountryDetailPanel
      country={country}
      cities={getCitiesForCountry(country.code)}
      selectedCity={undefined}
      onClose={vi.fn()}
      onSelectCountry={onSelectCountry}
      onSelectCity={vi.fn()}
      onBackToCountry={vi.fn()}
    />,
  )
}

function renderSelectedCity(code: string, cityId: string) {
  const country = getCountry(code)
  const cities = getCitiesForCountry(code)
  const city = cities.find((candidate) => candidate.id === cityId)
  expect(country).toBeDefined()
  expect(city).toBeDefined()

  const onBackToCountry = vi.fn()
  render(
    <CountryDetailPanel
      country={country!}
      cities={cities}
      selectedCity={city}
      onClose={vi.fn()}
      onSelectCountry={vi.fn()}
      onSelectCity={vi.fn()}
      onBackToCountry={onBackToCountry}
    />,
  )
  return onBackToCountry
}

describe('CountryDetailPanel', () => {
  it('renders full featured-country content and approved regions', () => {
    renderCountry('CN')

    expect(screen.getByRole('heading', { name: '中国' })).toBeInTheDocument()
    expect(screen.getByAltText('中国国旗')).toHaveAttribute(
      'src',
      '/flags/cn.svg',
    )
    expect(screen.getByText('中华人民共和国')).toBeInTheDocument()
    expect(screen.getAllByText('北京').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('人民币（CNY）')).toBeInTheDocument()
    expect(screen.getByText('中国香港')).toBeInTheDocument()
    expect(screen.getByText('中国澳门')).toBeInTheDocument()
    expect(screen.getByText('资料来源（3）')).toBeInTheDocument()
  })

  it('renders a complete non-featured microstate card', () => {
    renderCountry('VA')

    expect(screen.getByText('梵蒂冈城国')).toBeInTheDocument()
    expect(screen.getByText('0.44 km²')).toBeInTheDocument()
    expect(screen.getByText('拉丁语')).toBeInTheDocument()
    expect(screen.queryByText('海陆属性')).not.toBeInTheDocument()
    expect(screen.queryByText('更多内容制作中')).not.toBeInTheDocument()
  })

  it('renders all capitals for a multi-capital country', () => {
    renderCountry('ZA')

    expect(screen.getAllByText('比勒陀利亚').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('布隆方丹').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('开普敦').length).toBeGreaterThanOrEqual(1)
  })

  it('renders a friendly empty state for a country without capital data', () => {
    const vatican = getCountry('VA')
    expect(vatican).toBeDefined()

    renderCountryData({ ...vatican!, capitals: [] })

    expect(screen.getByText('暂无首都资料')).toBeInTheDocument()
  })

  it('dispatches a sovereign-neighbour selection', async () => {
    const onSelectCountry = renderCountry('VA')

    await userEvent.click(
      screen.getByRole('button', { name: '探索邻国意大利' }),
    )

    expect(onSelectCountry).toHaveBeenCalledWith('IT')
  })

  it('keeps adjacent regions as non-interactive labels', () => {
    renderCountry('CN')

    expect(screen.queryByRole('button', { name: /中国香港/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /中国澳门/ })).toBeNull()
  })

  it('expands the local source registry details', async () => {
    renderCountry('VA')

    await userEvent.click(screen.getByText('资料来源（1）'))

    expect(
      screen.getByRole('link', { name: 'World Countries dataset' }),
    ).toHaveAttribute('href', 'https://github.com/mledoze/countries')
  })

  it('renders the reviewed city list as keyboard-accessible controls', () => {
    renderCountry('CN')

    expect(
      screen.getByRole('button', { name: '探索城市北京' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '探索城市上海' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '探索城市成都' }),
    ).toBeInTheDocument()
  })

  it('switches to a city knowledge card with population, coordinates, reasons, and sources', async () => {
    const onBackToCountry = renderSelectedCity('CN', 'cn-shanghai')

    expect(screen.getByLabelText('上海城市知识卡')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '上海' })).toBeInTheDocument()
    expect(screen.getByText(/约 2407.3万 人/)).toBeInTheDocument()
    expect(screen.getByText(/31\.1667°N/)).toBeInTheDocument()
    expect(screen.getByText('经济中心')).toBeInTheDocument()
    expect(screen.getByText('世界知名')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '← 返回中国' }))
    expect(onBackToCountry).toHaveBeenCalledOnce()
  })
})
