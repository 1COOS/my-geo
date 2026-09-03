import type { ReactNode, RefObject } from 'react'

import { ContentPageShell } from '../../shared/components/ContentPageShell'
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
    <ContentPageShell
      shellRef={shellRef}
      className="knowledge-earth-shell knowledge-map-workbench-shell"
      compact={compact}
      scrollMode="locked"
    >
      <h1 className="sr-only">{title}</h1>

      <section
        className="knowledge-earth knowledge-map-workbench"
        aria-label={label}
      >
        <div className="knowledge-map-workbench-controls">
          {renderControls(compact)}
        </div>
        <div className="knowledge-map-workbench-map">{renderMap(compact)}</div>
        <div className="knowledge-map-workbench-results">
          {renderResults(compact)}
        </div>
      </section>
    </ContentPageShell>
  )
}
