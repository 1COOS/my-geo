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
        onSelectCountry={onSelectCountry}
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
        onSelectCountry={onSelectCountry}
      />
    </MemoryRouter>,
  )
}

describe('CountryDetailPanel', () => {
  it('renders the continuous featured-country knowledge structure', async () => {
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
    expect(screen.getByText('14.1亿人')).toBeInTheDocument()
    expect(screen.queryByText('约 14.1亿 人')).not.toBeInTheDocument()
    expect(screen.queryByText('2025 年')).not.toBeInTheDocument()
    expect(screen.getByText('人民币 CNY ¥')).toBeInTheDocument()
    expect(screen.getByText('Chinese yuan')).toBeInTheDocument()
    expect(screen.queryByText('次区域')).not.toBeInTheDocument()
    expect(screen.queryByText('Eastern Asia')).not.toBeInTheDocument()
    const facts = document.querySelector('.knowledge-country-facts')
    expect(facts).not.toBeNull()
    expect(
      Array.from(facts!.querySelectorAll(':scope > div > dt')).map(
        (label) => label.textContent,
      ),
    ).toEqual(['人口', '面积', '首都', '法币'])
    expect(facts!.querySelectorAll(':scope > div > dt svg')).toHaveLength(4)
    expect(
      Array.from(facts!.querySelectorAll(':scope > div > dt .sr-only')).map(
        (label) => label.textContent,
      ),
    ).toEqual(['人口', '面积', '首都', '法币'])
    expect(facts!.querySelector('.is-languages')).toBeNull()
    expect(screen.getByText('珠穆朗玛峰')).toBeInTheDocument()
    expect(screen.getByText('大熊猫')).toBeInTheDocument()
    expect(screen.queryByText('国家名片')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /语言民族/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await userEvent.click(screen.getByRole('button', { name: /语言民族/ }))
    expect(screen.getByText('中文')).toBeInTheDocument()
    expect(screen.queryByText('Chinese')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /国际关系/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await userEvent.click(screen.getByRole('button', { name: /国际关系/ }))
    expect(screen.getByText('中国香港')).toBeInTheDocument()
    expect(screen.getByText('中国澳门')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /在图鉴中学习/ })).toHaveAttribute(
      'href',
      '/knowledge/countries/east-asia?country=CN',
    )
    expect(screen.queryByText('国家画像')).not.toBeInTheDocument()
    expect(screen.queryByText('首都与主要城市')).not.toBeInTheDocument()
    expect(screen.queryByText('相邻国家与地区')).not.toBeInTheDocument()
    expect(screen.queryByText('名称信息')).not.toBeInTheDocument()
    expect(screen.queryByText(/资料来源/)).not.toBeInTheDocument()
  })

  it('renders a complete non-featured microstate card', async () => {
    renderCountry('VA')

    expect(screen.getByText(/梵蒂冈城国/)).toBeInTheDocument()
    expect(screen.getByText('0.44 km²')).toBeInTheDocument()
    expect(screen.getByText('882人')).toBeInTheDocument()
    expect(screen.queryByText('2024 年')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /语言民族/ }))
    expect(screen.getByText('拉丁语')).toBeInTheDocument()
    expect(screen.queryByText('Latin')).not.toBeInTheDocument()
    expect(
      document.querySelector('.knowledge-country-signature-labels'),
    ).toBeNull()
    expect(screen.queryByText('海陆属性')).not.toBeInTheDocument()
    expect(screen.queryByText('更多内容制作中')).not.toBeInTheDocument()
  })

  it('shows all capitals without a nested expansion', () => {
    renderCountry('ZA')
    const capitalFact = document.querySelector('.is-capital')
    expect(capitalFact).not.toBeNull()

    expect(capitalFact).toHaveTextContent('比勒陀利亚')
    expect(capitalFact).toHaveTextContent('布隆方丹')
    expect(capitalFact).toHaveTextContent('开普敦')
    expect(screen.queryByRole('button', { name: /查看全部首都/ })).toBeNull()
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
      screen.queryByText('Democratic Socialist Republic of Sri Lanka'),
    ).not.toBeInTheDocument()
    expect(heading!.querySelector('small')).toHaveAttribute(
      'title',
      'Democratic Socialist Republic of Sri Lanka',
    )
    expect(
      screen.getByRole('link', { name: /在图鉴中学习/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /在图鉴中学习/ }),
    ).toHaveTextContent('图鉴')
    expect(
      screen.getByRole('link', { name: /在图鉴中学习/ }).querySelector('svg'),
    ).toBeNull()
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

    await userEvent.click(screen.getByRole('button', { name: /国际关系/ }))

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

  it('keeps adjacent regions as non-interactive labels', async () => {
    renderCountry('CN')

    await userEvent.click(screen.getByRole('button', { name: /国际关系/ }))

    expect(screen.queryByRole('button', { name: /中国香港/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /中国澳门/ })).toBeNull()
  })

  it('shows every city as a static bilingual row', async () => {
    renderCountry('CN')

    await userEvent.click(screen.getByRole('button', { name: /^主要城市/ }))

    const cityRows = Array.from(
      document.querySelectorAll('.knowledge-country-city-row'),
    )
    expect(cityRows.map((row) => row.textContent)).toEqual([
      '北京Beijing',
      '上海Shanghai',
      '广州Guangzhou',
      '深圳Shenzhen',
      '成都Chengdu',
    ])
    expect(screen.queryByRole('button', { name: /探索城市/ })).toBeNull()
    expect(
      screen.queryByRole('button', { name: /查看全部主要城市/ }),
    ).not.toBeInTheDocument()
  })

  it('shows all chapter languages and fact currencies without nested expansion', async () => {
    renderCountry('ZW')

    await userEvent.click(screen.getByRole('button', { name: /语言民族/ }))
    expect(screen.getByText(/卡兰加语/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /查看全部语言/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('欧元 EUR €')).toBeInTheDocument()
    expect(screen.getByText('Euro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /查看全部货币/ })).toBeNull()
  })
})
