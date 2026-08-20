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

export type PersistenceStatus =
  'idle' | 'saving' | 'saved' | 'memory-only' | 'error'

export type PersistenceOutcome<T> = {
  value: T
  status: Extract<PersistenceStatus, 'saved' | 'memory-only' | 'error'>
}

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
  const table = getDatabase()?.preferences
  if (!table) {
    return {
      value: defaultPreferences,
      status: 'memory-only',
    } satisfies PersistenceOutcome<ExperiencePreferences>
  }
  try {
    const stored = await table.get('current')
    const parsed = experiencePreferencesSchema.safeParse(stored)
    return {
      value: parsed.success ? parsed.data : defaultPreferences,
      status: 'saved',
    } satisfies PersistenceOutcome<ExperiencePreferences>
  } catch {
    return {
      value: defaultPreferences,
      status: 'error',
    } satisfies PersistenceOutcome<ExperiencePreferences>
  }
}

export async function saveExperiencePreferences(
  preferences: Pick<ExperiencePreferences, 'autoRotate' | 'quality'>,
) {
  const table = getDatabase()?.preferences
  if (!table) {
    return {
      value: preferences,
      status: 'memory-only',
    } satisfies PersistenceOutcome<typeof preferences>
  }
  try {
    await table.put({
      id: 'current',
      ...preferences,
      updatedAt: Date.now(),
    })
    return { value: preferences, status: 'saved' } satisfies PersistenceOutcome<
      typeof preferences
    >
  } catch {
    return { value: preferences, status: 'error' } satisfies PersistenceOutcome<
      typeof preferences
    >
  }
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
  const table = getDatabase()?.knowledgeProgress
  if (!table) {
    return {
      value: [],
      status: 'memory-only',
    } satisfies PersistenceOutcome<KnowledgeRegionProgress[]>
  }
  try {
    const stored = await table.toArray()
    return {
      value: stored.flatMap((progress) => {
        const parsed = knowledgeRegionProgressSchema.safeParse(progress)
        return parsed.success ? [parsed.data] : []
      }),
      status: 'saved',
    } satisfies PersistenceOutcome<KnowledgeRegionProgress[]>
  } catch {
    return {
      value: [],
      status: 'error',
    } satisfies PersistenceOutcome<KnowledgeRegionProgress[]>
  }
}

export async function saveKnowledgeChallengeResult(
  regionId: string,
  score: number,
) {
  const table = getDatabase()?.knowledgeProgress
  if (!table) {
    const value = mergeKnowledgeChallengeResult(undefined, regionId, score)
    return {
      value,
      status: 'memory-only',
    } satisfies PersistenceOutcome<KnowledgeRegionProgress>
  }
  try {
    const current = await table.get(regionId)
    const next = mergeKnowledgeChallengeResult(current, regionId, score)
    await table.put(next)
    return {
      value: next,
      status: 'saved',
    } satisfies PersistenceOutcome<KnowledgeRegionProgress>
  } catch {
    const value = mergeKnowledgeChallengeResult(undefined, regionId, score)
    return {
      value,
      status: 'error',
    } satisfies PersistenceOutcome<KnowledgeRegionProgress>
  }
}
