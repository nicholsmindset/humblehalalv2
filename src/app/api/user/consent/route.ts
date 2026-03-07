import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { marketing_consent } = body

  if (typeof marketing_consent !== 'boolean') {
    return NextResponse.json({ error: 'marketing_consent must be a boolean' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      marketing_consent,
      consent_date: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('[api/user/consent]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, marketing_consent })
}
