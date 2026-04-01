import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitise user-generated HTML — allows limited safe tags only.
 * Use for: review body, forum posts, forum replies, classified descriptions, event descriptions.
 */
export function sanitiseHTML(dirty: string): string {
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
