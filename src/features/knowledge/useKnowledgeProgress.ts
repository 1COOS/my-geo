import { useEffect, useState } from 'react'

import {
  loadKnowledgeProgress,
  type KnowledgeRegionProgress,
} from '../../storage/database'

export function useKnowledgeProgress() {
  const [progressByRegion, setProgressByRegion] = useState<
    Map<string, KnowledgeRegionProgress>
  >(new Map())

  useEffect(() => {
    let active = true
    void loadKnowledgeProgress().then((progress) => {
      if (!active) return
      setProgressByRegion(
        new Map(progress.map((item) => [item.regionId, item])),
      )
    })
    return () => {
      active = false
    }
  }, [])

  return { progressByRegion }
}
