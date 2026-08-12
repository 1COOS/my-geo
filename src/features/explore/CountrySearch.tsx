import { useId, useMemo, useRef, useState } from 'react'

import { countries } from '../../data/countries'
import type { Country } from '../../data/countrySchema'
import { searchCountries } from './countrySearchUtils'

type CountrySearchProps = {
  selectedCountry: Country | undefined
  onSelect: (countryCode: string) => void
  onClearSelection: () => void
}

export function CountrySearch({
  selectedCountry,
  onSelect,
  onClearSelection,
}: CountrySearchProps) {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(selectedCountry?.name.zh ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => searchCountries(countries, query), [query])
  const activeCountry = results[activeIndex]

  function chooseCountry(country: Country) {
    onSelect(country.code)
    setQuery(country.name.zh)
    setOpen(false)
    setActiveIndex(0)
  }

  return (
    <div
      ref={containerRef}
      className="country-search"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label className="sr-only" htmlFor={`${listboxId}-input`}>
        搜索国家
      </label>
      <div className="country-search-field">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m15.5 15.5 4.2 4.2" />
        </svg>
        <input
          id={`${listboxId}-input`}
          role="combobox"
          type="search"
          value={query}
          placeholder="搜索国家、英文名或 ISO 代码"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeCountry
              ? `${listboxId}-${activeCountry.code}`
              : undefined
          }
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((current) =>
                Math.min(current + 1, Math.max(results.length - 1, 0)),
              )
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((current) => Math.max(current - 1, 0))
            } else if (event.key === 'Enter' && activeCountry) {
              event.preventDefault()
              chooseCountry(activeCountry)
            } else if (event.key === 'Escape') {
              event.preventDefault()
              if (open || query) {
                setQuery('')
                setOpen(false)
                setActiveIndex(0)
              } else if (selectedCountry) {
                onClearSelection()
              }
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className="country-search-clear"
            aria-label="清空搜索"
            onClick={() => {
              setQuery('')
              setActiveIndex(0)
              setOpen(true)
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="country-search-popover">
          <p className="country-search-caption">
            {query ? `找到 ${results.length} 个匹配项` : '精选国家'}
          </p>
          <ul id={listboxId} role="listbox" aria-label="国家搜索结果">
            {results.map((country, index) => (
              <li
                id={`${listboxId}-${country.code}`}
                key={country.code}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  className={index === activeIndex ? 'is-active' : ''}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseCountry(country)}
                >
                  <img src={country.flagAsset} alt="" />
                  <span>
                    <strong>{country.name.zh}</strong>
                    <small>{country.name.en}</small>
                  </span>
                  <code>{country.code}</code>
                </button>
              </li>
            ))}
            {results.length === 0 ? (
              <li className="country-search-empty">没有找到这个国家</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
