import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// In-memory LRU store (max 1000 entries, evict oldest when full)
// ---------------------------------------------------------------------------

interface MemoryEntry {
  count: number
  windowStart: number
}

class LRUMap {
  private map = new Map<string, MemoryEntry>()
  private readonly maxSize: number

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  get(key: string): MemoryEntry | undefined {
    const entry = this.map.get(key)
    if (entry) {
      // Refresh insertion order (LRU touch)
      this.map.delete(key)
      this.map.set(key, entry)
    }
    return entry
  }

  set(key: string, value: MemoryEntry): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.maxSize) {
      // Evict oldest (first) entry
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }
    this.map.set(key, value)
  }
}

// ---------------------------------------------------------------------------
// Window string parser: '15 m' → ms, '1 h' → ms, etc.
// ---------------------------------------------------------------------------

function windowToMs(window: `${number} ${'s' | 'm' | 'h' | 'd'}`): number {
  const [num, unit] = window.split(' ') as [string, 's' | 'm' | 'h' | 'd']
  const n = parseInt(num, 10)
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return n * multipliers[unit]
}

// ---------------------------------------------------------------------------
// Limiter types
// ---------------------------------------------------------------------------

type Limiter =
  | { kind: 'redis'; limit: Ratelimit; critical: boolean }
  | { kind: 'memory'; requests: number; windowMs: number; store: LRUMap }
  | { kind: 'fail-closed' }

// ---------------------------------------------------------------------------
// Redis singleton
// ---------------------------------------------------------------------------

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting in degraded mode')
    }
    return null
  }
  return new Redis({ url, token })
}

const redis = makeRedis()

// ---------------------------------------------------------------------------
// Limiter constructors
// ---------------------------------------------------------------------------

/**
 * Critical limiter (auth routes). Returns a Redis-backed limiter when Redis
 * is available, otherwise a fail-closed sentinel that returns 503.
 */
function makeCriticalLimiter(
  requests: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
): Limiter {
  if (!redis) return { kind: 'fail-closed' }
  return {
    kind: 'redis',
    critical: true,
    limit: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(requests, window),
      analytics: true,
    }),
  }
}

/**
 * Standard limiter (content/search/forum/track/travel routes). Returns a
 * Redis-backed limiter when Redis is available, otherwise an in-memory LRU
 * fallback so these routes remain protected in degraded mode.
 */
function makeMemoryFallbackLimiter(
  requests: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
): Limiter {
  if (!redis) {
    return {
      kind: 'memory',
      requests,
      windowMs: windowToMs(window),
      store: new LRUMap(1000),
    }
  }
  return {
    kind: 'redis',
    critical: false,
    limit: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(requests, window),
      analytics: true,
    }),
  }
}

function makeSlidingMemoryFallbackLimiter(
  requests: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
): Limiter {
  if (!redis) {
    return {
      kind: 'memory',
      requests,
      windowMs: windowToMs(window),
      store: new LRUMap(1000),
    }
  }
  return {
    kind: 'redis',
    critical: false,
    limit: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
    }),
  }
}

// ---------------------------------------------------------------------------
// Exported limiters
// ---------------------------------------------------------------------------

// Auth endpoints — CRITICAL: fail closed (503) when Redis unavailable
export const authLimiter = makeCriticalLimiter(5, '15 m')

// Standard limiters — fall back to in-memory LRU when Redis unavailable
export const contentLimiter        = makeMemoryFallbackLimiter(5, '1 h')
export const forumLimiter          = makeMemoryFallbackLimiter(10, '1 h')
export const searchLimiter         = makeSlidingMemoryFallbackLimiter(30, '1 m')
export const trackLimiter          = makeMemoryFallbackLimiter(100, '1 m')
export const travelSearchLimiter   = makeMemoryFallbackLimiter(10, '1 m')
export const travelBookLimiter     = makeMemoryFallbackLimiter(5, '10 m')

// ---------------------------------------------------------------------------
// Public result type (unchanged — all callers remain compatible)
// ---------------------------------------------------------------------------

export type RateLimitResult =
  | { limited: false }
  | { limited: true; response: NextResponse }

// ---------------------------------------------------------------------------
// checkLimit
// ---------------------------------------------------------------------------

/**
 * Check rate limit for a given limiter and identifier.
 *
 * Behaviour by limiter kind:
 * - redis (critical=true):  429 on limit exceeded; 503 on Redis error or fail-closed
 * - redis (critical=false): 429 on limit exceeded; 429 (safe) on Redis error
 * - memory:                 bounded in-memory fixed-window; 429 on limit exceeded
 * - fail-closed:            always returns 503
 */
export async function checkLimit(
  limiter: Limiter,
  identifier: string,
): Promise<RateLimitResult> {
  // --- fail-closed sentinel ---
  if (limiter.kind === 'fail-closed') {
    return {
      limited: true,
      response: NextResponse.json(
        { error: 'Rate limiting unavailable. Please try again later.' },
        { status: 503 },
      ),
    }
  }

  // --- in-memory fallback ---
  if (limiter.kind === 'memory') {
    const now = Date.now()
    const entry = limiter.store.get(identifier)

    if (!entry || now - entry.windowStart > limiter.windowMs) {
      limiter.store.set(identifier, { count: 1, windowStart: now })
      return { limited: false }
    }

    if (entry.count >= limiter.requests) {
      const retryAfter = Math.ceil((entry.windowStart + limiter.windowMs - now) / 1000)
      return {
        limited: true,
        response: NextResponse.json(
          { error: 'Too many requests. Please try again later.', retryAfter },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limiter.requests),
              'X-RateLimit-Remaining': '0',
              'Retry-After': String(retryAfter),
            },
          },
        ),
      }
    }

    limiter.store.set(identifier, { count: entry.count + 1, windowStart: entry.windowStart })
    return { limited: false }
  }

  // --- redis-backed ---
  try {
    const result = await limiter.limit.limit(identifier)

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
      return {
        limited: true,
        response: NextResponse.json(
          { error: 'Too many requests. Please try again later.', retryAfter },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.reset),
              'Retry-After': String(retryAfter),
            },
          },
        ),
      }
    }

    return { limited: false }
  } catch (err) {
    console.error('[rate-limit] Redis error:', err)

    if (limiter.critical) {
      // Auth routes: fail closed — deny rather than let through
      return {
        limited: true,
        response: NextResponse.json(
          { error: 'Rate limiting unavailable. Please try again later.' },
          { status: 503 },
        ),
      }
    }

    // Standard routes: conservative 429 on Redis error to prevent bypass
    return {
      limited: true,
      response: NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      ),
    }
  }
}

// ---------------------------------------------------------------------------
// Identifier helper (unchanged)
// ---------------------------------------------------------------------------

/** Get the best identifier for an incoming request (prefer userId, fall back to IP) */
export function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? 'unknown'
  return `ip:${ip}`
}
