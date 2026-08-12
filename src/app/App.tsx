import * as Tooltip from '@radix-ui/react-tooltip'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ExplorePage } from '../features/explore/ExplorePage'

export function App() {
  return (
    <Tooltip.Provider delayDuration={300}>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ExplorePage />} />
        </Routes>
      </BrowserRouter>
    </Tooltip.Provider>
  )
}
