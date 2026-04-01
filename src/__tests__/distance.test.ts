import { describe, it, expect } from 'vitest'
import { haversineDistance, formatDistance, isInSingapore } from '@/lib/maps/distance'

describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(1.3521, 103.8198, 1.3521, 103.8198)).toBe(0)
  })

  it('calculates distance between Marina Bay and Tampines (~17 km)', () => {
    // Marina Bay: 1.2789, 103.8536
    // Tampines: 1.3496, 103.9568
    const d = haversineDistance(1.2789, 103.8536, 1.3496, 103.9568)
    expect(d).toBeGreaterThan(12)
    expect(d).toBeLessThan(22)
  })

  it('calculates distance between two close points (~1 km)', () => {
    // Raffles Place: 1.2840, 103.8510
    // Clarke Quay: 1.2884, 103.8462 (~0.7 km)
    const d = haversineDistance(1.284, 103.851, 1.2884, 103.8462)
    expect(d).toBeGreaterThan(0.4)
    expect(d).toBeLessThan(1.2)
  })

  it('is symmetric (A→B equals B→A)', () => {
    const d1 = haversineDistance(1.3, 103.8, 1.4, 103.9)
    const d2 = haversineDistance(1.4, 103.9, 1.3, 103.8)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.0001)
  })

  it('returns positive value for any non-zero distance', () => {
    expect(haversineDistance(0, 0, 0, 1)).toBeGreaterThan(0)
  })
})

describe('formatDistance', () => {
  it('shows metres for distances under 1 km', () => {
    expect(formatDistance(0.3)).toBe('300 m')
    expect(formatDistance(0.75)).toBe('750 m')
    expect(formatDistance(0.999)).toBe('999 m')
  })

  it('shows km with one decimal for distances 1 km and over', () => {
    expect(formatDistance(1.0)).toBe('1.0 km')
    expect(formatDistance(2.5)).toBe('2.5 km')
    expect(formatDistance(2.6)).toBe('2.6 km')
    expect(formatDistance(10)).toBe('10.0 km')
  })

  it('rounds metres correctly', () => {
    expect(formatDistance(0.5)).toBe('500 m')
    expect(formatDistance(0.501)).toBe('501 m')
    expect(formatDistance(0.999)).toBe('999 m')
  })
})

describe('isInSingapore', () => {
  it('returns true for central Singapore coordinates', () => {
    expect(isInSingapore(1.3521, 103.8198)).toBe(true) // central SG
    expect(isInSingapore(1.3000, 103.8500)).toBe(true)
  })

  it('returns false for coordinates outside Singapore', () => {
    expect(isInSingapore(3.139, 101.6869)).toBe(false) // Kuala Lumpur
    expect(isInSingapore(1.3521, 100.0)).toBe(false)   // wrong longitude
    expect(isInSingapore(5.0, 103.8198)).toBe(false)   // wrong latitude
    expect(isInSingapore(0, 0)).toBe(false)
  })

  it('returns true for edge points on the Singapore bounding box', () => {
    expect(isInSingapore(1.15, 103.6)).toBe(true)  // SW corner
    expect(isInSingapore(1.48, 104.0)).toBe(true)  // NE corner
  })
})
