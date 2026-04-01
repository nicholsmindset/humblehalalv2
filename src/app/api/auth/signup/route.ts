export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCaptcha } from '@/lib/security/captcha'
import { checkLimit, authLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { sanitisePlainText } from '@/lib/security/sanitise'

export async function POST(request: NextRequest) {
  // Rate limit: 5 signup attempts per 15 minutes per IP
  const rl = await checkLimit(authLimiter, getIdentifier(request))
  if (rl.limited) return rl.response

  const body = await request.json()
  const { email, captchaToken } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  if (!await verifyCaptcha(captchaToken)) {
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
  }

  const cleanEmail = sanitisePlainText(email).trim().toLowerCase()

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://humblehalal.sg'}/auth/callback?next=${encodeURIComponent('/signup/complete')}`,
    },
  })

  if (error) {
    // Don't leak whether the email exists — return generic message
    console.error('[POST /api/auth/signup]', error.message)
    return NextResponse.json(
      { error: 'Could not send sign-in link. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
