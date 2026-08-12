export function supportsWebGL(documentRef: Document = document) {
  try {
    const canvas = documentRef.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }),
    )
  } catch {
    return false
  }
}
