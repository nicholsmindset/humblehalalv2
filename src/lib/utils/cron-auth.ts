import { type NextRequest, NextResponse } from 'next/server'

/**
 * Verifies the cron secret on every cron route.
 * Returns null if authorised, or a NextResponse with an error status if not.
 *
 * Fails CLOSED:
 *   - 500 if CRON_SECRET env var is unset or empty (misconfiguration)
 *   - 401 if the Authorization header does not match Bearer <CRON_SECRET>
 *   - null if authorised
 *
 * Usage:
 *   const deny = verifyCronSecret(request)
 *   if (deny) return deny
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  return null
}
