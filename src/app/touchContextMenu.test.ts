import { describe, expect, it } from 'vitest'

import { shouldPreventTouchContextMenu } from './touchContextMenu'

describe('shouldPreventTouchContextMenu', () => {
  it('blocks ordinary touch targets and allows desktop context menus', () => {
    const target = document.createElement('button')

    expect(shouldPreventTouchContextMenu(target, true)).toBe(true)
    expect(shouldPreventTouchContextMenu(target, false)).toBe(false)
  })

  it.each(['input', 'textarea', 'select'])(
    'allows native editing controls on touch devices: %s',
    (tagName) => {
      const control = document.createElement(tagName)

      expect(shouldPreventTouchContextMenu(control, true)).toBe(false)
    },
  )

  it.each(['', 'true', 'plaintext-only'])(
    'allows editable content with contenteditable="%s"',
    (value) => {
      const editable = document.createElement('div')
      const child = document.createElement('span')
      editable.setAttribute('contenteditable', value)
      editable.append(child)

      expect(shouldPreventTouchContextMenu(child, true)).toBe(false)
    },
  )

  it('blocks a contenteditable=false subtree inside editable content', () => {
    const editable = document.createElement('div')
    const disabled = document.createElement('span')
    const child = document.createElement('strong')
    editable.setAttribute('contenteditable', 'true')
    disabled.setAttribute('contenteditable', 'false')
    disabled.append(child)
    editable.append(disabled)

    expect(shouldPreventTouchContextMenu(child, true)).toBe(true)
  })

  it('allows an explicit context-menu exception and its descendants', () => {
    const allowed = document.createElement('div')
    const child = document.createElement('span')
    allowed.dataset.allowContextMenu = ''
    allowed.append(child)

    expect(shouldPreventTouchContextMenu(child, true)).toBe(false)
  })
})
