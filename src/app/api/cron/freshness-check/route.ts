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

// Listings not updated in 90+ days are considered stale and queued for enrichment.
// Listings not updated in 180+ days that also have low ratings are escalated to admin.
const STALE_DAYS = 90
const ESCALATE_DAYS = 180
const BATCH_LIMIT = 100

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient() as any

  const now = new Date()
  const staleCutoff = new Date(now)
  staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS)

  const escalateCutoff = new Date(now)
  escalateCutoff.setDate(escalateCutoff.getDate() - ESCALATE_DAYS)

  try {
    // Fetch active listings not updated in 90+ days
    const { data: staleListings, error: fetchErr } = await db
      .from('listings')
      .select('id, name, slug, vertical, area, updated_at, rating_avg, review_count')
      .eq('status', 'active')
      .lt('updated_at', staleCutoff.toISOString())
      .order('updated_at', { ascending: true })
      .limit(BATCH_LIMIT)

    if (fetchErr) {
      console.error('[freshness-check] fetch error:', fetchErr)
      return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })
    }

    const listings = (staleListings ?? []) as {
      id: string
      name: string
      slug: string
      vertical: string
      area: string | null
      updated_at: string
      rating_avg: number | null
      review_count: number | null
    }[]

    if (listings.length === 0) {
      return NextResponse.json({ ok: true, queued: 0, escalated: 0, message: 'All listings are fresh' })
    }

    // Separate escalations (180+ days AND low rating)
    const escalated = listings.filter((l) => {
      const updatedAt = new Date(l.updated_at)
      const isVeryStale = updatedAt < escalateCutoff
      const isLowRated = l.rating_avg != null && l.rating_avg < 3.0
      return isVeryStale && isLowRated
    })

    // Queue all stale listings for enrichment
    const enrichmentInserts = listings.map((l) => ({
      listing_id: l.id,
      status: 'pending',
      priority: escalated.some((e) => e.id === l.id) ? 'high' : 'normal',
      reason: 'freshness_check',
      created_at: now.toISOString(),
    }))

    // Upsert into enrichment queue (deduplicated on listing_id if already pending)
    const { error: insertErr } = await db
      .from('ai_enrichment_queue')
      .upsert(enrichmentInserts, { onConflict: 'listing_id', ignoreDuplicates: true })

    if (insertErr) {
      console.warn('[freshness-check] enrichment queue insert warning:', insertErr.message)
    }

    // Log escalations into moderation log for admin visibility
    if (escalated.length > 0) {
      const escalationLogs = escalated.map((l) => ({
        content_type: 'listing',
        content_id: l.id,
        action: 'flagged',
        reason: `Listing stale for 180+ days with rating ${l.rating_avg?.toFixed(1) ?? 'N/A'} — possible closure`,
        created_at: now.toISOString(),
      }))

      const { error: logErr } = await db
        .from('ai_moderation_log')
        .insert(escalationLogs)

      if (logErr) {
        console.warn('[freshness-check] moderation log insert warning:', logErr.message)
      }
    }

    // Activity log
    await db.from('ai_activity_log').insert({
      activity_type: 'freshness_check',
      activity_data: {
        checked_at: now.toISOString(),
        stale_threshold_days: STALE_DAYS,
        escalate_threshold_days: ESCALATE_DAYS,
        stale_found: listings.length,
        queued_for_enrichment: listings.length,
        escalated_to_admin: escalated.length,
      },
      created_at: now.toISOString(),
    })

    return NextResponse.json({
      ok: true,
      queued: listings.length,
      escalated: escalated.length,
      cutoffDate: staleCutoff.toISOString().split('T')[0],
    })
  } catch (err: unknown) {
    console.error('[freshness-check] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
