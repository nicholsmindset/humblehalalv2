export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { display_name, phone, email_notifications_reviews, email_notifications_events } = body

  const { error } = await (supabase as any)
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      display_name: display_name ?? null,
      phone: phone ?? null,
      email_notifications_reviews: email_notifications_reviews ?? true,
      email_notifications_events: email_notifications_events ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
