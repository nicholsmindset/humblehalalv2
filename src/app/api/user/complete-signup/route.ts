import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { displayName, marketingConsent, consentDate } = await req.json()

  const db = supabase as any

  const { error } = await db
    .from('user_profiles')
    .upsert({
      id: user.id,
      display_name: displayName || null,
      marketing_consent: Boolean(marketingConsent),
      consent_date: consentDate || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('[complete-signup] DB error:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
