import { describe, it, expect } from 'vitest'
import { SYSTEM_PROMPTS } from '@/lib/anthropic/prompts'
import { AI_MODELS } from '@/lib/anthropic/client'

describe('System prompts', () => {
  it('has all required prompt keys', () => {
    expect(SYSTEM_PROMPTS.MODERATION).toBeDefined()
    expect(SYSTEM_PROMPTS.SEO_META).toBeDefined()
    expect(SYSTEM_PROMPTS.LISTING_ENRICHMENT).toBeDefined()
    expect(SYSTEM_PROMPTS.BLOG_POST).toBeDefined()
    expect(SYSTEM_PROMPTS.NEWSLETTER).toBeDefined()
    expect(SYSTEM_PROMPTS.TRAVEL_GUIDE).toBeDefined()
    expect(SYSTEM_PROMPTS.FRESHNESS_CHECK).toBeDefined()
  })

  it('moderation prompt mentions approve/reject/flag', () => {
    expect(SYSTEM_PROMPTS.MODERATION).toContain('approve')
    expect(SYSTEM_PROMPTS.MODERATION).toContain('reject')
    expect(SYSTEM_PROMPTS.MODERATION).toContain('flag')
  })

  it('SEO meta prompt specifies character limits', () => {
    expect(SYSTEM_PROMPTS.SEO_META).toContain('60 chars')
    expect(SYSTEM_PROMPTS.SEO_META).toContain('155 chars')
  })

  it('blog post prompt mentions Singapore', () => {
    expect(SYSTEM_PROMPTS.BLOG_POST).toContain('Singapore')
  })

  it('newsletter prompt mentions HumbleHalal', () => {
    expect(SYSTEM_PROMPTS.NEWSLETTER).toContain('HumbleHalal')
  })
})

describe('AI Models', () => {
  it('has FAST and QUALITY models', () => {
    expect(AI_MODELS.FAST).toBeDefined()
    expect(AI_MODELS.QUALITY).toBeDefined()
  })

  it('FAST model is Sonnet', () => {
    expect(AI_MODELS.FAST).toContain('sonnet')
  })

  it('QUALITY model is Opus', () => {
    expect(AI_MODELS.QUALITY).toContain('opus')
  })
})
