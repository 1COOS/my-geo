export function isFullscreenDisplayMode(windowRef: Window = window) {
  return windowRef.matchMedia('(display-mode: fullscreen)').matches
}

export function isManualFullscreenAvailable(
  documentRef: Document = document,
  windowRef: Window = window,
) {
  return (
    !isFullscreenDisplayMode(windowRef) &&
    documentRef.fullscreenEnabled === true &&
    typeof documentRef.documentElement.requestFullscreen === 'function' &&
    typeof documentRef.exitFullscreen === 'function'
  )
}

export function isDocumentFullscreen(documentRef: Document = document) {
  return documentRef.fullscreenElement !== null
}

export async function toggleDocumentFullscreen(
  documentRef: Document = document,
) {
  try {
    if (isDocumentFullscreen(documentRef)) {
      await documentRef.exitFullscreen()
    } else {
      await documentRef.documentElement.requestFullscreen()
    }
    return true
  } catch {
    return false
  }
}
