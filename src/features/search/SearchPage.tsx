import { useNavigate } from 'react-router-dom'

import { PlaceSearch } from './PlaceSearch'
import { getExplorePathForPlaceSearchResult } from './placeSearchUtils'

export function SearchPage() {
  const navigate = useNavigate()

  return (
    <main className="knowledge-shell search-page-shell">
      <header className="knowledge-home-header search-page-header">
        <h1>搜索</h1>
        <span>查找国家、地点或地理知识</span>
      </header>
      <section className="search-page-content" aria-label="地点与知识搜索">
        <PlaceSearch
          autoFocus
          persistentResults
          onSelect={(result) => {
            void navigate(getExplorePathForPlaceSearchResult(result))
          }}
        />
      </section>
    </main>
  )
}
