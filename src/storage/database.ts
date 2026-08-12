import Dexie, { type EntityTable } from 'dexie'
import { z } from 'zod'

export const experiencePreferencesSchema = z.object({
  id: z.literal('current'),
  autoRotate: z.boolean(),
  quality: z.enum(['balanced', 'low']),
  updatedAt: z.number().int().nonnegative(),
})

export type ExperiencePreferences = z.infer<typeof experiencePreferencesSchema>

const defaultPreferences: ExperiencePreferences = {
  id: 'current',
  autoRotate: true,
  quality: 'balanced',
  updatedAt: 0,
}

class MyGeoDatabase extends Dexie {
  preferences!: EntityTable<ExperiencePreferences, 'id'>

  constructor() {
    super('my-geo')
    this.version(1).stores({
      preferences: 'id, updatedAt',
    })
  }
}

let database: MyGeoDatabase | undefined

function getDatabase() {
  if (typeof indexedDB === 'undefined') return undefined
  database ??= new MyGeoDatabase()
  return database
}

export async function loadExperiencePreferences() {
  const stored = await getDatabase()?.preferences.get('current')
  const parsed = experiencePreferencesSchema.safeParse(stored)
  return parsed.success ? parsed.data : defaultPreferences
}

export async function saveExperiencePreferences(
  preferences: Pick<ExperiencePreferences, 'autoRotate' | 'quality'>,
) {
  await getDatabase()?.preferences.put({
    id: 'current',
    ...preferences,
    updatedAt: Date.now(),
  })
}
