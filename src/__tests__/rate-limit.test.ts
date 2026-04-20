/**
 * Tests for rate-limit.ts fail-closed / in-memory fallback behaviour.
 *
 * These tests exercise the module directly without Upstash — the Redis env
 * vars are intentionally absent so we exercise the degraded-mode paths.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js server imports before importing the module under test
vi.mock('next/server', () => {
  const NextResponse = {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      body,
      headers: new Map(Object.entries((init?.headers as Record<string, string>) ?? {})),
    }),
  }
  return { NextResponse, NextRequest: class {} }
})

// Mock Upstash packages so we can import without real credentials
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: class {} }))
vi.mock('@upstash/redis/cloudflare', () => ({ Redis: class {} }))

// Ensure Redis env vars are absent for all tests in this file
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

// Dynamic import so env var deletion above takes effect before module init
async function loadModule() {
  // Re-import fresh each test via vi.resetModules
  vi.resetModules()

  vi.mock('next/server', () => {
    const NextResponse = {
      json: (body: unknown, init?: ResponseInit) => ({
        status: init?.status ?? 200,
        body,
        headers: new Map(Object.entries((init?.headers as Record<string, string>) ?? {})),
      }),
    }
    return { NextResponse, NextRequest: class {} }
  })
  vi.mock('@upstash/ratelimit', () => ({ Ratelimit: class {} }))
  vi.mock('@upstash/redis/cloudflare', () => ({ Redis: class {} }))

  return import('../lib/security/rate-limit')
}

describe('rate-limit — no Redis (degraded mode)', () => {
  it('authLimiter is fail-closed and returns 503', async () => {
    const { authLimiter, checkLimit } = await loadModule()
    const result = await checkLimit(authLimiter, 'ip:1.2.3.4')
    expect(result.limited).toBe(true)
    expect((result as { limited: true; response: { status: number } }).response.status).toBe(503)
  })

  it('contentLimiter uses in-memory fallback and allows up to N requests', async () => {
    const { contentLimiter, checkLimit } = await loadModule()
    // contentLimiter = 5 per hour in memory; first 5 should pass
    for (let i = 0; i < 5; i++) {
      const r = await checkLimit(contentLimiter, 'user:test-user')
      expect(r.limited).toBe(false)
    }
    // 6th request should be limited (429)
    const r6 = await checkLimit(contentLimiter, 'user:test-user')
    expect(r6.limited).toBe(true)
    expect((r6 as { limited: true; response: { status: number } }).response.status).toBe(429)
  })

  it('in-memory limiter resets after window expires', async () => {
    const { contentLimiter, checkLimit } = await loadModule()

    // Exhaust the limit for a fresh identifier
    for (let i = 0; i < 5; i++) {
      await checkLimit(contentLimiter, 'user:window-test')
    }
    const blocked = await checkLimit(contentLimiter, 'user:window-test')
    expect(blocked.limited).toBe(true)

    // Manipulate windowStart to simulate window expiry
    if (contentLimiter.kind === 'memory') {
      const entry = contentLimiter.store.get('user:window-test')
      if (entry) {
        entry.windowStart = Date.now() - contentLimiter.windowMs - 1
        contentLimiter.store.set('user:window-test', entry)
      }
    }

    const after = await checkLimit(contentLimiter, 'user:window-test')
    expect(after.limited).toBe(false)
  })

  it('different identifiers have independent counters', async () => {
    const { searchLimiter, checkLimit } = await loadModule()
    // searchLimiter = 30 per minute; one request per identifier should pass
    const r1 = await checkLimit(searchLimiter, 'ip:10.0.0.1')
    const r2 = await checkLimit(searchLimiter, 'ip:10.0.0.2')
    expect(r1.limited).toBe(false)
    expect(r2.limited).toBe(false)
  })
})
