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

    const people = screen.getByRole('button', { name: /语言民族/ })
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
    expect(people).toHaveTextContent('中文 · 汉族')
    expect(screen.getByText('中文')).toBeVisible()
    expect(screen.queryByText('Chinese')).toBeNull()
    expect(
      screen.queryByRole('button', { name: /查看全部主要民族/ }),
    ).toBeNull()
    expect(screen.getByText('维吾尔族')).toBeVisible()
    expect(screen.getByText(/汉族 约91\.1%/)).toBeVisible()
    expect(screen.queryByText(/2021/)).toBeNull()

    await userEvent.click(resources)
    expect(resources).toHaveAttribute('aria-expanded', 'true')
    expect(people).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('能源')).toBeVisible()
    expect(screen.getByText('矿产')).toBeVisible()
    const resourcesSection = document.querySelector(
      '.knowledge-country-chapter.is-resources',
    )
    expect(resourcesSection).toHaveTextContent('铁矿石')
    expect(resourcesSection).toHaveTextContent('锌')
    expect(resourcesSection).not.toHaveTextContent('铅')

    await userEvent.click(resources)
    expect(resources).toHaveAttribute('aria-expanded', 'false')
  })

  it('uses fixed disclosure slots and compact labels in every chapter', async () => {
    renderSections('CN')

    expect(
      document.querySelectorAll('.knowledge-country-chapter-disclosure'),
    ).toHaveLength(4)
    expect(
      document.querySelectorAll('.knowledge-country-chapter-icon'),
    ).toHaveLength(4)

    const labels = () =>
      Array.from(
        document.querySelectorAll('.knowledge-country-info-label'),
      ).map((item) => item.textContent)

    await userEvent.click(screen.getByRole('button', { name: /语言民族/ }))
    expect(labels()).toEqual(['语言', '民族', '宗教'])
    expect(
      document.querySelector<HTMLElement>('.knowledge-country-info-label')
        ?.style.background,
    ).toBe('var(--country-card-info-icon-bg)')
    expect(
      document.querySelector<HTMLElement>('.knowledge-country-info-label')
        ?.style.width,
    ).toBe('2rem')
    expect(
      document.querySelector<HTMLElement>('.knowledge-country-info-label')
        ?.style.minHeight,
    ).toBe('')
    expect(
      document.querySelector<HTMLElement>('.knowledge-country-info-label')
        ?.style.height,
    ).toBe('1.4rem')
    expect(
      document.querySelector<HTMLElement>('.knowledge-country-info-label')
        ?.style.fontSize,
    ).toBe('0.625rem')

    await userEvent.click(screen.getByRole('button', { name: /自然资源/ }))
    expect(labels()).toEqual(['能源', '矿产', '土地'])

    await userEvent.click(screen.getByRole('button', { name: /经济产业/ }))
    expect(labels()).toEqual(['农业', '工业'])

    await userEvent.click(screen.getByRole('button', { name: /城市邻国/ }))
    expect(labels()).toEqual(['城市', '区位', '邻国', '地区'])
  })

  it('keeps chapter summaries inline and prioritizes a non-capital city', () => {
    const china = country('CN')
    const { rerender } = render(
      <CountryKnowledgeSections
        key="CN"
        country={china}
        cities={getCitiesForCountry('CN')}
        onSelectCountry={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /语言民族/ })).toHaveTextContent(
      '语言民族中文 · 汉族',
    )
    const title = screen
      .getByRole('button', { name: /语言民族/ })
      .querySelector<HTMLElement>('strong')
    const summary = screen
      .getByRole('button', { name: /语言民族/ })
      .querySelector<HTMLElement>('small')
    expect(title?.style.minWidth).toBe('4.25rem')
    expect(title?.style.fontSize).toBe('var(--fs-s)')
    expect(summary?.style.fontSize).toBe('var(--fs-s)')
    expect(
      screen.getByRole('button', { name: /语言民族/ }),
    ).not.toHaveTextContent('民间宗教')
    expect(screen.getByRole('button', { name: /城市邻国/ })).toHaveTextContent(
      '上海 · 邻国14个',
    )

    const russia = country('RU')
    rerender(
      <CountryKnowledgeSections
        key="RU"
        country={russia}
        cities={getCitiesForCountry('RU')}
        onSelectCountry={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /城市邻国/ })).toHaveTextContent(
      '圣彼得堡 · 邻国14个',
    )

    const singapore = country('SG')
    rerender(
      <CountryKnowledgeSections
        key="SG"
        country={singapore}
        cities={getCitiesForCountry('SG')}
        onSelectCountry={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /城市邻国/ })).toHaveTextContent(
      '新加坡 · 邻国0个',
    )
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

    expect(screen.getByRole('button', { name: /语言民族/ })).toHaveAttribute(
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

  it('hides empty demographic rows and renders every reviewed signature', async () => {
    const { rerender } = render(
      <CountryKnowledgeSections
        key="BD"
        country={country('BD')}
        cities={getCitiesForCountry('BD')}
        onSelectCountry={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /语言民族/ }))
    expect(screen.queryByText('民族', { exact: true })).toBeNull()
    expect(screen.getByText('宗教', { exact: true })).toBeVisible()

    rerender(
      <CountrySignatureLabels signature={country('AU').profile.signature} />,
    )
    for (const label of ['袋鼠', '考拉', '鸭嘴兽', '大堡礁', '悉尼歌剧院']) {
      expect(screen.getByText(label, { exact: true })).toBeVisible()
    }
    expect(
      document.querySelectorAll('.knowledge-country-signature-labels li'),
    ).toHaveLength(5)
  })
})
