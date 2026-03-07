import { describe, it, expect } from 'vitest'
import { slugify, formatSGD, parseUtmParams, cn } from '@/lib/utils'

describe('slugify', () => {
  it('converts a simple name to slug', () => {
    expect(slugify('Zamzam Restaurant')).toBe('zamzam-restaurant')
  })

  it('handles special characters', () => {
    expect(slugify("Hajah Maimunah's Cafe")).toBe('hajah-maimunahs-cafe')
  })

  it('handles multiple spaces and hyphens', () => {
    expect(slugify('  Hello   World -- Test  ')).toBe('hello-world-test')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('generates slug with area suffix', () => {
    expect(slugify('Zamzam Restaurant-arab-street')).toBe('zamzam-restaurant-arab-street')
  })
})

describe('formatSGD', () => {
  it('formats whole dollars correctly', () => {
    expect(formatSGD(1000)).toBe('$10')
  })

  it('formats cents correctly', () => {
    expect(formatSGD(1050)).toBe('$10.5')
  })

  it('formats zero', () => {
    expect(formatSGD(0)).toBe('$0')
  })

  it('formats large amounts', () => {
    expect(formatSGD(100000)).toBe('$1,000')
  })
})

describe('parseUtmParams', () => {
  it('parses UTM source and medium', () => {
    const result = parseUtmParams('?utm_source=google&utm_medium=cpc')
    expect(result).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
    })
  })

  it('returns empty object for no UTM params', () => {
    const result = parseUtmParams('?foo=bar')
    expect(result).toEqual({})
  })

  it('handles all UTM params', () => {
    const result = parseUtmParams(
      '?utm_source=newsletter&utm_medium=email&utm_campaign=weekly&utm_content=hero&utm_term=halal'
    )
    expect(result).toEqual({
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'weekly',
      utm_content: 'hero',
      utm_term: 'halal',
    })
  })

  it('handles empty search string', () => {
    expect(parseUtmParams('')).toEqual({})
  })
})

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })
})
