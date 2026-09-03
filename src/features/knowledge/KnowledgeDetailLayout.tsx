import type { ReactNode, RefObject } from 'react'

import { ContentPageShell } from '../../shared/components/ContentPageShell'
import { useViewportProfile } from '../../shared/hooks/useViewportProfile'

export type KnowledgeDetailLayoutMode = 'flow' | 'fixed-workbench'

export type KnowledgeDetailLayoutProps = {
  className?: string
  mode: KnowledgeDetailLayoutMode
  shellRef?: RefObject<HTMLElement | null>
  studyLabel: string
  study: ReactNode
  detail: ReactNode
}

export function KnowledgeDetailLayout({
  className,
  mode,
  shellRef,
  studyLabel,
  study,
  detail,
}: KnowledgeDetailLayoutProps) {
  const compact = useViewportProfile() === 'compact-landscape'

  return (
    <ContentPageShell
      shellRef={shellRef}
      compact={compact}
      scrollMode={mode === 'fixed-workbench' ? 'locked' : 'auto'}
      className={[
        'knowledge-shell',
        'knowledge-region-shell',
        'knowledge-detail-layout',
        mode === 'fixed-workbench' && 'is-fixed-workbench',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="knowledge-region-content knowledge-detail-content">
        <section className="knowledge-detail-study" aria-label={studyLabel}>
          {study}
        </section>
      </div>
      {detail}
    </ContentPageShell>
  )
}

export function KnowledgeDetailWorkbench({
  header,
  map,
  primaryRail,
  secondaryRail,
}: {
  header: ReactNode
  map: ReactNode
  primaryRail: ReactNode
  secondaryRail: ReactNode
}) {
  return (
    <div className="knowledge-detail-workbench">
      {header}
      <div className="knowledge-detail-workbench-map">{map}</div>
      {primaryRail}
      {secondaryRail}
    </div>
  )
}
