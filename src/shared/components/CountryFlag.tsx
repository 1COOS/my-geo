import { useState, type CSSProperties, type SyntheticEvent } from 'react'

type CountryFlagProps = {
  src: string
  alt: string
  className?: string
}

type LoadedFlagSize = {
  src: string
  style: CSSProperties
}

const flagSlotAspectRatio = 3 / 2

export function CountryFlag({ src, alt, className }: CountryFlagProps) {
  const [loadedSize, setLoadedSize] = useState<LoadedFlagSize>()
  const frameClassName = className
    ? `country-flag-frame ${className}`
    : 'country-flag-frame'
  const imageStyle = loadedSize?.src === src ? loadedSize.style : undefined

  const sizeLoadedFlag = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (naturalWidth <= 0 || naturalHeight <= 0) return

    const aspectRatio = naturalWidth / naturalHeight
    setLoadedSize({
      src,
      style:
        aspectRatio >= flagSlotAspectRatio
          ? {
              width: '100%',
              height: `${(flagSlotAspectRatio / aspectRatio) * 100}%`,
            }
          : {
              width: `${(aspectRatio / flagSlotAspectRatio) * 100}%`,
              height: '100%',
            },
    })
  }

  return (
    <span className={frameClassName}>
      <img
        className="country-flag-image"
        src={src}
        alt={alt}
        style={imageStyle}
        onLoad={sizeLoadedFlag}
      />
    </span>
  )
}
