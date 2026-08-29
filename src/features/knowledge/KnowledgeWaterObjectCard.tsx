import { Link } from 'react-router-dom'

import type { LinearGeoFeature } from '../../data/linearGeoFeatureSchema'
import { linearGeoFeatureKindLabels } from '../../data/linearGeoFeatures'
import type { Waterbody } from '../../data/waterbodySchema'
import { waterbodyKindLabels } from '../../data/waterbodies'
import type { WaterLearningLayer } from '../../data/waterLearningSchema'
import { KnowledgeCardShell } from '../../shared/components/knowledge-card/KnowledgeCardShell'

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 1,
})

type KnowledgeWaterObjectCardProps = {
  object: Waterbody | LinearGeoFeature
  objectType: 'waterbody' | 'linearFeature'
  layer: WaterLearningLayer
  onClose: () => void
}

export function KnowledgeWaterObjectCard({
  object,
  objectType,
  layer,
  onClose,
}: KnowledgeWaterObjectCardProps) {
  const waterbody = objectType === 'waterbody' ? (object as Waterbody) : null
  const feature =
    objectType === 'linearFeature' ? (object as LinearGeoFeature) : null
  const kindLabel = waterbody
    ? waterbodyKindLabels[waterbody.kind]
    : linearGeoFeatureKindLabels[feature!.kind]
  const accent = waterbody
    ? waterbody.layer === 'lake'
      ? '#53e6bd'
      : waterbody.layer === 'waterway'
        ? '#aa7cff'
        : '#31e4ff'
    : feature!.kind === 'canal'
      ? '#f7bf4f'
      : '#36dced'
  const exploreTarget = waterbody
    ? `/explore?waterbody=${waterbody.id}`
    : `/explore?linearFeature=${feature!.id}`

  return (
    <KnowledgeCardShell
      label={`${object.name.zh}${kindLabel}详情`}
      closeLabel={`关闭${object.name.zh}详情`}
      identity={object.id}
      accent={accent}
      onClose={onClose}
      footer={
        <Link className="knowledge-card-action" to={exploreTarget}>
          <span>在3D地球上查看</span>
          <small>定位{object.name.zh}并开启对应图层</small>
        </Link>
      }
    >
      <div className="waterbody-detail-heading">
        <span
          className={
            waterbody
              ? `waterbody-detail-symbol is-${waterbody.layer}`
              : `linear-feature-symbol is-${feature!.kind}`
          }
          aria-hidden="true"
        />
        <div>
          <p>
            {layer.name} · {kindLabel}
          </p>
          <h2>{object.name.zh}</h2>
          <span>{object.name.en}</span>
        </div>
      </div>

      <section className="country-detail-section">
        <p className="country-detail-label">地理概览</p>
        <p className="waterbody-summary">{object.summary}</p>
        <dl className="city-detail-facts">
          <div>
            <dt>所在区域</dt>
            <dd>{object.region}</dd>
          </div>
          {waterbody?.areaSquareKilometers ? (
            <div>
              <dt>面积</dt>
              <dd>
                {numberFormatter.format(waterbody.areaSquareKilometers)} km²
              </dd>
            </div>
          ) : null}
          {waterbody?.maxDepthMeters ? (
            <div>
              <dt>最大深度</dt>
              <dd>{numberFormatter.format(waterbody.maxDepthMeters)} m</dd>
            </div>
          ) : null}
          {feature ? (
            <div>
              <dt>长度</dt>
              <dd>
                {feature.approximateLength ? '约 ' : ''}
                {numberFormatter.format(feature.lengthKilometers)} km
              </dd>
            </div>
          ) : null}
          {feature?.kind === 'river' ? (
            <>
              <div>
                <dt>源头</dt>
                <dd>{feature.source}</dd>
              </div>
              <div>
                <dt>河口</dt>
                <dd>{feature.mouth}</dd>
              </div>
            </>
          ) : null}
          {feature?.kind === 'canal' ? (
            <>
              <div>
                <dt>起点</dt>
                <dd>{feature.start}</dd>
              </div>
              <div>
                <dt>终点</dt>
                <dd>{feature.end}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">
          {waterbody
            ? waterbody.kind === 'lake'
              ? '湖岸与相邻地区'
              : '相邻陆地与岛屿'
            : feature!.kind === 'river'
              ? '流经区域'
              : '连接水域'}
        </p>
        <div className="waterbody-tag-list">
          {(waterbody
            ? waterbody.adjacentLandmasses
            : feature!.kind === 'river'
              ? feature!.traversedRegions
              : feature!.connectedWaters
          ).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="country-detail-section">
        <p className="country-detail-label">观察要点</p>
        <ol className="fun-fact-list">
          {object.facts.map((fact, index) => (
            <li key={fact}>
              <span>{index + 1}</span>
              <p>{fact}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="country-detail-section geography-topic-content">
        <h3 className="country-detail-label">所属图层</h3>
        <p>{layer.summary}</p>
      </section>

      <section className="country-detail-section geography-topic-content">
        <h3 className="country-detail-label">核心知识</h3>
        <ol>
          {layer.coreKnowledge.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="country-detail-section geography-topic-content">
        <h3 className="country-detail-label">地图判读</h3>
        <ol>
          {layer.readingRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      {layer.comparisons.map((comparison) => (
        <section
          className="country-detail-section geography-topic-content"
          key={comparison.title}
        >
          <h3 className="country-detail-label">{comparison.title}</h3>
          <ul>
            {comparison.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="country-detail-section geography-topic-content">
        <h3 className="country-detail-label">容易混淆</h3>
        <ul>
          {layer.commonMistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </section>
    </KnowledgeCardShell>
  )
}
