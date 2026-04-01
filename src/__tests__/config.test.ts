import { describe, it, expect } from 'vitest'
import {
  HalalStatus,
  Vertical,
  SingaporeArea,
  CuisineType,
  SITE_URL,
  SITE_NAME,
  HALAL_STATUS_LABELS,
} from '@/config'

describe('HalalStatus enum', () => {
  it('has the four expected values', () => {
    expect(HalalStatus.MuisCertified).toBe('muis_certified')
    expect(HalalStatus.MuslimOwned).toBe('muslim_owned')
    expect(HalalStatus.SelfDeclared).toBe('self_declared')
    expect(HalalStatus.NotApplicable).toBe('not_applicable')
  })

  it('has exactly 4 members', () => {
    const values = Object.values(HalalStatus)
    expect(values).toHaveLength(4)
  })
})

describe('Vertical enum', () => {
  it('contains all required verticals', () => {
    const required = ['food', 'catering', 'services', 'products', 'events', 'classifieds', 'mosque', 'prayer_room']
    for (const v of required) {
      expect(Object.values(Vertical)).toContain(v)
    }
  })
})

describe('SingaporeArea enum', () => {
  it('contains major Singapore districts', () => {
    const values = Object.values(SingaporeArea)
    expect(values).toContain('tampines')
    expect(values).toContain('jurong-east')
    expect(values).toContain('woodlands')
    expect(values).toContain('bugis')
    expect(values).toContain('orchard')
  })

  it('has at least 20 areas', () => {
    expect(Object.values(SingaporeArea).length).toBeGreaterThanOrEqual(20)
  })

  it('all values are kebab-case strings', () => {
    for (const area of Object.values(SingaporeArea)) {
      expect(area).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })
})

describe('CuisineType enum', () => {
  it('contains key halal-relevant cuisines', () => {
    const values = Object.values(CuisineType)
    expect(values).toContain('malay')
    expect(values).toContain('indian')
    expect(values).toContain('middle-eastern')
    expect(values).toContain('mamak')
  })

  it('has at least 15 cuisine types', () => {
    expect(Object.values(CuisineType).length).toBeGreaterThanOrEqual(15)
  })
})

describe('SITE_URL', () => {
  it('is a valid HTTPS URL', () => {
    expect(SITE_URL).toMatch(/^https:\/\//)
  })

  it('does not have a trailing slash', () => {
    expect(SITE_URL).not.toMatch(/\/$/)
  })

  it('contains humblehalal domain', () => {
    expect(SITE_URL.toLowerCase()).toContain('humblehalal')
  })
})

describe('SITE_NAME', () => {
  it('is a non-empty string', () => {
    expect(typeof SITE_NAME).toBe('string')
    expect(SITE_NAME.length).toBeGreaterThan(0)
  })
})

describe('HALAL_STATUS_LABELS', () => {
  it('has a label for every HalalStatus value', () => {
    for (const status of Object.values(HalalStatus)) {
      expect(HALAL_STATUS_LABELS[status as HalalStatus]).toBeDefined()
      expect(typeof HALAL_STATUS_LABELS[status as HalalStatus]).toBe('string')
    }
  })

  it('MUIS label is the highest trust tier label', () => {
    const label = HALAL_STATUS_LABELS[HalalStatus.MuisCertified]
    expect(label.toLowerCase()).toContain('muis')
  })
})
