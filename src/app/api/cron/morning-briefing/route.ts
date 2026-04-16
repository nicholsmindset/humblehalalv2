export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient() as any

  // Yesterday's date range in UTC
  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setUTCDate(dayStart.getUTCDate() - 1)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setUTCHours(23, 59, 59, 999)
  const dateStr = dayStart.toISOString().split('T')[0]

  try {
    // Gather yesterday's activity in parallel
    const [
      { count: newListings },
      { count: newReviews },
      { count: pendingModerations },
      { count: newBookings },
      { count: newEvents },
    ] = await Promise.all([
      db.from('listings').select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString()),
      db.from('reviews').select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString()),
      db.from('reviews').select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      db.from('travel_bookings').select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString()),
      db.from('events').select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString()),
    ])

    const stats = {
      date: dateStr,
      new_listings: newListings ?? 0,
      new_reviews: newReviews ?? 0,
      pending_moderations: pendingModerations ?? 0,
      new_bookings: newBookings ?? 0,
      new_events: newEvents ?? 0,
    }

    // Insert into ai_activity_log for the /admin morning briefing page to read
    const { error: logErr } = await db
      .from('ai_activity_log')
      .insert({
        activity_type: 'morning_briefing',
        activity_data: stats,
        created_at: new Date().toISOString(),
      })

    if (logErr) {
      console.warn('[morning-briefing] log insert warning:', logErr.message)
    }

    return NextResponse.json({ ok: true, stats })
  } catch (err: unknown) {
    console.error('[morning-briefing] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
