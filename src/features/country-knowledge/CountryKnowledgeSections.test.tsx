import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getCitiesForCountry, getCountry } from '../../data/countries'

import {
  CountryKnowledgeSections,
  CountrySignatureLabels,
} from './CountryKnowledgeSections'

function country(code: string) {
  const value = getCountry(code)
  expect(value).toBeDefined()
  return value!
}

function renderSections(code: string, onSelectCountry = vi.fn()) {
  const selectedCountry = country(code)
  const onSelectCity = vi.fn()
  const result = render(
    <CountryKnowledgeSections
      key={code}
      country={selectedCountry}
      cities={getCitiesForCountry(code)}
      onSelectCountry={onSelectCountry}
      onSelectCity={onSelectCity}
    />,
  )
  return { ...result, onSelectCity, onSelectCountry }
}

describe('CountryKnowledgeSections', () => {
  it('starts collapsed and keeps chapters single-open', async () => {
    renderSections('CN')

    const people = screen.getByRole('button', { name: /民族文化/ })
    const resources = screen.getByRole('button', { name: /自然资源/ })
    const economy = screen.getByRole('button', { name: /经济产业/ })
    const places = screen.getByRole('button', { name: /城市邻国/ })

    expect(people).toHaveAttribute('aria-expanded', 'false')
    expect(resources).toHaveAttribute('aria-expanded', 'false')
    expect(economy).toHaveAttribute('aria-expanded', 'false')
    expect(places).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('中文')).toBeNull()
    await userEvent.click(people)
    expect(people).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('中文')).toBeVisible()
    expect(screen.queryByText('Chinese')).toBeNull()
    expect(
      screen.queryByRole('button', { name: /查看全部主要民族/ }),
    ).toBeNull()
    expect(screen.getByText('苗族')).toBeVisible()
    expect(screen.getByText(/汉族 约91\.1%/)).toBeVisible()
    expect(screen.queryByText(/2021/)).toBeNull()

    await userEvent.click(resources)
    expect(resources).toHaveAttribute('aria-expanded', 'true')
    expect(people).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('能源')).toBeVisible()
    expect(screen.getByText('矿产')).toBeVisible()

    await userEvent.click(resources)
    expect(resources).toHaveAttribute('aria-expanded', 'false')
  })

  it('resets the default chapter when the country changes', async () => {
    const china = country('CN')
    const sriLanka = country('LK')
    const { rerender } = render(
      <CountryKnowledgeSections
        key="CN"
        country={china}
        cities={getCitiesForCountry('CN')}
        onSelectCountry={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /经济产业/ }))
    expect(screen.getByRole('button', { name: /经济产业/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    rerender(
      <CountryKnowledgeSections
        key="LK"
        country={sriLanka}
        cities={getCitiesForCountry('LK')}
        onSelectCountry={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /民族文化/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByRole('button', { name: /经济产业/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('shows every city and neighbour inside the combined chapter', async () => {
    const onSelectCountry = vi.fn()
    const { onSelectCity } = renderSections('CN', onSelectCountry)

    expect(screen.queryByRole('button', { name: '探索城市北京' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /城市邻国/ }))

    expect(screen.getByRole('button', { name: '探索城市成都' })).toBeVisible()
    expect(screen.getByRole('button', { name: '探索邻国俄罗斯' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /查看全部主要城市/ }),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: /查看全部相邻国家/ }),
    ).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: '探索城市北京' }))
    expect(onSelectCity).toHaveBeenCalledWith('cn-beijing')

    await userEvent.click(
      screen.getByRole('button', { name: '探索邻国阿富汗' }),
    )
    expect(onSelectCountry).toHaveBeenCalledWith('AF')
    expect(screen.queryByRole('button', { name: /中国香港/ })).toBeNull()
    expect(screen.getByText('中国香港')).toBeVisible()
  })

  it('renders unheaded signature labels only for priority countries', () => {
    const { rerender } = render(
      <CountrySignatureLabels signature={country('CN').profile.signature} />,
    )

    expect(screen.getByText('大熊猫')).toBeVisible()
    expect(screen.queryByText('国家名片')).toBeNull()
    expect(screen.queryByText(/大熊猫主要生活/)).toBeNull()

    rerender(
      <CountrySignatureLabels signature={country('LK').profile.signature} />,
    )
    expect(
      document.querySelector('.knowledge-country-signature-labels'),
    ).toBeNull()
  })

  it('hides non-substantive natural resources', () => {
    renderSections('VA')

    expect(screen.queryByRole('button', { name: /自然资源/ })).toBeNull()
    expect(screen.getByRole('button', { name: /经济产业/ })).toBeVisible()
  })
})
