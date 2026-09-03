import type { ReactNode, RefObject } from 'react'

export type ContentPageScrollMode = 'auto' | 'locked'

export type ContentPageShellProps = {
  className?: string
  compact?: boolean
  scrollMode: ContentPageScrollMode
  shellRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function ContentPageShell({
  className,
  compact,
  scrollMode,
  shellRef,
  children,
}: ContentPageShellProps) {
  return (
    <main
      ref={shellRef}
      className={[
        'knowledge-shell',
        'content-page-shell',
        `is-scroll-${scrollMode}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-page-scroll={scrollMode}
      data-compact-workbench={compact ? 'true' : 'false'}
    >
      {children}
    </main>
  )
}

export function ContentPageHeader({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle: string
  className?: string
}) {
  return (
    <header
      className={['content-page-header', 'knowledge-home-header', className]
        .filter(Boolean)
        .join(' ')}
    >
      <h1>{title}</h1>
      <span>{subtitle}</span>
    </header>
  )
}
