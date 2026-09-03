export function WorldMapResourceStatus({
  loading,
  failed,
  loadingText,
  errorText,
  onRetry,
}: {
  loading: boolean
  failed: boolean
  loadingText: string
  errorText: string
  onRetry: () => void
}) {
  if (loading) {
    return (
      <output className="geometry-resource-status" role="status">
        {loadingText}
      </output>
    )
  }
  if (!failed) return null

  return (
    <div className="geometry-resource-status" role="alert">
      {errorText}
      <button type="button" onClick={onRetry}>
        重新加载
      </button>
    </div>
  )
}
