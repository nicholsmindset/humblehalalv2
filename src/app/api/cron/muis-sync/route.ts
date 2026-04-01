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

  try {
    // Flag MUIS-certified listings that haven't been reverified in 90+ days
    // for manual review by admin. MUIS doesn't expose a public API, so we
    // use a conservative staleness-based approach.
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: staleListings, error: fetchErr } = await db
      .from('listings')
      .select('id, name, area')
      .eq('halal_status', 'muis_certified')
      .eq('status', 'active')
      .or(`last_muis_check.is.null,last_muis_check.lt.${ninetyDaysAgo.toISOString()}`)
      .limit(50) // process in batches to avoid timeouts

    if (fetchErr) {
      console.error('[muis-sync] fetch error:', fetchErr)
      return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })
    }

    const flaggedCount = staleListings?.length ?? 0

    if (flaggedCount > 0) {
      const ids = (staleListings as { id: string }[]).map((l) => l.id)

      // Mark as needing reverification (column may not exist yet — ignore gracefully)
      const { error: updateErr } = await db
        .from('listings')
        .update({
          needs_muis_reverification: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)

      if (updateErr) {
        // Column may not exist — log but don't fail
        console.warn('[muis-sync] update warning (column may not exist):', updateErr.message)
      }
    }

    // Log the sync run
    const { error: logErr } = await db
      .from('ai_activity_log')
      .insert({
        activity_type: 'muis_sync',
        activity_data: {
          flagged_for_reverification: flaggedCount,
          cutoff_date: ninetyDaysAgo.toISOString().split('T')[0],
          synced_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })

    if (logErr) {
      console.warn('[muis-sync] log insert warning:', logErr.message)
    }

    return NextResponse.json({
      ok: true,
      flaggedForReverification: flaggedCount,
      cutoffDate: ninetyDaysAgo.toISOString().split('T')[0],
    })
  } catch (err: unknown) {
    console.error('[muis-sync] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
