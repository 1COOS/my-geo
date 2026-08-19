import Dexie, { type EntityTable } from 'dexie'
import { z } from 'zod'

export const experiencePreferencesSchema = z.object({
  id: z.literal('current'),
  autoRotate: z.boolean(),
  quality: z.enum(['balanced', 'low']),
  updatedAt: z.number().int().nonnegative(),
})

export type ExperiencePreferences = z.infer<typeof experiencePreferencesSchema>

export const knowledgeRegionProgressSchema = z.object({
  regionId: z.string().min(1),
  bestScore: z.number().int().min(0).max(100),
  lastScore: z.number().int().min(0).max(100),
  attemptCount: z.number().int().nonnegative(),
  passedAt: z.number().int().nonnegative().nullable(),
  updatedAt: z.number().int().nonnegative(),
})

export type KnowledgeRegionProgress = z.infer<
  typeof knowledgeRegionProgressSchema
>

const defaultPreferences: ExperiencePreferences = {
  id: 'current',
  autoRotate: true,
  quality: 'balanced',
  updatedAt: 0,
}

class MyGeoDatabase extends Dexie {
  preferences!: EntityTable<ExperiencePreferences, 'id'>
  knowledgeProgress!: EntityTable<KnowledgeRegionProgress, 'regionId'>

  constructor() {
    super('my-geo')
    this.version(1).stores({
      preferences: 'id, updatedAt',
    })
    this.version(2).stores({
      preferences: 'id, updatedAt',
      knowledgeProgress: 'regionId, updatedAt, passedAt',
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

export function mergeKnowledgeChallengeResult(
  current: KnowledgeRegionProgress | undefined,
  regionId: string,
  score: number,
  now = Date.now(),
): KnowledgeRegionProgress {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)))
  return {
    regionId,
    bestScore: Math.max(current?.bestScore ?? 0, normalizedScore),
    lastScore: normalizedScore,
    attemptCount: (current?.attemptCount ?? 0) + 1,
    passedAt: current?.passedAt ?? (normalizedScore >= 80 ? now : null),
    updatedAt: now,
  }
}

export async function loadKnowledgeProgress() {
  const stored = (await getDatabase()?.knowledgeProgress.toArray()) ?? []
  return stored.flatMap((progress) => {
    const parsed = knowledgeRegionProgressSchema.safeParse(progress)
    return parsed.success ? [parsed.data] : []
  })
}

export async function saveKnowledgeChallengeResult(
  regionId: string,
  score: number,
) {
  const table = getDatabase()?.knowledgeProgress
  if (!table) return mergeKnowledgeChallengeResult(undefined, regionId, score)
  const current = await table.get(regionId)
  const next = mergeKnowledgeChallengeResult(current, regionId, score)
  await table.put(next)
  return next
}
