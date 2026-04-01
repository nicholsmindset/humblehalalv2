import { describe, it, expect } from 'vitest'
import { sanitiseHTML, sanitisePlainText } from '@/lib/security/sanitise'

describe('sanitiseHTML', () => {
  it('passes through safe allowed tags', () => {
    const input = '<p>Hello <strong>world</strong> and <em>friends</em></p>'
    const output = sanitiseHTML(input)
    expect(output).toContain('<strong>world</strong>')
    expect(output).toContain('<em>friends</em>')
    expect(output).toContain('<p>')
  })

  it('strips script tags', () => {
    const output = sanitiseHTML('<p>Good</p><script>alert("xss")</script>')
    expect(output).not.toContain('<script>')
    expect(output).not.toContain('alert(')
    expect(output).toContain('Good')
  })

  it('strips on* event attributes', () => {
    const output = sanitiseHTML('<p onclick="evil()">Click me</p>')
    expect(output).not.toContain('onclick')
    expect(output).not.toContain('evil()')
  })

  it('strips style attributes', () => {
    const output = sanitiseHTML('<p style="color:red">Text</p>')
    expect(output).not.toContain('style=')
  })

  it('strips javascript: href values', () => {
    const output = sanitiseHTML('<a href="javascript:alert(1)">link</a>')
    expect(output).not.toContain('javascript:')
  })

  it('allows safe href attributes on anchors', () => {
    const output = sanitiseHTML('<a href="https://example.com" target="_blank" rel="noopener">link</a>')
    expect(output).toContain('href="https://example.com"')
  })

  it('strips disallowed tags like img and iframe', () => {
    const output = sanitiseHTML('<img src="x" onerror="evil()"><iframe src="evil.com"></iframe><p>safe</p>')
    expect(output).not.toContain('<img')
    expect(output).not.toContain('<iframe')
    expect(output).toContain('safe')
  })

  it('strips data attributes', () => {
    const output = sanitiseHTML('<p data-custom="value">Text</p>')
    expect(output).not.toContain('data-custom')
  })

  it('handles empty string', () => {
    expect(sanitiseHTML('')).toBe('')
  })

  it('handles plain text input without modification', () => {
    const output = sanitiseHTML('Just plain text here.')
    expect(output).toBe('Just plain text here.')
  })

  it('allows list tags ul/ol/li', () => {
    const output = sanitiseHTML('<ul><li>Item 1</li><li>Item 2</li></ul>')
    expect(output).toContain('<ul>')
    expect(output).toContain('<li>Item 1</li>')
  })
})

describe('sanitisePlainText', () => {
  it('strips all HTML tags', () => {
    const output = sanitisePlainText('<h1>Hello</h1><p>World</p><script>evil()</script>')
    expect(output).not.toContain('<h1>')
    expect(output).not.toContain('<p>')
    expect(output).not.toContain('<script>')
    expect(output).toContain('Hello')
    expect(output).toContain('World')
  })

  it('strips script with XSS payload', () => {
    const output = sanitisePlainText('<script>document.cookie="stolen"</script>Text')
    expect(output).not.toContain('<script>')
    expect(output).not.toContain('document.cookie')
    expect(output).toContain('Text')
  })

  it('strips all attributes including onclick', () => {
    const output = sanitisePlainText('<div onclick="alert(1)" class="x">Content</div>')
    expect(output).not.toContain('onclick')
    expect(output).not.toContain('class=')
    expect(output).toContain('Content')
  })

  it('handles empty string', () => {
    expect(sanitisePlainText('')).toBe('')
  })

  it('returns plain text unchanged', () => {
    const text = 'No HTML here, just text.'
    expect(sanitisePlainText(text)).toBe(text)
  })
})
