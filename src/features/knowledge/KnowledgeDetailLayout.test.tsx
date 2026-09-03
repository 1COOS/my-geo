import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ViewportProfileContext } from '../../shared/hooks/useViewportProfile'
import {
  KnowledgeDetailLayout,
  KnowledgeDetailWorkbench,
} from './KnowledgeDetailLayout'

describe('KnowledgeDetailLayout', () => {
  it('assigns study and detail content to the shared flow layout', () => {
    render(
      <KnowledgeDetailLayout
        mode="flow"
        studyLabel="国家学习"
        study={<div>主学习区</div>}
        detail={<aside>知识卡</aside>}
      />,
    )

    const main = screen.getByRole('main')
    expect(main).toHaveClass('knowledge-detail-layout')
    expect(main).not.toHaveClass('is-fixed-workbench')
    expect(screen.getByRole('region', { name: '国家学习' })).toHaveTextContent(
      '主学习区',
    )
    expect(screen.getByRole('complementary')).toHaveTextContent('知识卡')
  })

  it('publishes compact state and the four fixed workbench slots', () => {
    render(
      <ViewportProfileContext.Provider value="compact-landscape">
        <KnowledgeDetailLayout
          mode="fixed-workbench"
          studyLabel="指标地图"
          study={
            <KnowledgeDetailWorkbench
              header={<header>页头</header>}
              map={<div>地图</div>}
              primaryRail={<nav>一级列表</nav>}
              secondaryRail={<nav>二级列表</nav>}
            />
          }
          detail={<aside>详情</aside>}
        />
      </ViewportProfileContext.Provider>,
    )

    const main = screen.getByRole('main')
    expect(main).toHaveClass('is-fixed-workbench')
    expect(main).toHaveAttribute('data-compact-workbench', 'true')
    expect(screen.getByText('页头')).toBeVisible()
    expect(screen.getByText('地图').parentElement).toHaveClass(
      'knowledge-detail-workbench-map',
    )
    expect(screen.getByText('一级列表')).toBeVisible()
    expect(screen.getByText('二级列表')).toBeVisible()
  })
})
