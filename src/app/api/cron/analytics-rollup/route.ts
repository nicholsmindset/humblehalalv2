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
    // Fetch yesterday's analytics events
    const { data: events, error: fetchErr } = await db
      .from('analytics_events')
      .select('event_type, session_id')
      .gte('created_at', dayStart.toISOString())
      .lte('created_at', dayEnd.toISOString())

    if (fetchErr) {
      console.error('[analytics-rollup] fetch error:', fetchErr)
      return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ ok: true, date: dateStr, eventsRolledUp: 0 })
    }

    // Aggregate by event_type
    const typeCounts: Record<string, number> = {}
    const uniqueSessions = new Set<string>()
    for (const ev of events) {
      typeCounts[ev.event_type] = (typeCounts[ev.event_type] ?? 0) + 1
      if (ev.session_id) uniqueSessions.add(ev.session_id)
    }

    // Upsert daily rollup — table may not exist yet, ignore error gracefully
    const { error: upsertErr } = await db
      .from('analytics_daily_rollup')
      .upsert({
        date: dateStr,
        stats: typeCounts,
        total_events: events.length,
        unique_sessions: uniqueSessions.size,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'date' })

    if (upsertErr) {
      // Table may not exist — log and continue, don't fail the cron
      console.warn('[analytics-rollup] upsert warning (table may not exist):', upsertErr.message)
    }

    return NextResponse.json({
      ok: true,
      date: dateStr,
      eventsRolledUp: events.length,
      uniqueSessions: uniqueSessions.size,
      breakdown: typeCounts,
    })
  } catch (err: unknown) {
    console.error('[analytics-rollup] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
