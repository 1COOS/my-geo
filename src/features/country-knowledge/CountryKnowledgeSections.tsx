import { useId, useState, type CSSProperties, type ReactNode } from 'react'

import { countriesByCode } from '../../data/countries'
import type { City } from '../../data/citySchema'
import type {
  Country,
  CountryProfile,
  CountrySignatureItem,
} from '../../data/countrySchema'
import { CountryFlag } from '../../shared/components/CountryFlag'

type ChapterId = 'people' | 'resources' | 'economy' | 'places'

type CountryKnowledgeSectionsProps = {
  country: Country
  cities: City[]
  onSelectCountry: (countryCode: string) => void
  onSelectCity?: (cityId: string) => void
}

type Chapter = {
  id: ChapterId
  title: string
  summary: string
  content: ReactNode
}

type KnowledgeRow = {
  label: string
  items: string[]
}

const signatureListStyle = {
  display: 'flex',
  padding: 0,
  margin: '0.75rem 0',
  gap: '0.4rem',
  flexWrap: 'wrap',
  listStyle: 'none',
} satisfies CSSProperties

const signatureTagStyle = {
  padding: '0.34rem 0.55rem',
  color: 'var(--atlas-text)',
  fontSize: 'var(--fs-m)',
  fontWeight: 600,
  background: 'var(--atlas-accent-soft)',
  border: '1px solid var(--atlas-accent)',
  borderRadius: 'var(--atlas-radius-compact)',
} satisfies CSSProperties

const chapterStyle = {
  paddingTop: 0,
  marginTop: '0.65rem',
  borderTop: 0,
} satisfies CSSProperties

const chapterHeadingStyle = { margin: 0 } satisfies CSSProperties

const chapterTriggerBaseStyle = {
  display: 'grid',
  width: '100%',
  minHeight: '2.75rem',
  padding: '0.45rem 0.2rem',
  gridTemplateColumns: '1.15rem minmax(0, 1fr) auto',
  gap: '0.45rem',
  alignItems: 'center',
  textAlign: 'left',
  color: 'var(--atlas-text)',
  cursor: 'pointer',
  border: '1px solid var(--atlas-border)',
  borderRadius: 'var(--atlas-radius-compact)',
} satisfies CSSProperties

const chapterIconStyle = {
  width: '1.05rem',
  height: '1.05rem',
  color: 'var(--atlas-accent)',
} satisfies CSSProperties

const chapterSummaryStyle = {
  display: 'block',
  marginTop: '0.08rem',
  overflow: 'hidden',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-m)',
  fontWeight: 400,
  lineHeight: 1.3,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} satisfies CSSProperties

const chapterContentStyle = {
  padding: '0.35rem 0.2rem 0.15rem',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-b)',
  lineHeight: 'var(--lh-b)',
} satisfies CSSProperties

const infoRowStyle = {
  display: 'grid',
  padding: '0.38rem 0',
  gridTemplateColumns: '2.5rem minmax(0, 1fr)',
  gap: '0.45rem',
  alignItems: 'start',
} satisfies CSSProperties

const infoLabelStyle = {
  color: 'var(--atlas-text-muted)',
  fontSize: 'var(--fs-m)',
  fontWeight: 600,
} satisfies CSSProperties

const inlineValuesStyle = {
  display: 'flex',
  minWidth: 0,
  gap: '0.12rem 0.25rem',
  flexWrap: 'wrap',
} satisfies CSSProperties

const inlineActionsStyle = {
  display: 'flex',
  gap: '0.3rem',
  flexWrap: 'wrap',
} satisfies CSSProperties

const inlineActionStyle = {
  display: 'inline-flex',
  minHeight: '2rem',
  padding: '0.28rem 0.42rem',
  gap: '0.3rem',
  alignItems: 'center',
  color: 'var(--atlas-text-secondary)',
  background: 'var(--atlas-panel-muted)',
  border: '1px solid var(--atlas-border-soft)',
  borderRadius: 'var(--atlas-radius-control)',
} satisfies CSSProperties

const neighbourFlagStyle = { width: '1.2rem' } satisfies CSSProperties

export function CountrySignatureLabels({
  signature,
}: {
  signature: CountrySignatureItem[] | undefined
}) {
  if (!signature) return null

  return (
    <ul
      className="knowledge-country-signature-labels"
      style={signatureListStyle}
    >
      {signature.map((item) => (
        <li key={`${item.kind}-${item.title}`} style={signatureTagStyle}>
          {item.title}
        </li>
      ))}
    </ul>
  )
}

