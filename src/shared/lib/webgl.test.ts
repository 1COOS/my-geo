import { describe, expect, it, vi } from 'vitest'

import { supportsWebGL } from './webgl'

describe('supportsWebGL', () => {
  it('returns true when WebGL2 is available', () => {
    const getContext = vi.fn().mockReturnValueOnce({})
    const documentRef = {
      createElement: vi.fn().mockReturnValue({ getContext }),
    } as unknown as Document

    expect(supportsWebGL(documentRef)).toBe(true)
    expect(getContext).toHaveBeenCalledWith('webgl2', {
      failIfMajorPerformanceCaveat: true,
    })
  })

  it('returns false when context creation throws', () => {
    const documentRef = {
      createElement: vi.fn().mockImplementation(() => {
        throw new Error('blocked')
      }),
    } as unknown as Document

    expect(supportsWebGL(documentRef)).toBe(false)
  })
})
