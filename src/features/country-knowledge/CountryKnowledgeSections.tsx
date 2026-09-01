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
  padding: '0.45rem var(--country-card-key-inset)',
  gridTemplateColumns: '1.05rem minmax(0, 1fr) 1.05rem',
  columnGap: 'var(--country-card-key-gap)',
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
  minWidth: 0,
  margin: 0,
  flex: 1,
  overflow: 'hidden',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-s)',
  fontWeight: 400,
  lineHeight: 1.3,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} satisfies CSSProperties

const chapterCopyStyle = {
  display: 'flex',
  minWidth: 0,
  gap: '0.35rem',
  alignItems: 'baseline',
} satisfies CSSProperties

const chapterTitleStyle = {
  minWidth: '4.25rem',
  flex: 'none',
  fontSize: 'var(--fs-s)',
  fontWeight: 700,
} satisfies CSSProperties

const chapterContentStyle = {
  padding:
    '0.35rem var(--country-card-key-inset) 0.15rem var(--country-card-key-inset)',
  color: 'var(--atlas-text-secondary)',
  fontSize: 'var(--fs-b)',
  lineHeight: 'var(--lh-b)',
} satisfies CSSProperties

const infoRowStyle = {
  display: 'grid',
  padding: '0.28rem 0',
  gridTemplateColumns: '2rem minmax(0, 1fr)',
  gap: 'var(--country-card-info-gap)',
  alignItems: 'start',
} satisfies CSSProperties

const infoLabelStyle = {
  display: 'inline-flex',
  width: '2rem',
  height: '1.4rem',
  padding: '0 0.18rem',
  boxSizing: 'border-box',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--atlas-text)',
  fontSize: '0.625rem',
  fontWeight: 600,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  background: 'var(--country-card-info-icon-bg)',
  border: '1px solid var(--country-card-info-icon-bg)',
  borderRadius: 'var(--atlas-radius-control)',
} satisfies CSSProperties

const chapterDisclosureStyle = {
  display: 'inline-flex',
  width: '1.05rem',
  height: '1.05rem',
  alignItems: 'center',
  justifyContent: 'center',
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
  const summaryCity = cities.find((city) => !city.isCapital) ?? cities[0]

  const chapters: Chapter[] = [
    {
      id: 'people',
      title: '语言民族',
      summary: compactSummary([
        country.languages[0]?.name.zh,
        profile.people.ethnicGroups[0]?.name,
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
        summaryCity?.name.zh,
        `邻国${country.borderCountryCodes.length}个`,
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
                <span
                  className="knowledge-country-chapter-copy"
                  style={chapterCopyStyle}
                >
                  <strong style={chapterTitleStyle}>{chapter.title}</strong>
                  <small style={chapterSummaryStyle}>{chapter.summary}</small>
                </span>
                <span
                  className="knowledge-country-chapter-disclosure"
                  style={chapterDisclosureStyle}
                  aria-hidden="true"
                >
                  {expanded ? '−' : '+'}
                </span>
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
      className="knowledge-country-chapter-icon"
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
      {profile.ethnicGroups.length > 0 ? (
        <InfoItemsRow
          label="民族"
          items={profile.ethnicGroups}
          renderItem={formatDemographicItem}
        />
      ) : null}
      {profile.religions.length > 0 ? (
        <InfoItemsRow
          label="宗教"
          items={profile.religions}
          renderItem={formatDemographicItem}
        />
      ) : null}
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
    <div className="knowledge-country-info-row" style={infoRowStyle}>
      <span className="knowledge-country-info-label" style={infoLabelStyle}>
        {label}
      </span>
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
  return profile.groups.map((group) => ({
    label: group.label,
    items: group.label === '矿产' ? group.items.slice(0, 5) : group.items,
  }))
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
