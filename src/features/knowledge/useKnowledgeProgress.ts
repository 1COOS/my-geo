import { useEffect, useState } from 'react'

import {
  loadKnowledgeProgress,
  type KnowledgeRegionProgress,
  type PersistenceStatus,
} from '../../storage/database'

export function useKnowledgeProgress() {
  const [progressByRegion, setProgressByRegion] = useState<
    Map<string, KnowledgeRegionProgress>
  >(new Map())
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>('idle')

  useEffect(() => {
    let active = true
    void loadKnowledgeProgress().then((result) => {
      if (!active) return
      setProgressByRegion(
        new Map(result.value.map((item) => [item.regionId, item])),
      )
      setPersistenceStatus(result.status === 'saved' ? 'idle' : result.status)
    })
    return () => {
      active = false
    }
  }, [])

  return { progressByRegion, persistenceStatus }
}
