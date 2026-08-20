import { render, screen } from '@testing-library/react'
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
})
