export function activateSvgControlOnKeyboard(
  event: { key: string; preventDefault: () => void },
  activate: () => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  activate()
}
