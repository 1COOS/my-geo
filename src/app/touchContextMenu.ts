const EDITABLE_CONTENT_VALUES = new Set(['', 'true', 'plaintext-only'])

function getTargetElement(target: EventTarget | null) {
  if (target instanceof Element) return target
  if (target instanceof Node) return target.parentElement
  return null
}

export function shouldPreventTouchContextMenu(
  target: EventTarget | null,
  isTouchDevice: boolean,
) {
  if (!isTouchDevice) return false

  const targetElement = getTargetElement(target)
  if (!targetElement) return true

  if (
    targetElement.closest('input, textarea, select, [data-allow-context-menu]')
  ) {
    return false
  }

  const contentEditable = targetElement.closest('[contenteditable]')
  if (!contentEditable) return true

  return !EDITABLE_CONTENT_VALUES.has(
    (contentEditable.getAttribute('contenteditable') ?? '').toLowerCase(),
  )
}
