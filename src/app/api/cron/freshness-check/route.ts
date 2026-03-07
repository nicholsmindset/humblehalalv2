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

// Listing freshness score calculation — weekly Mon 3am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient()
  let scored = 0

  try {
    const { data: listings } = await db
      .from('listings')
      .select('id, name, updated_at, created_at, google_rating, status, photos, description, phone, website')
      .eq('status', 'active')
      .limit(500)

    if (!listings?.length) {
      return NextResponse.json({ ok: true, scored: 0 })
    }

    const now = Date.now()

    for (const listing of listings) {
      let score = 100

      // Recency: -2 points per week since last update (max -40)
      const updatedAt = new Date(listing.updated_at ?? listing.created_at).getTime()
      const weeksSinceUpdate = Math.floor((now - updatedAt) / (7 * 24 * 60 * 60 * 1000))
      score -= Math.min(weeksSinceUpdate * 2, 40)

      // Completeness penalties
      if (!listing.photos?.length) score -= 10
      if (!listing.description) score -= 10
      if (!listing.phone) score -= 5
      if (!listing.website) score -= 5

      // Google rating bonus
      if (listing.google_rating && listing.google_rating >= 4.0) score += 5

      score = Math.max(0, Math.min(100, score))

      await db.from('listings').update({ freshness_score: score }).eq('id', listing.id)
      scored++
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:freshness-check',
      details: `Freshness check: ${scored} listings scored`,
      metadata: { scored },
    })

    return NextResponse.json({ ok: true, scored })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Freshness check failed'
    console.error('[cron/freshness-check]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
