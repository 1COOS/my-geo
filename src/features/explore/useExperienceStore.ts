import { create } from 'zustand'

import {
  loadExperiencePreferences,
  saveExperiencePreferences,
  type ExperiencePreferences,
  type PersistenceStatus,
} from '../../storage/database'

type ExperienceState = Pick<ExperiencePreferences, 'autoRotate' | 'quality'> & {
  hydrated: boolean
  persistenceStatus: PersistenceStatus
  hydrate: () => Promise<void>
  toggleAutoRotate: () => void
  toggleQuality: () => void
}

let preferenceWrite = Promise.resolve()

function queuePreferenceWrite(
  set: (state: Partial<ExperienceState>) => void,
  preferences: Pick<ExperiencePreferences, 'autoRotate' | 'quality'>,
) {
  set({ persistenceStatus: 'saving' })
  preferenceWrite = preferenceWrite.then(async () => {
    const result = await saveExperiencePreferences(preferences)
    set({ persistenceStatus: result.status })
  })
}

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  autoRotate: true,
  quality: 'balanced',
  hydrated: false,
  persistenceStatus: 'idle',
  async hydrate() {
    const result = await loadExperiencePreferences()
    set({
      autoRotate: result.value.autoRotate,
      quality: result.value.quality,
      hydrated: true,
      persistenceStatus: result.status === 'saved' ? 'idle' : result.status,
    })
  },
  toggleAutoRotate() {
    const next = !get().autoRotate
    set({ autoRotate: next })
    queuePreferenceWrite(set, {
      autoRotate: next,
      quality: get().quality,
    })
  },
  toggleQuality() {
    const next = get().quality === 'balanced' ? 'low' : 'balanced'
    set({ quality: next })
    queuePreferenceWrite(set, {
      autoRotate: get().autoRotate,
      quality: next,
    })
  },
}))
