import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any

  const results: Record<string, unknown> = {}

  // Purge travel booking PII (12-month retention)
  const { error: travelError } = await db.rpc('purge_travel_booking_pii')
  results.travel_bookings = travelError ? { error: travelError.message } : { ok: true }

  // Purge event order PII (12-month retention)
  const { error: eventsError } = await db.rpc('purge_event_order_pii')
  results.event_orders = eventsError ? { error: eventsError.message } : { ok: true }

  const hasError = Object.values(results).some(
    (r) => typeof r === 'object' && r !== null && 'error' in r
  )

  console.log('[cron/pii-purge] Completed:', results)

  return NextResponse.json({
    ok: !hasError,
    results,
    purged_at: new Date().toISOString(),
  })
}
