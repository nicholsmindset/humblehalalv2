import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled')
    }
    return null
  }
  return new Redis({ url, token })
}

const redis = makeRedis()

function makeLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(requests, window),
    analytics: true,
  })
}

function makeSlidingLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  })
}

// Auth endpoints — 5 requests / 15 minutes per IP
export const authLimiter = makeLimiter(5, '15 m')

// Content submission — 5 per hour per userId
export const contentLimiter = makeLimiter(5, '1 h')

// Forum posts — 10 per hour per userId
export const forumLimiter = makeLimiter(10, '1 h')

// Search / general API — 30 per minute (sliding) per IP
export const searchLimiter = makeSlidingLimiter(30, '1 m')

// Analytics ingestion — 100 per minute per session
export const trackLimiter = makeLimiter(100, '1 m')

// LiteAPI travel search — 10 per minute per IP (cost protection)
export const travelSearchLimiter = makeLimiter(10, '1 m')

// LiteAPI booking — 5 per 10 minutes per userId
export const travelBookLimiter = makeLimiter(5, '10 m')

export type RateLimitResult =
  | { limited: false }
  | { limited: true; response: NextResponse }

/**
 * Check rate limit. Returns a 429 response if limit exceeded, or { limited: false }.
 * Gracefully skips (returns not-limited) if Redis is unavailable.
 */
export async function checkLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) return { limited: false }

  const result = await limiter.limit(identifier)

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
        }
      ),
    }
  }

  return { limited: false }
}

/** Get the best identifier for an incoming request (prefer userId, fall back to IP) */
export function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? 'unknown'
  return `ip:${ip}`
}