export function CountryKnowledgeSections({
  country,
  cities,
  onSelectCountry,
  onSelectCity,
}: CountryKnowledgeSectionsProps) {
  const [openChapter, setOpenChapter] = useState<ChapterId | null>(null)
  const contentPrefix = useId()
  const profile = country.profile
  const resourceRows = getResourceRows(profile.resources)
  const economyRows = getEconomyRows(profile.economy)

  const chapters: Chapter[] = [
    {
      id: 'people',
      title: '民族文化',
      summary: compactSummary([
        country.languages[0]?.name.zh,
        profile.people.ethnicGroups[0]?.name,
        profile.people.religions[0]?.name,
      ]),
      content: <PeopleChapter country={country} profile={profile.people} />,
    },
    ...(resourceRows.length > 0
      ? [
          {
            id: 'resources' as const,
            title: '自然资源',
            summary: compactSummary(resourceRows.flatMap((row) => row.items)),
            content: <KnowledgeRows rows={resourceRows} />,
          },
        ]
      : []),
    ...(economyRows.length > 0
      ? [
          {
            id: 'economy' as const,
            title: '经济产业',
            summary: compactSummary(economyRows.flatMap((row) => row.items)),
            content: <KnowledgeRows rows={economyRows} />,
          },
        ]
      : []),
    {
      id: 'places',
      title: '城市邻国',
      summary: compactSummary([
        cities[0]?.name.zh,
        cities[1]?.name.zh,
        country.borderCountryCodes.length > 0
          ? `邻国${country.borderCountryCodes.length}个`
          : '无陆地邻国',
      ]),
      content: (
        <PlacesChapter
          country={country}
          cities={cities}
          onSelectCountry={onSelectCountry}
          onSelectCity={onSelectCity}
        />
      ),
    },
  ]

  return (
    <div className="knowledge-country-sections">
      {chapters.map((chapter) => {
        const expanded = openChapter === chapter.id
        const contentId = `${contentPrefix}-${chapter.id}`
        return (
          <section
            key={chapter.id}
            className={`knowledge-country-chapter is-${chapter.id}`}
            style={chapterStyle}
          >
            <h3 style={chapterHeadingStyle}>
              <button
                type="button"
                className="knowledge-country-chapter-trigger"
                style={{
                  ...chapterTriggerBaseStyle,
                  background: 'transparent',
                }}
                aria-expanded={expanded}
                aria-controls={contentId}
                onClick={() =>
                  setOpenChapter((current) =>
                    current === chapter.id ? null : chapter.id,
                  )
                }
              >
                <ChapterIcon chapter={chapter.id} />
                <span>
                  <strong>{chapter.title}</strong>
                  {expanded ? null : (
                    <small style={chapterSummaryStyle}>{chapter.summary}</small>
                  )}
                </span>
                <span aria-hidden="true">{expanded ? '−' : '+'}</span>
              </button>
            </h3>
            {expanded ? (
              <div
                id={contentId}
                className="knowledge-country-chapter-content"
                style={chapterContentStyle}
              >
                {chapter.content}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function ChapterIcon({ chapter }: { chapter: ChapterId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={chapterIconStyle}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {chapter === 'people' ? (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20v-2.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V20M16 5.5a2.5 2.5 0 0 1 0 5M17 13a4 4 0 0 1 3.5 4V20" />
        </>
      ) : chapter === 'resources' ? (
        <>
          <path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2z" />
          <path d="m4.5 7.2 7.5 4.3 7.5-4.3M12 11.5V21" />
        </>
      ) : chapter === 'economy' ? (
        <>
          <path d="M4 20V9l5 3V9l5 3V5h6v15z" />
          <path d="M7 16h2M12 16h2M17 9h1" />
        </>
      ) : (
        <>
          <path d="M4 20V9l8-5 8 5v11M8 20v-5h8v5" />
          <path d="M7 10h.01M17 10h.01" />
        </>
      )}
    </svg>
  )
}

function PeopleChapter({
  country,
  profile,
}: {
  country: Country
  profile: CountryProfile['people']
}) {
  return (
    <>
      <InfoItemsRow
        label="语言"
        items={country.languages}
        renderItem={(language) => language.name.zh}
      />
      <InfoItemsRow
        label="民族"
        items={profile.ethnicGroups}
        renderItem={formatDemographicItem}
      />
      <InfoItemsRow
        label="宗教"
        items={profile.religions}
        renderItem={formatDemographicItem}
      />
    </>
  )
}

function KnowledgeRows({ rows }: { rows: KnowledgeRow[] }) {
  return (
    <>
      {rows.map((row) => (
        <InfoItemsRow
          key={row.label}
          label={row.label}
          items={row.items}
          renderItem={(item) => item}
        />
      ))}
    </>
  )
}

function PlacesChapter({
  country,
  cities,
  onSelectCountry,
  onSelectCity,
}: CountryKnowledgeSectionsProps) {
  return (
    <>
      <InfoRow label="城市">
        <div style={inlineActionsStyle}>
          {cities.map((city) =>
            onSelectCity ? (
              <button
                type="button"
                key={city.id}
                style={inlineActionStyle}
                title={city.name.en}
                aria-label={`探索城市${city.name.zh}`}
                onClick={() => onSelectCity(city.id)}
              >
                {city.name.zh}
              </button>
            ) : (
              <span
                key={city.id}
                style={inlineActionStyle}
                title={city.name.en}
              >
                {city.name.zh}
              </span>
            ),
          )}
        </div>
      </InfoRow>
      <InfoRow label="区位">
        {country.subregion.zh} · {country.landlocked ? '内陆国家' : '沿海国家'}
      </InfoRow>
      <InfoRow label="邻国">
        {country.borderCountryCodes.length > 0 ? (
          <div style={inlineActionsStyle}>
            {country.borderCountryCodes.map((countryCode) => {
              const neighbour = countriesByCode.get(countryCode)
              return neighbour ? (
                <button
                  type="button"
                  key={countryCode}
                  style={inlineActionStyle}
                  aria-label={`探索邻国${neighbour.name.zh}`}
                  onClick={() => onSelectCountry(countryCode)}
                >
                  <CountryFlag
                    src={neighbour.flagAsset}
                    alt=""
                    style={neighbourFlagStyle}
                  />
                  {neighbour.name.zh}
                </button>
              ) : null
            })}
          </div>
        ) : (
          '没有陆地相邻国家'
        )}
      </InfoRow>
      {country.adjacentRegions.length > 0 ? (
        <InfoRow label="地区">
          <div style={inlineActionsStyle}>
            {country.adjacentRegions.map((region) => (
              <span
                key={region.code}
                style={inlineActionStyle}
                title={region.name.en}
              >
                {region.name.zh}
              </span>
            ))}
          </div>
        </InfoRow>
      ) : null}
    </>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <div>{children}</div>
    </div>
  )
}

function InfoItemsRow<T>({
  label,
  items,
  renderItem,
}: {
  label: string
  items: T[]
  renderItem: (item: T) => string
}) {
  return (
    <InfoRow label={label}>
      <div style={inlineValuesStyle}>
        {items.map((item, index) => (
          <span key={`${renderItem(item)}-${index}`}>
            {renderItem(item)}
            {index < items.length - 1 ? ' ·' : ''}
          </span>
        ))}
      </div>
    </InfoRow>
  )
}

function compactSummary(values: Array<string | undefined>) {
  return values.filter(Boolean).slice(0, 3).join(' · ')
}

function getResourceRows(profile: CountryProfile['resources']): KnowledgeRow[] {
  const buckets = new Map<string, string[]>()
  const add = (label: string, item: string) => {
    const values = buckets.get(label) ?? []
    if (!values.includes(item) && values.length < 3) values.push(item)
    buckets.set(label, values)
  }

  for (const group of profile.groups) {
    for (const item of group.items) {
      if (/资源相对有限|^无$|^没有$/.test(item)) continue
      if (/石油|天然气|煤|水电|铀/.test(item)) add('能源', item)
      else if (/森林|木材|木料/.test(item)) add('森林', item)
      else if (/淡水|水资源|河流|湖泊/.test(item)) add('淡水', item)
      else if (/鱼|渔业|海洋/.test(item)) add('渔业', item)
      else if (/耕地|土地|土壤|牧场/.test(item)) add('土地', item)
      else if (/港口/.test(item)) add('港口', item)
      else if (group.label.includes('矿产')) add('矿产', item)
    }
  }

  return ['能源', '矿产', '森林', '淡水', '土地', '渔业', '港口'].flatMap(
    (label) => {
      const items = buckets.get(label)
      return items && items.length > 0 ? [{ label, items }] : []
    },
  )
}

function getEconomyRows(profile: CountryProfile['economy']): KnowledgeRow[] {
  const rows: KnowledgeRow[] = []
  const agriculture = profile.agriculture
    .filter((item) => !/本地农业|小规模农业|进口粮食/.test(item))
    .slice(0, 3)
  const industry = profile.industry
    .filter((item) => !/^服务业$|本地产业/.test(item))
    .slice(0, 3)
  const tourism = profile.tourism
    .filter((item) => item === '旅游服务与相关产业')
    .slice(0, 3)

  if (agriculture.length > 0) rows.push({ label: '农业', items: agriculture })
  if (industry.length > 0) rows.push({ label: '工业', items: industry })
  if (tourism.length > 0) rows.push({ label: '旅游', items: tourism })
  return rows
}

function formatDemographicItem(
  item: CountryProfile['people']['ethnicGroups'][number],
) {
  return item.sharePercent === undefined
    ? item.name
    : `${item.name} 约${item.sharePercent}%`
}
