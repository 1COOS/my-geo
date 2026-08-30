import {
  getWaterObjectsForGroup,
  type WaterLearningObject,
} from '../../data/waterLearning'
import type {
  WaterLearningLayer,
  WaterObjectGroup,
} from '../../data/waterLearningSchema'
import { KnowledgeCardShell } from '../../shared/components/knowledge-card/KnowledgeCardShell'

function getObjectName(object: WaterLearningObject) {
  return object.value.name.zh
}

export function KnowledgeWaterGroupOverviewCard({
  group,
  layer,
}: {
  group: WaterObjectGroup
  layer: WaterLearningLayer
}) {
  const objects = getWaterObjectsForGroup(group)

  return (
    <KnowledgeCardShell
      label={`${group.name}水域分组知识`}
      identity={`water-group:${group.id}`}
      accent="#53d8e8"
      className="knowledge-region-overview-card"
    >
      <header className="knowledge-region-overview-heading">
        <p>{layer.name} · 分组知识</p>
        <h2>{group.name}</h2>
      </header>

      <p className="knowledge-region-overview-lead">{group.summary}</p>

      <section className="country-detail-section knowledge-region-overview-summary">
        <h3 className="country-detail-label">包含对象</h3>
        <p>
          <strong>{objects.length}</strong>
          <span>个对象</span>
        </p>
        <ul aria-label={`${group.name}对象名单`}>
          {objects.map((object) => (
            <li key={object.value.id}>{getObjectName(object)}</li>
          ))}
        </ul>
      </section>

      <LessonSection title="核心知识" items={layer.coreKnowledge} />
      <LessonSection title="地图判读" items={layer.readingRules} />
      {layer.comparisons.map((comparison) => (
        <LessonSection
          key={comparison.title}
          title={comparison.title}
          items={comparison.items}
        />
      ))}
      <LessonSection title="容易混淆" items={layer.commonMistakes} />
    </KnowledgeCardShell>
  )
}

function LessonSection({ title, items }: { title: string; items: string[] }) {
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
