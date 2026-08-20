import { beforeEach, describe, expect, it, vi } from 'vitest'

const storageMocks = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
}))

vi.mock('../../storage/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../storage/database')>()
  return {
    ...actual,
    loadExperiencePreferences: storageMocks.load,
    saveExperiencePreferences: storageMocks.save,
  }
})

import { useExperienceStore } from './useExperienceStore'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('useExperienceStore', () => {
  beforeEach(() => {
    useExperienceStore.setState({
      autoRotate: true,
      quality: 'balanced',
      hydrated: true,
      persistenceStatus: 'idle',
    })
    storageMocks.load.mockReset()
    storageMocks.save.mockReset()
  })

  it('serializes preference writes and persists the latest snapshot', async () => {
    const first = deferred<{
      value: { autoRotate: boolean; quality: 'balanced' | 'low' }
      status: 'saved'
    }>()
    storageMocks.save.mockReturnValueOnce(first.promise).mockResolvedValueOnce({
      value: { autoRotate: false, quality: 'low' },
      status: 'saved',
    })

    useExperienceStore.getState().toggleAutoRotate()
    useExperienceStore.getState().toggleQuality()
    await vi.waitFor(() => expect(storageMocks.save).toHaveBeenCalledTimes(1))
    expect(storageMocks.save).toHaveBeenNthCalledWith(1, {
      autoRotate: false,
      quality: 'balanced',
    })

    first.resolve({
      value: { autoRotate: false, quality: 'balanced' },
      status: 'saved',
    })
    await vi.waitFor(() => expect(storageMocks.save).toHaveBeenCalledTimes(2))
    expect(storageMocks.save).toHaveBeenNthCalledWith(2, {
      autoRotate: false,
      quality: 'low',
    })
    await vi.waitFor(() =>
      expect(useExperienceStore.getState().persistenceStatus).toBe('saved'),
    )
  })
})
