import { create } from 'zustand'

import {
  loadExperiencePreferences,
  saveExperiencePreferences,
  type ExperiencePreferences,
} from '../../storage/database'

type ExperienceState = Pick<ExperiencePreferences, 'autoRotate' | 'quality'> & {
  hydrated: boolean
  hydrate: () => Promise<void>
  toggleAutoRotate: () => void
  toggleQuality: () => void
}

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  autoRotate: true,
  quality: 'balanced',
  hydrated: false,
  async hydrate() {
    try {
      const preferences = await loadExperiencePreferences()
      set({
        autoRotate: preferences.autoRotate,
        quality: preferences.quality,
        hydrated: true,
      })
    } catch {
      set({ hydrated: true })
    }
  },
  toggleAutoRotate() {
    const next = !get().autoRotate
    set({ autoRotate: next })
    void saveExperiencePreferences({
      autoRotate: next,
      quality: get().quality,
    })
  },
  toggleQuality() {
    const next = get().quality === 'balanced' ? 'low' : 'balanced'
    set({ quality: next })
    void saveExperiencePreferences({
      autoRotate: get().autoRotate,
      quality: next,
    })
  },
}))
