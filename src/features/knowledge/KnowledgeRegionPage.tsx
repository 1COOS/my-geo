import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { getCountry } from '../../data/countries'
import {
  getCountriesForKnowledgeRegion,
  getKnowledgeRegion,
  getKnowledgeRegionsForContinent,
  knowledgeContinents,
  knowledgeRegionByCountryCode,
  type KnowledgeRegion,
  type KnowledgeRegionId,
} from '../../data/knowledgeRegions'
import { CountryFlag } from '../../shared/components/CountryFlag'
import { KnowledgeCountryDetail } from './KnowledgeCountryDetail'
import { KnowledgeDetailLayout } from './KnowledgeDetailLayout'
import { KnowledgeRegionMap } from './KnowledgeRegionMap'
import { KnowledgeRegionOverviewCard } from './KnowledgeRegionOverviewCard'

type CountryCardField = 'country' | 'flag' | 'capital'

const countryCardFields: Array<{
  id: CountryCardField
  label: string
}> = [
  { id: 'flag', label: '国旗' },
  { id: 'country', label: '国家' },
  { id: 'capital', label: '首都' },
]

const countryFieldMenuHeight = 148

function readCountryFieldMenuGap() {
  const probe = document.createElement('span')
  probe.style.position = 'fixed'
  probe.style.visibility = 'hidden'
  probe.style.width = 'var(--layout-gap)'
  probe.style.pointerEvents = 'none'
  document.body.append(probe)
  const value = probe.getBoundingClientRect().width
  probe.remove()
  return value > 0 ? value : 8
}

type CountryFieldMenuPlacement = {
  collapsed: boolean
  panelLeft: number
  panelTop: number
  triggerLeft: number
  triggerTop: number
  width: number
}

function getCountryFieldMenuPlacement(): CountryFieldMenuPlacement {
  const navigation = document.querySelector<HTMLElement>('.app-navigation')
  if (!navigation) {
    return {
      collapsed: false,
      panelLeft: 0,
      panelTop: 0,
      triggerLeft: 0,
      triggerTop: 0,
      width: 56,
    }
  }

  const navigationBounds = navigation.getBoundingClientRect()
  const countryFieldMenuGap = readCountryFieldMenuGap()
  const countryFieldMenuMinimumSpace =
    countryFieldMenuHeight + countryFieldMenuGap
  const viewportHeight =
    window.visualViewport?.height ?? document.documentElement.clientHeight
  const remainingHeight = viewportHeight - navigationBounds.bottom
  const collapsed = remainingHeight < countryFieldMenuMinimumSpace
  const triggerTop = navigationBounds.bottom + countryFieldMenuGap
  const panelTop = collapsed
    ? Math.max(
        countryFieldMenuGap,
        Math.min(
          triggerTop,
          viewportHeight - countryFieldMenuHeight - countryFieldMenuGap,
        ),
      )
    : triggerTop

  return {
    collapsed,
    panelLeft: collapsed
      ? navigationBounds.right + countryFieldMenuGap
      : navigationBounds.left,
    panelTop,
    triggerLeft: navigationBounds.left,
    triggerTop,
    width: navigationBounds.width,
  }
}

function placementsMatch(
  current: CountryFieldMenuPlacement,
  next: CountryFieldMenuPlacement,
) {
  return (
    current.collapsed === next.collapsed &&
    current.panelLeft === next.panelLeft &&
    current.panelTop === next.panelTop &&
    current.triggerLeft === next.triggerLeft &&
    current.triggerTop === next.triggerTop &&
    current.width === next.width
  )
}

function useCountryFieldMenuPlacement() {
  const [placement, setPlacement] = useState<CountryFieldMenuPlacement>(() => ({
    collapsed: false,
    panelLeft: 0,
    panelTop: 0,
    triggerLeft: 0,
    triggerTop: 0,
    width: 56,
  }))

  useLayoutEffect(() => {
    const updatePlacement = () => {
      const next = getCountryFieldMenuPlacement()
      setPlacement((current) =>
        placementsMatch(current, next) ? current : next,
      )
    }
    const navigation = document.querySelector<HTMLElement>('.app-navigation')
    const resizeObserver =
      navigation && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updatePlacement)
        : null

    updatePlacement()
    if (navigation) resizeObserver?.observe(navigation)
    window.addEventListener('resize', updatePlacement)
    window.visualViewport?.addEventListener('resize', updatePlacement)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updatePlacement)
      window.visualViewport?.removeEventListener('resize', updatePlacement)
    }
  }, [])

  return placement
}

