import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CountryFlag } from './CountryFlag'

describe('CountryFlag', () => {
  it('keeps the layout slot separate from the accessible flag image', () => {
    render(
      <CountryFlag
        className="featured-flag"
        src="/flags/de.svg"
        alt="德国国旗"
      />,
    )

    const image = screen.getByRole('img', { name: '德国国旗' })
    expect(image).toHaveClass('country-flag-image')
    expect(image).toHaveAttribute('src', '/flags/de.svg')
    expect(image.parentElement).toHaveClass(
      'country-flag-frame',
      'featured-flag',
    )
  })

  it('preserves decorative empty alternative text', () => {
    const { container } = render(<CountryFlag src="/flags/ch.svg" alt="" />)

    const image = container.querySelector('img')
    expect(image).toHaveAttribute('alt', '')
    expect(image?.parentElement).toHaveClass('country-flag-frame')
  })

  it.each([
    {
      src: '/flags/ch.svg',
      naturalWidth: 1,
      naturalHeight: 1,
      width: '66.66666666666666%',
      height: '100%',
    },
    {
      src: '/flags/qa.svg',
      naturalWidth: 28,
      naturalHeight: 11,
      width: '100%',
      height: '58.92857142857143%',
    },
  ])(
    'sizes $src inside the 3:2 slot without stretching it',
    ({ src, naturalWidth, naturalHeight, width, height }) => {
      const { container } = render(<CountryFlag src={src} alt="" />)
      const image = container.querySelector('img')!
      Object.defineProperties(image, {
        naturalWidth: { configurable: true, value: naturalWidth },
        naturalHeight: { configurable: true, value: naturalHeight },
      })

      fireEvent.load(image)

      expect(image.style.width).toBe(width)
      expect(image.style.height).toBe(height)
    },
  )
})
