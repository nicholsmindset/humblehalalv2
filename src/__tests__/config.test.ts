import { describe, it, expect } from 'vitest'
import {
  HalalStatus,
  Vertical,
  SingaporeArea,
  CuisineType,
  BusinessCategory,
  HALAL_STATUS_LABELS,
  ISR_REVALIDATE,
  SITE_URL,
  SITE_NAME,
} from '@/config'

describe('HalalStatus enum', () => {
  it('has all required values', () => {
    expect(HalalStatus.MuisCertified).toBe('muis_certified')
    expect(HalalStatus.MuslimOwned).toBe('muslim_owned')
    expect(HalalStatus.SelfDeclared).toBe('self_declared')
    expect(HalalStatus.NotApplicable).toBe('not_applicable')
  })

  it('has labels for all statuses', () => {
    for (const status of Object.values(HalalStatus)) {
      expect(HALAL_STATUS_LABELS[status]).toBeDefined()
      expect(HALAL_STATUS_LABELS[status].length).toBeGreaterThan(0)
    }
  })
})

describe('Vertical enum', () => {
  it('has all required verticals', () => {
    expect(Object.values(Vertical)).toContain('food')
    expect(Object.values(Vertical)).toContain('catering')
    expect(Object.values(Vertical)).toContain('services')
    expect(Object.values(Vertical)).toContain('products')
    expect(Object.values(Vertical)).toContain('events')
    expect(Object.values(Vertical)).toContain('mosque')
  })
})

describe('SingaporeArea enum', () => {
  it('has key areas', () => {
    expect(Object.values(SingaporeArea)).toContain('tampines')
    expect(Object.values(SingaporeArea)).toContain('arab-street')
    expect(Object.values(SingaporeArea)).toContain('bugis')
    expect(Object.values(SingaporeArea)).toContain('woodlands')
  })

  it('has at least 15 areas', () => {
    expect(Object.values(SingaporeArea).length).toBeGreaterThanOrEqual(15)
  })
})

describe('CuisineType enum', () => {
  it('has key cuisine types', () => {
    expect(Object.values(CuisineType)).toContain('malay')
    expect(Object.values(CuisineType)).toContain('indian')
    expect(Object.values(CuisineType)).toContain('korean')
    expect(Object.values(CuisineType)).toContain('mamak')
  })
})

describe('BusinessCategory enum', () => {
  it('has key categories', () => {
    expect(Object.values(BusinessCategory)).toContain('restaurant')
    expect(Object.values(BusinessCategory)).toContain('fashion')
    expect(Object.values(BusinessCategory)).toContain('healthcare')
  })
})

describe('Constants', () => {
  it('has correct site URL', () => {
    expect(SITE_URL).toBe('https://humblehalal.sg')
  })

  it('has correct site name', () => {
    expect(SITE_NAME).toBe('HumbleHalal')
  })

  it('has ISR revalidation intervals', () => {
    expect(ISR_REVALIDATE.HIGH_TRAFFIC).toBe(1800)
    expect(ISR_REVALIDATE.LONG_TAIL).toBe(3600)
    expect(ISR_REVALIDATE.STATIC).toBe(86400)
  })
})