function CountryCardFieldIcon({ field }: { field: CountryCardField | 'menu' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {field === 'flag' ? (
        <>
          <path d="M6 21V4" />
          <path d="M7 5h10l-2 3 2 3H7" />
        </>
      ) : field === 'country' ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" />
        </>
      ) : field === 'capital' ? (
        <>
          <path d="M4 20h16M6 18V9l6-4 6 4v9M9 18v-6M12 18v-6M15 18v-6" />
        </>
      ) : (
        <>
          <path d="M5 7h14M5 12h14M5 17h14" />
          <circle cx="8" cy="7" r="1.4" />
          <circle cx="15" cy="12" r="1.4" />
          <circle cx="10" cy="17" r="1.4" />
        </>
      )}
    </svg>
  )
}

type CountryCardFieldMenuProps = {
  onToggle: (field: CountryCardField) => void
  visibleFields: Set<CountryCardField>
}

function CountryCardFieldButtons({
  onToggle,
  visibleFields,
}: CountryCardFieldMenuProps) {
  return countryCardFields.map((field) => {
    const active = visibleFields.has(field.id)
    return (
      <button
        key={field.id}
        type="button"
        aria-pressed={active}
        disabled={active && visibleFields.size === 1}
        onClick={() => onToggle(field.id)}
      >
        <CountryCardFieldIcon field={field.id} />
        <span>{field.label}</span>
      </button>
    )
  })
}

function CompactCountryCardFieldMenu({
  onToggle,
  placement,
  visibleFields,
}: CountryCardFieldMenuProps & {
  placement: CountryFieldMenuPlacement
}) {
  const menuId = useId()
  const [compactMenuOpen, setCompactMenuOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!compactMenuOpen) return

    const closeMenu = () => {
      setCompactMenuOpen(false)
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      closeMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeMenu()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [compactMenuOpen])

  return (
    <>
      <button
        ref={triggerRef}
        className="knowledge-country-menu-trigger"
        type="button"
        aria-controls={menuId}
        aria-expanded={compactMenuOpen}
        aria-label="显示国家卡内容"
        style={{
          top: placement.triggerTop,
          left: placement.triggerLeft,
          width: placement.width,
        }}
        onClick={() => setCompactMenuOpen((current) => !current)}
      >
        <CountryCardFieldIcon field="menu" />
        <span>显示</span>
      </button>

      <div
        ref={panelRef}
        id={menuId}
        className="knowledge-country-display-controls"
        role="group"
        aria-label="国家卡显示内容"
        hidden={!compactMenuOpen}
        style={{
          top: placement.panelTop,
          left: placement.panelLeft,
          width: placement.width,
        }}
      >
        <CountryCardFieldButtons
          visibleFields={visibleFields}
          onToggle={onToggle}
        />
      </div>
    </>
  )
}

function CountryCardFieldMenu({
  onToggle,
  visibleFields,
}: CountryCardFieldMenuProps) {
  const placement = useCountryFieldMenuPlacement()

  return (
    <div
      className="knowledge-country-field-menu"
      data-collapsed={placement.collapsed ? 'true' : 'false'}
    >
      {placement.collapsed ? (
        <CompactCountryCardFieldMenu
          placement={placement}
          visibleFields={visibleFields}
          onToggle={onToggle}
        />
      ) : (
        <div
          className="knowledge-country-display-controls"
          role="group"
          aria-label="国家卡显示内容"
          style={{
            top: placement.panelTop,
            left: placement.panelLeft,
            width: placement.width,
          }}
        >
          <CountryCardFieldButtons
            visibleFields={visibleFields}
            onToggle={onToggle}
          />
        </div>
      )}
    </div>
  )
}

function KnowledgeRegionSwitcher({
  continentName,
  currentRegionId,
  regions,
}: {
  continentName: string
  currentRegionId: KnowledgeRegionId
  regions: readonly KnowledgeRegion[]
}) {
  const switcherRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const switcher = switcherRef.current
    const activeRegion = switcher?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    )
    if (!switcher || !activeRegion) return

    const visibleStart = switcher.scrollTop
    const visibleEnd = visibleStart + switcher.clientHeight
    const activeStart = activeRegion.offsetTop
    const activeEnd = activeStart + activeRegion.offsetHeight
    let nextScrollTop = visibleStart

    if (activeStart < visibleStart) nextScrollTop = activeStart
    else if (activeEnd > visibleEnd) {
      nextScrollTop = activeEnd - switcher.clientHeight
    }

    if (nextScrollTop === visibleStart) return
    if (typeof switcher.scrollTo === 'function') {
      switcher.scrollTo({ top: nextScrollTop, behavior: 'auto' })
    } else {
      switcher.scrollTop = nextScrollTop
    }
  }, [currentRegionId, regions.length])

  return (
    <nav
      ref={switcherRef}
      className="knowledge-region-switcher"
      aria-label={`${continentName}子区域`}
    >
      {regions.map((region) => (
        <Link
          key={region.id}
          to={`/knowledge/countries/${region.id}`}
          aria-current={region.id === currentRegionId ? 'page' : undefined}
          style={
            {
              '--knowledge-region-switcher-accent': region.accent,
            } as CSSProperties
          }
        >
          <strong>{region.name.zh}</strong>
          <small>{region.countryCodes.length}国</small>
        </Link>
      ))}
    </nav>
  )
}

