import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { getCitiesForCountry, getCountry } from '../../data/countries'
import { CountryDetailPanel } from './CountryDetailPanel'

function renderCountry(code: string, onSelectCountry = vi.fn()) {
  const country = getCountry(code)
  expect(country).toBeDefined()
  render(
    <MemoryRouter>
      <CountryDetailPanel
        country={country!}
        cities={getCitiesForCountry(code)}
        selectedCity={undefined}
        onSelectCountry={onSelectCountry}
        onSelectCity={vi.fn()}
        onBackToCountry={vi.fn()}
      />
    </MemoryRouter>,
  )
  return onSelectCountry
}

function renderCountryData(
  country: NonNullable<ReturnType<typeof getCountry>>,
  onSelectCountry = vi.fn(),
) {
  render(
    <MemoryRouter>
      <CountryDetailPanel
        country={country}
        cities={getCitiesForCountry(country.code)}
        selectedCity={undefined}
        onSelectCountry={onSelectCountry}
        onSelectCity={vi.fn()}
        onBackToCountry={vi.fn()}
      />
    </MemoryRouter>,
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
    <MemoryRouter>
      <CountryDetailPanel
        country={country!}
        cities={cities}
        selectedCity={city}
        onSelectCountry={vi.fn()}
        onSelectCity={vi.fn()}
        onBackToCountry={onBackToCountry}
      />
    </MemoryRouter>,
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
    const flag = screen.getByAltText('中国国旗')
    expect(flag).toHaveClass('country-flag-image')
    expect(flag.parentElement).toHaveClass(
      'country-flag-frame',
      'knowledge-country-detail-flag',
    )
    expect(screen.getByText(/中华人民共和国/)).toBeInTheDocument()
    expect(screen.getAllByText('北京').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('约 14.1亿 人')).toBeInTheDocument()
    expect(screen.queryByText('2025 年')).not.toBeInTheDocument()
    expect(screen.getByText('人民币')).toBeInTheDocument()
    expect(screen.getByText(/CNY/)).toBeInTheDocument()
    expect(screen.queryByText('次区域')).not.toBeInTheDocument()
    expect(screen.queryByText('Eastern Asia')).not.toBeInTheDocument()
    const facts = document.querySelector('.knowledge-country-facts')
    expect(facts).not.toBeNull()
    expect(
      Array.from(facts!.querySelectorAll(':scope > div > dt')).map(
        (label) => label.textContent,
      ),
    ).toEqual(['面积', '人口', '首都', '货币', '语言'])
    expect(facts!.querySelectorAll(':scope > div > dt svg')).toHaveLength(5)
    expect(
      Array.from(facts!.querySelectorAll(':scope > div > dt .sr-only')).map(
        (label) => label.textContent,
      ),
    ).toEqual(['面积', '人口', '首都', '货币', '语言'])
    expect(facts!.querySelector('.is-languages')).toHaveClass(
      'knowledge-country-fact',
      'is-languages',
    )
    expect(screen.getByText('中国香港')).toBeInTheDocument()
    expect(screen.getByText('中国澳门')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /在知识体系中学习/ }),
    ).toHaveAttribute('href', '/knowledge/countries/east-asia?country=CN')
    expect(screen.queryByText(/资料来源/)).not.toBeInTheDocument()
  })

  it('renders a complete non-featured microstate card', () => {
    renderCountry('VA')

    expect(screen.getByText(/梵蒂冈城国/)).toBeInTheDocument()
    expect(screen.getByText('0.44 km²')).toBeInTheDocument()
    expect(screen.getByText('约 882 人')).toBeInTheDocument()
    expect(screen.queryByText('2024 年')).not.toBeInTheDocument()
    expect(screen.getByText('拉丁语')).toBeInTheDocument()
    expect(screen.queryByText('海陆属性')).not.toBeInTheDocument()
    expect(screen.queryByText('更多内容制作中')).not.toBeInTheDocument()
  })

  it('keeps multiple capitals compact and expandable', async () => {
    renderCountry('ZA')
    const capitalFact = document.querySelector('.is-capital')
    expect(capitalFact).not.toBeNull()

    expect(capitalFact).toHaveTextContent('比勒陀利亚')
    expect(capitalFact).not.toHaveTextContent('布隆方丹')
    expect(capitalFact).not.toHaveTextContent('开普敦')

    const expand = screen.getByRole('button', {
      name: '查看全部首都（3）',
    })
    expect(expand).toHaveTextContent('+2')
    await userEvent.click(expand)

    expect(capitalFact).toHaveTextContent('布隆方丹')
    expect(capitalFact).toHaveTextContent('开普敦')
  })

  it('uses the compact Sri Lanka heading hierarchy', () => {
    renderCountry('LK')

    const heading = document.querySelector('.knowledge-country-summary-heading')
    expect(heading).not.toBeNull()
    expect(heading).toHaveTextContent('斯里兰卡')
    expect(heading).toHaveTextContent('LK · LKA')
    expect(heading).toHaveTextContent('Sri Lanka')
    expect(heading).toHaveTextContent('南亚 · 斯里兰卡民主社会主义共和国')
    expect(heading).not.toHaveTextContent('亚洲')
    expect(heading).not.toHaveTextContent(
      'Democratic Socialist Republic of Sri Lanka',
    )
    const englishLine = heading!.querySelector('p')
    expect(
      Array.from(englishLine!.children).map((item) => item.textContent),
    ).toEqual(['Sri Lanka', '·', 'LK · LKA'])
    expect(
      screen.getByText('Democratic Socialist Republic of Sri Lanka'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /在知识体系中学习/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /在知识体系中学习/ }),
    ).toHaveTextContent('')
    expect(
      screen
        .getByRole('link', { name: /在知识体系中学习/ })
        .querySelector('svg'),
    ).not.toBeNull()
    expect(document.querySelector('.knowledge-card-footer')).toBeNull()
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
    const neighbourFlag = screen
      .getByRole('button', { name: '探索邻国意大利' })
      .querySelector('img')
    expect(neighbourFlag).toHaveClass('country-flag-image')
    expect(neighbourFlag?.parentElement).toHaveClass('country-flag-frame')
  })

  it('keeps adjacent regions as non-interactive labels', () => {
    renderCountry('CN')

    expect(screen.queryByRole('button', { name: /中国香港/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /中国澳门/ })).toBeNull()
  })

  it('keeps long city lists compact and keyboard-expandable', async () => {
    renderCountry('CN')

    expect(
      screen.getByRole('button', { name: '探索城市北京' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '探索城市上海' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '探索城市成都' })).toBeNull()

    const expand = screen.getByRole('button', {
      name: '查看全部主要城市（5）',
    })
    expect(expand).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(expand)

    expect(expand).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('button', { name: '探索城市成都' }),
    ).toBeInTheDocument()
  })

  it('keeps long language and currency lists expandable', async () => {
    renderCountry('ZW')

    expect(screen.queryByText('卡兰加语')).not.toBeInTheDocument()
    expect(
      document.querySelectorAll('.knowledge-language-list > li'),
    ).toHaveLength(2)
    const languageExpand = screen.getByRole('button', {
      name: '查看全部语言（15）',
    })
    expect(languageExpand).toHaveTextContent('+13')
    await userEvent.click(languageExpand)
    expect(screen.getByText('卡兰加语')).toBeInTheDocument()
    expect(
      document.querySelectorAll('.knowledge-language-list > li'),
    ).toHaveLength(15)
    expect(screen.queryByText('欧元')).not.toBeInTheDocument()

    const currencyExpand = screen.getByRole('button', {
      name: '查看全部货币（9）',
    })
    expect(currencyExpand).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(currencyExpand)

    expect(currencyExpand).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('欧元')).toBeInTheDocument()
    expect(screen.getByText(/EUR/)).toBeInTheDocument()
  })

  it('switches to a city knowledge card with population and reasons', async () => {
    const onBackToCountry = renderSelectedCity('CN', 'cn-shanghai')

    expect(screen.getByLabelText('上海城市知识卡')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '上海' })).toBeInTheDocument()
    expect(screen.getByText(/约 2407.3万 人/)).toBeInTheDocument()
    expect(screen.queryByText(/31\.1667°N/)).not.toBeInTheDocument()
    expect(screen.getByText('经济中心')).toBeInTheDocument()
    expect(screen.getByText('世界知名')).toBeInTheDocument()
    expect(screen.queryByText(/资料来源/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '← 返回中国' }))
    expect(onBackToCountry).toHaveBeenCalledOnce()
  })
})
