import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { cities, countries } from '../../data/countries'
import { climateLearningTopic, climateTypes } from '../../data/climateLearning'
import { deserts } from '../../data/deserts'
import {
  geographyReferenceLines,
  geographyTopics,
} from '../../data/geographyLearning'
import { landmarks, landmarkCategoryLabels } from '../../data/landmarks'
import {
  linearGeoFeatureKindLabels,
  linearGeoFeatures,
} from '../../data/linearGeoFeatures'
import { mountainRanges } from '../../data/mountainRanges'
import { waterbodies, waterbodyKindLabels } from '../../data/waterbodies'
import { searchPlaces, type PlaceSearchResult } from './countrySearchUtils'

type CountrySearchProps = {
  selectedLabel?: string
  onSelect: (result: PlaceSearchResult) => void
  autoFocus?: boolean
  onRequestClose?: () => void
}

function resultId(result: PlaceSearchResult) {
  if (result.type === 'country') return `country-${result.country.code}`
  if (result.type === 'city') return `city-${result.city.id}`
  if (result.type === 'linearFeature') return `linear-${result.feature.id}`
  if (result.type === 'mountainRange') return `mountain-${result.range.id}`
  if (result.type === 'desert') return `desert-${result.desert.id}`
  if (result.type === 'landmark') return `landmark-${result.landmark.id}`
  if (result.type === 'geographyTopic')
    return `geography-${result.referenceLine?.id ?? result.topic.id}`
  if (result.type === 'climateTopic') return `climate-${result.topic.id}`
  if (result.type === 'climateType')
    return `climate-type-${result.climateType.id}`
  return `waterbody-${result.waterbody.id}`
}

export function CountrySearch({
  selectedLabel,
  onSelect,
  autoFocus = false,
  onRequestClose,
}: CountrySearchProps) {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(selectedLabel ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const results = useMemo(
    () =>
      searchPlaces(
        countries,
        cities,
        waterbodies,
        linearGeoFeatures,
        mountainRanges,
        query,
        8,
        deserts,
        landmarks,
        geographyTopics,
        geographyReferenceLines,
        climateLearningTopic,
        climateTypes,
      ),
    [query],
  )
  const activeResult = results[activeIndex]

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus])

  function chooseResult(result: PlaceSearchResult) {
    onSelect(result)
    setQuery(
      result.type === 'country'
        ? result.country.name.zh
        : result.type === 'city'
          ? result.city.name.zh
          : result.type === 'waterbody'
            ? result.waterbody.name.zh
            : result.type === 'linearFeature'
              ? result.feature.name.zh
              : result.type === 'mountainRange'
                ? result.range.name.zh
                : result.type === 'desert'
                  ? result.desert.name.zh
                  : result.type === 'landmark'
                    ? result.landmark.name.zh
                    : result.type === 'geographyTopic'
                      ? (result.referenceLine?.name.zh ?? result.topic.name.zh)
                      : result.type === 'climateType'
                        ? result.climateType.name.zh
                        : result.topic.name.zh,
    )
    setOpen(false)
    setActiveIndex(0)
    onRequestClose?.()
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
        搜索地点
      </label>
      <div className="country-search-field">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m15.5 15.5 4.2 4.2" />
        </svg>
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          role="combobox"
          type="search"
          value={query}
          placeholder="搜索国家、地点或地理知识"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeResult
              ? `${listboxId}-${resultId(activeResult)}`
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
            } else if (event.key === 'Enter' && activeResult) {
              event.preventDefault()
              chooseResult(activeResult)
            } else if (event.key === 'Escape') {
              event.preventDefault()
              onRequestClose?.()
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
          <ul id={listboxId} role="listbox" aria-label="地点搜索结果">
            {results.map((result, index) => {
              const id = resultId(result)
              const name =
                result.type === 'country'
                  ? result.country.name
                  : result.type === 'city'
                    ? result.city.name
                    : result.type === 'waterbody'
                      ? result.waterbody.name
                      : result.type === 'linearFeature'
                        ? result.feature.name
                        : result.type === 'mountainRange'
                          ? result.range.name
                          : result.type === 'desert'
                            ? result.desert.name
                            : result.type === 'landmark'
                              ? result.landmark.name
                              : result.type === 'geographyTopic'
                                ? (result.referenceLine?.name ??
                                  result.topic.name)
                                : result.type === 'climateType'
                                  ? result.climateType.name
                                  : result.topic.name
              const badge =
                result.type === 'country'
                  ? result.country.code
                  : result.type === 'city'
                    ? result.city.isCapital
                      ? '首都'
                      : '城市'
                    : result.type === 'waterbody'
                      ? waterbodyKindLabels[result.waterbody.kind]
                      : result.type === 'linearFeature'
                        ? linearGeoFeatureKindLabels[result.feature.kind]
                        : result.type === 'mountainRange'
                          ? '山脉'
                          : result.type === 'desert'
                            ? '沙漠'
                            : result.type === 'landmark'
                              ? '古迹'
                              : result.type === 'geographyTopic'
                                ? result.referenceLine
                                  ? '参考线'
                                  : '地理知识'
                                : '气候知识'
              return (
                <li
                  id={`${listboxId}-${id}`}
                  key={id}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className={index === activeIndex ? 'is-active' : ''}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseResult(result)}
                  >
                    {result.type === 'country' ? (
                      <img src={result.country.flagAsset} alt="" />
                    ) : (
                      <span
                        className={`place-result-icon is-${result.type}${result.type === 'linearFeature' ? ` is-${result.feature.kind}` : ''}${result.type === 'waterbody' ? ` is-${result.waterbody.layer}` : ''}`}
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      <strong>{name.zh}</strong>
                      <small>
                        {name.en}
                        {result.type === 'city'
                          ? ` · ${result.country.name.zh}`
                          : result.type === 'waterbody'
                            ? ` · ${result.waterbody.region}`
                            : result.type === 'mountainRange'
                              ? ` · 最高峰：${result.range.highestPeak.name.zh}`
                              : result.type === 'desert'
                                ? ` · ${result.desert.region}`
                                : result.type === 'landmark'
                                  ? ` · ${landmarkCategoryLabels[result.landmark.category]} · ${result.landmark.location.zh}`
                                  : result.type === 'geographyTopic'
                                    ? ` · ${result.topic.name.zh}`
                                    : result.type === 'climateType'
                                      ? ' · 世界气候类型'
                                      : result.type === 'climateTopic'
                                        ? ' · 13类气候总览'
                                        : ''}
                      </small>
                    </span>
                    <code>{badge}</code>
                  </button>
                </li>
              )
            })}
            {results.length === 0 ? (
              <li className="country-search-empty">没有找到这个地点</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
