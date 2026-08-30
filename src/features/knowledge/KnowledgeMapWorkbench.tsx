import { useEffect, useState, type ReactNode, type RefObject } from 'react'

import {
  KnowledgeTopicNavigation,
  type KnowledgeTopicId,
} from './KnowledgeTopicNavigation'

type KnowledgeMapWorkbenchPageProps = {
  activeTopic: KnowledgeTopicId
  label: string
  shellRef?: RefObject<HTMLElement | null>
  renderControls: (compact: boolean) => ReactNode
  renderMap: (compact: boolean) => ReactNode
  renderResults: (compact: boolean) => ReactNode
}

function getCompactLandscape() {
  return window.matchMedia('(max-height: 520px)').matches
}

export function KnowledgeMapWorkbenchPage({
  activeTopic,
  label,
  shellRef,
  renderControls,
  renderMap,
  renderResults,
}: KnowledgeMapWorkbenchPageProps) {
  const [compact, setCompact] = useState(getCompactLandscape)

  useEffect(() => {
    const media = window.matchMedia('(max-height: 520px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <main
      ref={shellRef}
      className="knowledge-shell knowledge-earth-shell knowledge-map-workbench-shell"
      data-compact-workbench={compact ? 'true' : 'false'}
      style={{
        display: 'flex',
        overflowY: 'hidden',
        flexDirection: 'column',
        paddingBottom: compact ? '0.45rem' : '0.75rem',
      }}
    >
      <KnowledgeTopicNavigation activeTopic={activeTopic} compact={compact} />

      <section
        className="knowledge-earth knowledge-map-workbench"
        aria-label={label}
        style={{
          display: 'grid',
          flex: '1 1 auto',
          width: '100%',
          minHeight: 0,
          margin: '0 auto',
          gridTemplateRows: compact
            ? '2.125rem minmax(0, 1fr) 3.625rem'
            : '2.9rem minmax(0, 1fr) 5.5rem',
          gap: compact ? '0.4rem' : '0.6rem',
        }}
      >
        <div
          className="knowledge-map-workbench-controls"
          style={{ display: 'flex', minWidth: 0, gap: '0.5rem' }}
        >
          {renderControls(compact)}
        </div>
        <div
          className="knowledge-map-workbench-map"
          style={{
            display: 'flex',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderMap(compact)}
        </div>
        <div
          className="knowledge-map-workbench-results"
          style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}
        >
          {renderResults(compact)}
        </div>
      </section>
    </main>
  )
}
