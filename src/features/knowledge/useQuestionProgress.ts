import { useEffect, useState } from 'react'

import {
  loadQuestionProgress,
  type PersistenceStatus,
  type QuestionChallengeProgress,
} from '../../storage/database'

export function useQuestionProgress() {
  const [progressByChallenge, setProgressByChallenge] = useState<
    Map<string, QuestionChallengeProgress>
  >(new Map())
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>('idle')

  useEffect(() => {
    let active = true
    void loadQuestionProgress().then((result) => {
      if (!active) return
      setProgressByChallenge(
        new Map(result.value.map((item) => [item.challengeId, item])),
      )
      setPersistenceStatus(result.status === 'saved' ? 'idle' : result.status)
    })
    return () => {
      active = false
    }
  }, [])

  return { progressByChallenge, persistenceStatus }
}
