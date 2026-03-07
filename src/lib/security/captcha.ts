/**
 * Server-side Cloudflare Turnstile CAPTCHA verification.
 *
 * Usage in API routes:
 *   const ok = await verifyCaptcha(body.captchaToken)
 *   if (!ok) return NextResponse.json({ error: 'CAPTCHA failed' }, { status: 400 })
 */
export async function verifyCaptcha(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  // If secret not configured (dev / test), skip verification
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[captcha] TURNSTILE_SECRET_KEY not set in production — CAPTCHA disabled')
    }
    return true
  }

  // No token supplied — reject
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch {
    // Network error — fail open in non-production, fail closed in production
    return process.env.NODE_ENV !== 'production'
  }
}
