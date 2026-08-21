import * as Tooltip from '@radix-ui/react-tooltip'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ExplorePage } from '../features/explore/ExplorePage'
import { AppNavigation } from './AppNavigation'
import { LandscapeGuard } from './LandscapeGuard'

const KnowledgePage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgePage')
  return { default: module.KnowledgePage }
})

const KnowledgeRegionPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeRegionPage')
  return { default: module.KnowledgeRegionPage }
})

const KnowledgeEarthPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeEarthPage')
  return { default: module.KnowledgeEarthPage }
})

const KnowledgeChallengePage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeChallengePage')
  return { default: module.KnowledgeChallengePage }
})

export function App() {
  return (
    <Tooltip.Provider delayDuration={300}>
      <LandscapeGuard>
        <BrowserRouter>
          <div className="app-shell">
            <AppNavigation />
            <Suspense
              fallback={
                <main className="app-route-loading" role="status">
                  正在整理知识地图…
                </main>
              }
            >
              <Routes>
                <Route path="/" element={<Navigate to="/explore" replace />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/knowledge" element={<KnowledgePage />} />
                <Route
                  path="/knowledge/earth"
                  element={<KnowledgeEarthPage />}
                />
                <Route
                  path="/knowledge/countries/:regionId"
                  element={<KnowledgeRegionPage />}
                />
                <Route
                  path="/knowledge/countries/:regionId/challenge"
                  element={<KnowledgeChallengePage />}
                />
                <Route path="*" element={<Navigate to="/explore" replace />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </LandscapeGuard>
    </Tooltip.Provider>
  )
}