export function KnowledgeRegionPage() {
  const { regionId: rawRegionId } = useParams()
  const navigate = useNavigate()
  const region = getKnowledgeRegion(rawRegionId)
  const [searchParams, setSearchParams] = useSearchParams()
  const [visibleCardFields, setVisibleCardFields] = useState<
    Set<CountryCardField>
  >(new Set<CountryCardField>(['flag']))

  const regionCountries = useMemo(
    () => (region ? getCountriesForKnowledgeRegion(region.id) : []),
    [region],
  )
  if (!region) return <Navigate to="/knowledge" replace />

  const continent = knowledgeContinents.find(
    (item) => item.id === region.continentId,
  )!
  const continentRegions = getKnowledgeRegionsForContinent(region.continentId)
  const requestedCountry = getCountry(searchParams.get('country'))
  const selectedCountry = region.countryCodes.includes(
    requestedCountry?.code ?? '',
  )
    ? requestedCountry
    : undefined
  const showCountry = visibleCardFields.has('country')
  const showFlag = visibleCardFields.has('flag')
  const showCapital = visibleCardFields.has('capital')
  const countryGridStyle = {
    '--knowledge-country-columns-five': Math.min(regionCountries.length, 5),
    '--knowledge-country-columns-four': Math.min(regionCountries.length, 4),
    '--knowledge-country-columns-three': Math.min(regionCountries.length, 3),
    '--knowledge-country-columns-two': Math.min(regionCountries.length, 2),
  } as CSSProperties

  const toggleCardField = (field: CountryCardField) => {
    setVisibleCardFields((current) => {
      const next = new Set(current)
      if (next.has(field)) {
        if (next.size === 1) return current
        next.delete(field)
      } else {
        next.add(field)
      }
      return next
    })
  }

  const openCountry = (countryCode: string) => {
    const targetRegion = knowledgeRegionByCountryCode.get(countryCode)
    if (!targetRegion) return
    if (targetRegion.id === region.id) {
      setSearchParams({ country: countryCode })
      return
    }
    void navigate(
      `/knowledge/countries/${targetRegion.id}?country=${countryCode}`,
    )
  }

  return (
    <KnowledgeDetailLayout
      mode="flow"
      studyLabel={`${region.name.zh}国家学习`}
      study={
        <div className="knowledge-country-study">
          <h1 className="sr-only">
            {region.name.zh}
            {region.countryCodes.length}国
          </h1>
          <CountryCardFieldMenu
            visibleFields={visibleCardFields}
            onToggle={toggleCardField}
          />
          <div className="knowledge-region-browser">
            <div className="knowledge-region-map-strip">
              <KnowledgeRegionMap
                continentId={region.continentId}
                regionId={region.id}
                selectedCountryCode={selectedCountry?.code}
              />
            </div>
            <KnowledgeRegionSwitcher
              continentName={continent.name.zh}
              currentRegionId={region.id}
              regions={continentRegions}
            />
          </div>
          <div className="knowledge-country-grid" style={countryGridStyle}>
            {regionCountries.map((country) => (
              <article
                className="knowledge-country-card"
                key={country.code}
                data-field-count={visibleCardFields.size}
                data-show-country={showCountry}
                data-show-flag={showFlag}
                data-show-capital={showCapital}
              >
                <button
                  className="knowledge-country-open"
                  type="button"
                  onClick={() => openCountry(country.code)}
                  aria-label={`查看${country.name.zh}国家详情`}
                >
                  {showFlag ? (
                    <CountryFlag
                      src={country.flagAsset}
                      alt={`${country.name.zh}国旗`}
                    />
                  ) : null}
                  {showCountry ? (
                    <span className="knowledge-country-name">
                      <strong>{country.name.zh}</strong>
                      <small>{country.name.en}</small>
                    </span>
                  ) : null}
                  {showCapital ? (
                    <span className="knowledge-country-card-capital">
                      <strong>
                        {country.capitals
                          .map((capital) => capital.name.zh)
                          .join('、') || '暂无资料'}
                      </strong>
                      <small>
                        {country.capitals
                          .map((capital) => capital.name.en)
                          .join(' / ') || 'No data'}
                      </small>
                    </span>
                  ) : null}
                </button>
              </article>
            ))}
          </div>
        </div>
      }
      detail={
        selectedCountry ? (
          <KnowledgeCountryDetail
            country={selectedCountry}
            regionId={region.id}
            onSelectCountry={openCountry}
          />
        ) : (
          <KnowledgeRegionOverviewCard
            continentName={continent.name.zh}
            countries={regionCountries}
            region={region}
          />
        )
      }
    />
  )
}
