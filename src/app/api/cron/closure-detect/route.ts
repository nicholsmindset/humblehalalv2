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

// Business closure detection — monthly 15th 4am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  const db = getServiceClient()
  let checked = 0
  let closed = 0
  let errors = 0

  try {
    const { data: listings } = await db
      .from('listings')
      .select('id, name, google_place_id, status')
      .eq('status', 'active')
      .not('google_place_id', 'is', null)
      .limit(100)

    if (!listings?.length || !apiKey) {
      return NextResponse.json({
        ok: true,
        checked: 0,
        closed: 0,
        message: !apiKey ? 'No GOOGLE_MAPS_API_KEY' : 'No listings to check',
      })
    }

    for (const listing of listings) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${listing.google_place_id}&fields=business_status&key=${apiKey}`

        const res = await fetch(url)
        const data = await res.json()
        checked++

        if (data.result?.business_status === 'CLOSED_PERMANENTLY') {
          await db
            .from('listings')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', listing.id)
          closed++
        }
      } catch {
        errors++
      }
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:closure-detect',
      details: `Closure detection: ${checked} checked, ${closed} permanently closed, ${errors} errors`,
      metadata: { checked, closed, errors },
    })

    return NextResponse.json({ ok: true, checked, closed, errors })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Closure detection failed'
    console.error('[cron/closure-detect]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
