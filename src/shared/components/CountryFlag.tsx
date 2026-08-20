type CountryFlagProps = {
  src: string
  alt: string
  className?: string
}

export function CountryFlag({ src, alt, className }: CountryFlagProps) {
  const frameClassName = className
    ? `country-flag-frame ${className}`
    : 'country-flag-frame'

  return (
    <span className={frameClassName}>
      <img className="country-flag-image" src={src} alt={alt} />
    </span>
  )
}
