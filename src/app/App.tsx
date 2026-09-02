import * as Tooltip from '@radix-ui/react-tooltip'
import { lazy, Suspense, type CSSProperties } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ExplorePage } from '../features/explore/ExplorePage'
import { useViewportProfile } from '../shared/hooks/useViewportProfile'
import { AppNavigation } from './AppNavigation'
import { LandscapeGuard } from './LandscapeGuard'

const KnowledgePage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgePage')
  return { default: module.KnowledgePage }
})

const KnowledgeCountriesPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeCountriesPage')
  return { default: module.KnowledgeCountriesPage }
})

const KnowledgeRegionPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeRegionPage')
  return { default: module.KnowledgeRegionPage }
})

const KnowledgeEarthPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeEarthPage')
  return { default: module.KnowledgeEarthPage }
})

const KnowledgeEarthLineDetailPage = lazy(async () => {
  const module =
    await import('../features/knowledge/KnowledgeEarthLineDetailPage')
  return { default: module.KnowledgeEarthLineDetailPage }
})

const KnowledgeWaterPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeWaterPage')
  return { default: module.KnowledgeWaterPage }
})

const KnowledgeExtremesPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeExtremesPage')
  return { default: module.KnowledgeExtremesPage }
})

const KnowledgeChallengePage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeChallengePage')
  return { default: module.KnowledgeChallengePage }
})

const KnowledgeQuestionsPage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgeQuestionsPage')
  return { default: module.KnowledgeQuestionsPage }
})

const SearchPage = lazy(async () => {
  const module = await import('../features/search/SearchPage')
  return { default: module.SearchPage }
})

export function App() {
  const viewportProfile = useViewportProfile()
  const responsiveTokens =
    viewportProfile === 'compact-landscape'
      ? ({
          '--layout-gap': 'clamp(0.3rem, 0.8vw, 0.5rem)',
          '--navigation-rail-size': '3.2rem',
          '--detail-panel-size': 'clamp(15rem, 36vw, 18.5rem)',
        } as CSSProperties)
      : viewportProfile === 'balanced'
        ? ({
            '--detail-panel-size': 'clamp(16rem, 34vw, 22rem)',
          } as CSSProperties)
        : undefined

  return (
    <Tooltip.Provider delayDuration={300}>
      <LandscapeGuard>
        <BrowserRouter>
          <div
            className="app-shell"
            data-viewport-profile={viewportProfile}
            style={responsiveTokens}
          >
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
                <Route path="/search" element={<SearchPage />} />
                <Route path="/knowledge" element={<KnowledgePage />} />
                <Route
                  path="/knowledge/countries"
                  element={<KnowledgeCountriesPage />}
                />
                <Route
                  path="/knowledge/earth"
                  element={<KnowledgeEarthPage />}
                />
                <Route
                  path="/knowledge/earth/lines/:lineId"
                  element={<KnowledgeEarthLineDetailPage />}
                />
                <Route
                  path="/knowledge/water"
                  element={<KnowledgeWaterPage />}
                />
                <Route
                  path="/knowledge/water/waterbodies/:waterbodyId"
                  element={<KnowledgeWaterPage />}
                />
                <Route
                  path="/knowledge/water/linear-features/:linearFeatureId"
                  element={<KnowledgeWaterPage />}
                />
                <Route
                  path="/knowledge/extremes"
                  element={<KnowledgeExtremesPage />}
                />
                <Route
                  path="/knowledge/extremes/metrics/:metricId"
                  element={<KnowledgeExtremesPage />}
                />
                <Route
                  path="/knowledge/extremes/:legacyMetricId/:legacyEntryId"
                  element={<KnowledgeExtremesPage />}
                />
                <Route
                  path="/knowledge/water/groups/:groupId"
                  element={<KnowledgeWaterPage />}
                />
                <Route
                  path="/knowledge/countries/:regionId"
                  element={<KnowledgeRegionPage />}
                />
                <Route
                  path="/knowledge/countries/:regionId/challenge"
                  element={<Navigate to="/questions" replace />}
                />
                <Route path="/questions" element={<KnowledgeQuestionsPage />} />
                <Route
                  path="/questions/countries/:regionId"
                  element={<Navigate to="/questions" replace />}
                />
                <Route
                  path="/questions/:continentId/:difficulty"
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
