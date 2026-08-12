import * as Tooltip from '@radix-ui/react-tooltip'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ExplorePage } from '../features/explore/ExplorePage'
import { LandscapeGuard } from './LandscapeGuard'

export function App() {
  return (
    <Tooltip.Provider delayDuration={300}>
      <LandscapeGuard>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ExplorePage />} />
          </Routes>
        </BrowserRouter>
      </LandscapeGuard>
    </Tooltip.Provider>
  )
}
