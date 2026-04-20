import DOMPurify from 'isomorphic-dompurify'

// Force safe rel on any anchor that opens in a new tab so user-submitted
// links can't exploit window.opener (tabnabbing) or leak Referer.
let hooksInstalled = false
function installHooks() {
  if (hooksInstalled) return
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.tagName !== 'A') return
    const target = node.getAttribute('target')
    if (target === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    } else if (node.hasAttribute('rel')) {
      // Strip rel when not opening a new tab — nothing to protect against.
      node.removeAttribute('rel')
    }
  })
  hooksInstalled = true
}

/**
 * Sanitise user-generated HTML — allows limited safe tags only.
 * Use for: review body, forum posts, forum replies, classified descriptions, event descriptions.
 */
export function sanitiseHTML(dirty: string): string {
  installHooks()
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  })
}

/**
 * Strip all HTML — plain text only.
 * Use for: display names, titles, search queries, any short text field.
 */
export function sanitisePlainText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
