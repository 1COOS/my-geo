import { useNavigate } from 'react-router-dom'

import {
  ContentPageHeader,
  ContentPageShell,
} from '../../shared/components/ContentPageShell'
import { PlaceSearch } from './PlaceSearch'
import { getExplorePathForPlaceSearchResult } from './placeSearchUtils'

export function SearchPage() {
  const navigate = useNavigate()

  return (
    <ContentPageShell className="search-page-shell" scrollMode="locked">
      <ContentPageHeader
        className="search-page-header"
        title="搜索"
        subtitle="查找国家、地点或地理知识"
      />
      <section className="search-page-content" aria-label="地点与知识搜索">
        <PlaceSearch
          autoFocus
          persistentResults
          onSelect={(result) => {
            void navigate(getExplorePathForPlaceSearchResult(result))
          }}
        />
      </section>
    </ContentPageShell>
  )
}
