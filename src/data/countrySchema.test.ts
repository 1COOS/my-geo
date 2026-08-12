import { describe, expect, it } from 'vitest'

import { countrySchema } from './countrySchema'

describe('countrySchema', () => {
  it('accepts reviewed country data', () => {
    const country = countrySchema.parse({
      code: 'CN',
      name: { zh: '中国', en: 'China' },
      capital: { name: '北京', latitude: 39.9042, longitude: 116.4074 },
      flagAsset: '/flags/cn.svg',
      facts: ['拥有多样的地形与气候。'],
    })

    expect(country.code).toBe('CN')
  })

  it('rejects invalid coordinates and remote flag URLs', () => {
    const result = countrySchema.safeParse({
      code: 'XX',
      name: { zh: '示例', en: 'Example' },
      capital: { name: '示例城', latitude: 100, longitude: 200 },
      flagAsset: 'https://example.com/flag.svg',
      facts: [],
    })

    expect(result.success).toBe(false)
  })
})
