import { useCallback, useEffect, useState } from 'react'

export type GeometryResourceStatus = 'idle' | 'loading' | 'ready' | 'error'

export function useGeometryResource<T>(
  loader: () => Promise<T>,
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null)
  const [requestId, setRequestId] = useState(0)
  const [failedRequestId, setFailedRequestId] = useState<number | null>(null)

  const retry = useCallback(() => setRequestId((current) => current + 1), [])

  useEffect(() => {
    if (!enabled || data) return
    let active = true
    void loader().then(
      (value) => {
        if (!active) return
        setData(value)
      },
      () => {
        if (!active) return
        setFailedRequestId(requestId)
      },
    )
    return () => {
      active = false
    }
  }, [data, enabled, loader, requestId])

  const status: GeometryResourceStatus = !enabled
    ? 'idle'
    : data
      ? 'ready'
      : failedRequestId === requestId
        ? 'error'
        : 'loading'

  return { data, status, retry }
}
