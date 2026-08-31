import {
  climateLearningTopic,
  climatePeriod,
  climateTypes,
  getClimateType,
} from '../../data/climateLearning'
import type {
  ClimateKnowledgeSelection,
  ClimateTypeId,
} from '../../data/climateLearningSchema'
import { formatGeoPosition } from './worldMiniMapUtils'
import { DetailPanelShell } from './DetailPanelShell'

type ClimateLearningPanelProps = {
  selection: ClimateKnowledgeSelection
  onSelectType: (climateTypeId: ClimateTypeId) => void
  onShowOverview: () => void
}

export function ClimateLearningPanel({
  selection,
  onSelectType,
  onShowOverview,
}: ClimateLearningPanelProps) {
  const climateType =
    selection.kind === 'type' ? getClimateType(selection.climateTypeId) : null
  const classification = selection.classification

  return (
    <DetailPanelShell
      label="世界气候类型知识卡"
      identity={
        selection.kind === 'type'
          ? `climate-${selection.climateTypeId}`
          : 'climate-overview'
      }
      accent={climateType?.color ?? '#79c8d4'}
    >
      <header className="climate-learning-heading">
        <div>
          <p>世界气候 · {climatePeriod}</p>
          <h2>{climateType?.name.zh ?? climateLearningTopic.name.zh}</h2>
          <span>{climateType?.name.en ?? climateLearningTopic.name.en}</span>
        </div>
        {climateType ? (
          <i
            aria-hidden="true"
            style={{ backgroundColor: climateType.color }}
          />
        ) : null}
      </header>

      {classification ? (
        <section className="climate-current-reading" aria-label="气候坐标判读">
          <span>{formatGeoPosition(classification.position)}</span>
          <strong>
            {classification.climateTypeId
              ? (getClimateType(classification.climateTypeId)?.name.zh ??
                '未知气候类型')
              : '海洋区域，无陆地气候类型'}
          </strong>
          <small>历史常年期 {classification.period}</small>
        </section>
      ) : null}

      {climateType ? (
        <article className="climate-type-content">
          <button
            className="climate-overview-link"
            type="button"
            onClick={onShowOverview}
          >
            查看13类气候图例
          </button>
          <p className="climate-type-summary">{climateType.summary}</p>
          <dl className="climate-fact-grid">
            <div>
              <dt>主要分布</dt>
              <dd>{climateType.distribution}</dd>
            </div>
            <div>
              <dt>气温特征</dt>
              <dd>{climateType.temperature}</dd>
            </div>
            <div>
              <dt>降水特征</dt>
              <dd>{climateType.precipitation}</dd>
            </div>
            <div>
              <dt>自然景观</dt>
              <dd>{climateType.landscape}</dd>
            </div>
          </dl>
          <section className="climate-example-list">
            <h3>典型地区</h3>
            <ul>
              {climateType.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </section>
          <aside className="climate-common-mistake">
            <strong>易错提醒</strong>
            <p>{climateType.commonMistake}</p>
          </aside>
        </article>
      ) : (
        <article className="climate-overview-content">
          <p>{climateLearningTopic.summary}</p>
          <p>
            颜色表示长期气温与降水组合形成的气候类型；边界经过初中地理教学化归并，不表示天气、行政区或某一天的实际状况。
          </p>
          <div className="climate-legend" aria-label="13类世界气候图例">
            {climateTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectType(item.id)}
              >
                <i aria-hidden="true" style={{ backgroundColor: item.color }} />
                <span>{item.name.zh}</span>
              </button>
            ))}
          </div>
        </article>
      )}
    </DetailPanelShell>
  )
}
