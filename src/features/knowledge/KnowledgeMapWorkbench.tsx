import type { ReactNode, RefObject } from 'react'

import { useViewportProfile } from '../../shared/hooks/useViewportProfile'

type KnowledgeMapWorkbenchPageProps = {
  label: string
  title: string
  shellRef?: RefObject<HTMLElement | null>
  renderControls: (compact: boolean) => ReactNode
  renderMap: (compact: boolean) => ReactNode
  renderResults: (compact: boolean) => ReactNode
}

export function KnowledgeMapWorkbenchPage({
  label,
  title,
  shellRef,
  renderControls,
  renderMap,
  renderResults,
}: KnowledgeMapWorkbenchPageProps) {
  const compact = useViewportProfile() === 'compact-landscape'

  return (
    <main
      ref={shellRef}
      className="knowledge-shell knowledge-earth-shell knowledge-map-workbench-shell"
      data-compact-workbench={compact ? 'true' : 'false'}
      style={{
        display: 'flex',
        paddingBottom: compact ? '0.45rem' : '0.75rem',
        overflowY: 'hidden',
        flexDirection: 'column',
      }}
    >
      <h1 className="sr-only">{title}</h1>

      <section
        className="knowledge-earth knowledge-map-workbench"
        aria-label={label}
        style={{
          display: 'grid',
          flex: '1 1 auto',
          width: '100%',
          minHeight: 0,
          gridTemplateRows: compact
            ? '2.125rem minmax(0, 1fr) 3.625rem'
            : '2.9rem minmax(0, 1fr) 5.5rem',
          gap: compact ? '0.4rem' : '0.6rem',
          margin: '0 auto',
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
