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

// Heuristics for "possibly closed":
//   • No reviews in the past 120 days AND rating_avg < 3.0
//   • No reviews ever (review_count = 0) AND listing was created > 180 days ago
//   • Review sentiment signals closure (future: NLP; for now, low rating threshold)
const NO_REVIEWS_DAYS = 120
const LOW_RATING_THRESHOLD = 3.0
const NEW_LISTING_GRACE_DAYS = 180
const BATCH_LIMIT = 50

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient() as any

  const now = new Date()
  const noReviewsCutoff = new Date(now)
  noReviewsCutoff.setDate(noReviewsCutoff.getDate() - NO_REVIEWS_DAYS)

  const newListingCutoff = new Date(now)
  newListingCutoff.setDate(newListingCutoff.getDate() - NEW_LISTING_GRACE_DAYS)

  try {
    // Fetch active listings for closure analysis
    const { data: listings, error: fetchErr } = await db
      .from('listings')
      .select('id, name, slug, vertical, area, created_at, rating_avg, review_count')
      .eq('status', 'active')
      .limit(BATCH_LIMIT)

    if (fetchErr) {
      console.error('[closure-detect] fetch error:', fetchErr)
      return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })
    }

    const candidates = (listings ?? []) as {
      id: string
      name: string
      slug: string
      vertical: string
      area: string | null
      created_at: string
      rating_avg: number | null
      review_count: number | null
    }[]

    const flagged: typeof candidates = []

    for (const listing of candidates) {
      const createdAt = new Date(listing.created_at)
      const reviewCount = listing.review_count ?? 0
      const ratingAvg = listing.rating_avg ?? 0

      const isOldEnough = createdAt < newListingCutoff

      // Heuristic 1: Old listing with zero reviews
      if (isOldEnough && reviewCount === 0) {
        flagged.push(listing)
        continue
      }

      // Heuristic 2: Has reviews but rating is very low
      if (reviewCount > 0 && ratingAvg < LOW_RATING_THRESHOLD) {
        // Fetch most recent review date to check recency
        const { data: latestReview } = await db
          .from('reviews')
          .select('created_at')
          .eq('listing_id', listing.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!latestReview) continue

        const lastReviewDate = new Date(latestReview.created_at)
        if (lastReviewDate < noReviewsCutoff) {
          // No recent reviews AND low rating — possible closure
          flagged.push(listing)
        }
      }
    }

    if (flagged.length === 0) {
      return NextResponse.json({
        ok: true,
        checked: candidates.length,
        possiblyClosedFound: 0,
        message: 'No closure candidates found',
      })
    }

    // Insert flagged listings into moderation log for admin review
    const flagInserts = flagged.map((l) => ({
      content_type: 'listing',
      content_id: l.id,
      action: 'flagged',
      reason: `Possibly closed — ${l.review_count === 0
        ? 'No reviews after 180+ days'
        : `Low rating (${l.rating_avg?.toFixed(1)}) with no recent reviews`}. Manual check recommended.`,
      created_at: now.toISOString(),
    }))

    const { error: flagErr } = await db
      .from('ai_moderation_log')
      .insert(flagInserts)

    if (flagErr) {
      console.warn('[closure-detect] moderation log insert warning:', flagErr.message)
    }

    // Also queue these for Places API refresh to get latest business_status
    const enrichInserts = flagged.map((l) => ({
      listing_id: l.id,
      status: 'pending',
      priority: 'high',
      reason: 'closure_detect',
      created_at: now.toISOString(),
    }))

    await db
      .from('ai_enrichment_queue')
      .upsert(enrichInserts, { onConflict: 'listing_id', ignoreDuplicates: true })

    // Activity log
    await db.from('ai_activity_log').insert({
      activity_type: 'closure_detect',
      activity_data: {
        detected_at: now.toISOString(),
        checked: candidates.length,
        possibly_closed: flagged.length,
        flagged_ids: flagged.map((l) => l.id),
      },
      created_at: now.toISOString(),
    })

    return NextResponse.json({
      ok: true,
      checked: candidates.length,
      possiblyClosedFound: flagged.length,
    })
  } catch (err: unknown) {
    console.error('[closure-detect] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
