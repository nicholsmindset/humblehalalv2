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

// Google Places data refresh — monthly 1st 4am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_MAPS_API_KEY not set' }, { status: 500 })
  }

  const db = getServiceClient()
  let refreshed = 0
  let errors = 0

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: listings } = await db
      .from('listings')
      .select('id, name, google_place_id, updated_at')
      .not('google_place_id', 'is', null)
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .limit(50)

    if (!listings?.length) {
      return NextResponse.json({ ok: true, refreshed: 0, message: 'No listings need refresh' })
    }

    for (const listing of listings) {
      try {
        const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${listing.google_place_id}&fields=name,formatted_phone_number,website,opening_hours,rating,user_ratings_total,business_status,price_level&key=${apiKey}`

        const res = await fetch(placeUrl)
        const data = await res.json()

        if (data.status !== 'OK' || !data.result) {
          errors++
          continue
        }

        const place = data.result
        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }

        if (place.formatted_phone_number) updates.phone = place.formatted_phone_number
        if (place.website) updates.website = place.website
        if (place.rating) updates.google_rating = place.rating
        if (place.user_ratings_total) updates.google_review_count = place.user_ratings_total
        if (place.opening_hours?.weekday_text) updates.opening_hours = place.opening_hours.weekday_text
        if (place.price_level !== undefined) updates.price_level = place.price_level

        if (place.business_status === 'CLOSED_PERMANENTLY') {
          updates.status = 'archived'
        } else if (place.business_status === 'CLOSED_TEMPORARILY') {
          updates.status = 'inactive'
        }

        await db.from('listings').update(updates).eq('id', listing.id)
        refreshed++
      } catch {
        errors++
      }
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:places-refresh',
      details: `Places refresh: ${refreshed} updated, ${errors} errors`,
      metadata: { refreshed, errors, total: listings.length },
    })

    return NextResponse.json({ ok: true, refreshed, errors })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Places refresh failed'
    console.error('[cron/places-refresh]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
