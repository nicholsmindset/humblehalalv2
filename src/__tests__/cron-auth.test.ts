import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

const TEST_SECRET = 'test-cron-secret-abc123'
const TEST_URL = 'http://localhost/api/cron/test'

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) {
    headers['Authorization'] = authHeader
  }
  return new NextRequest(TEST_URL, { headers })
}

describe('verifyCronSecret', () => {
  let originalSecret: string | undefined

  beforeEach(() => {
    originalSecret = process.env.CRON_SECRET
  })

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalSecret
    }
  })

  describe('when CRON_SECRET is not configured', () => {
    it('returns 500 when CRON_SECRET is undefined', async () => {
      delete process.env.CRON_SECRET
      const result = verifyCronSecret(makeRequest())
      expect(result).not.toBeNull()
      expect(result!.status).toBe(500)
      const body = await result!.json()
      expect(body).toEqual({ error: 'CRON_SECRET not configured' })
    })

    it('returns 500 when CRON_SECRET is empty string', async () => {
      process.env.CRON_SECRET = ''
      const result = verifyCronSecret(makeRequest())
      expect(result).not.toBeNull()
      expect(result!.status).toBe(500)
      const body = await result!.json()
      expect(body).toEqual({ error: 'CRON_SECRET not configured' })
    })
  })

  describe('when CRON_SECRET is configured', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = TEST_SECRET
    })

    it('returns 401 when Authorization header is missing', async () => {
      const result = verifyCronSecret(makeRequest())
      expect(result).not.toBeNull()
      expect(result!.status).toBe(401)
      const body = await result!.json()
      expect(body).toEqual({ error: 'Unauthorised' })
    })

    it('returns 401 when Authorization header has wrong token', async () => {
      const result = verifyCronSecret(makeRequest('Bearer wrong-token'))
      expect(result).not.toBeNull()
      expect(result!.status).toBe(401)
      const body = await result!.json()
      expect(body).toEqual({ error: 'Unauthorised' })
    })

    it('returns 401 when Authorization header is malformed (no Bearer prefix)', async () => {
      const result = verifyCronSecret(makeRequest(TEST_SECRET))
      expect(result).not.toBeNull()
      expect(result!.status).toBe(401)
    })

    it('returns null when Authorization header is correct', () => {
      const result = verifyCronSecret(makeRequest(`Bearer ${TEST_SECRET}`))
      expect(result).toBeNull()
    })
  })
})
