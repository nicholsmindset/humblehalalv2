import { type NextRequest, NextResponse } from 'next/server'

/**
 * Verifies the cron secret on every cron route.
 * Returns null if authorised, or a 401 NextResponse if not.
 *
 * Usage:
 *   const deny = verifyCronSecret(request)
 *   if (deny) return deny
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn('CRON_SECRET is not set — cron endpoints are unprotected')
    return null
  }

  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  return null
}
