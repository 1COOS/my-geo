import type { Country } from '../../data/countrySchema'
import type { KnowledgeRegion } from '../../data/knowledgeRegions'
import { KnowledgeCardShell } from '../../shared/components/knowledge-card/KnowledgeCardShell'

type KnowledgeRegionOverviewCardProps = {
  continentName: string
  countries: Country[]
  region: KnowledgeRegion
}

export function KnowledgeRegionOverviewCard({
  continentName,
  countries,
  region,
}: KnowledgeRegionOverviewCardProps) {
  return (
    <KnowledgeCardShell
      label={`${region.name.zh}区域知识`}
      identity={`region:${region.id}`}
      accent={region.accent}
      className="knowledge-region-overview-card"
    >
      <header className="knowledge-region-overview-heading">
        <p>{continentName} · 区域知识</p>
        <h2>{region.name.zh}</h2>
        <span>{region.name.en}</span>
      </header>

      <p className="knowledge-region-overview-lead">{region.description}</p>

      <section className="country-detail-section knowledge-region-overview-summary">
        <h3 className="country-detail-label">区域成员</h3>
        <p>
          <strong>{countries.length}</strong>
          <span>个国家</span>
        </p>
        <ul aria-label={`${region.name.zh}成员国家`}>
          {countries.map((country) => (
            <li key={country.code}>{country.name.zh}</li>
          ))}
        </ul>
      </section>

      <RegionLessonSection title="自然地理" items={region.naturalGeography} />
      <RegionLessonSection title="人文地理" items={region.humanGeography} />
      <RegionLessonSection title="学习要点" items={region.studyHighlights} />
    </KnowledgeCardShell>
  )
}

function RegionLessonSection({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  return (
    <section className="country-detail-section">
      <h3 className="country-detail-label">{title}</h3>
      <ul className="fun-fact-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
