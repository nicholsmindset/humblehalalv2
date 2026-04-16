export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'
import { findPlace, getPlaceDetails } from '@/lib/maps/client'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Process up to 20 listings per run to stay within Google Places API quota
// and Vercel function timeout (10s default, 60s max on Pro)
const BATCH_SIZE = 20

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.warn('[places-refresh] GOOGLE_MAPS_API_KEY not set — skipping')
    return NextResponse.json({ ok: true, skipped: true, reason: 'GOOGLE_MAPS_API_KEY not configured' })
  }

  const db = getServiceClient() as any

  try {
    // Pull the oldest-enriched pending entries from the enrichment queue
    // (freshness-check and closure-detect both insert here)
    const { data: queueItems, error: fetchErr } = await db
      .from('ai_enrichment_queue')
      .select('id, listing_id, priority')
      .eq('status', 'pending')
      .order('priority', { ascending: false }) // 'high' sorts before 'normal' alphabetically
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchErr) {
      console.error('[places-refresh] queue fetch error:', fetchErr)
      return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })
    }

    const items = (queueItems ?? []) as { id: string; listing_id: string; priority: string }[]

    if (items.length === 0) {
      return NextResponse.json({ ok: true, enriched: 0, message: 'Enrichment queue is empty' })
    }

    // Fetch listing details for all queued items
    const listingIds = items.map((i) => i.listing_id)
    const { data: listings, error: listingsErr } = await db
      .from('listings')
      .select('id, name, address, area, google_place_id')
      .in('id', listingIds)

    if (listingsErr) {
      console.error('[places-refresh] listings fetch error:', listingsErr)
      return NextResponse.json({ ok: false, error: listingsErr.message }, { status: 500 })
    }

    const listingMap = new Map(
      ((listings ?? []) as {
        id: string
        name: string
        address: string | null
        area: string | null
        google_place_id: string | null
      }[]).map((l) => [l.id, l])
    )

    let enriched = 0
    let failed = 0
    const results: { listing_id: string; status: string; place_id?: string }[] = []

    for (const item of items) {
      const listing = listingMap.get(item.listing_id)
      if (!listing) {
        // Mark as failed — listing was deleted
        await db
          .from('ai_enrichment_queue')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', item.id)
        continue
      }

      try {
        // Use existing place ID if we have it, otherwise search
        let placeId = listing.google_place_id as string | null
        let placeLocation: { lat: number; lng: number } | undefined

        if (!placeId) {
          const searchQuery = listing.address
            ? `${listing.name} ${listing.address}`
            : `${listing.name} ${listing.area ?? ''} Singapore`

          const found = await findPlace(searchQuery)
          if (found) {
            placeId = found.placeId
            placeLocation = found.location
          }
        }

        if (!placeId) {
          await db
            .from('ai_enrichment_queue')
            .update({ status: 'no_place_found', updated_at: new Date().toISOString() })
            .eq('id', item.id)
          failed++
          results.push({ listing_id: item.listing_id, status: 'no_place_found' })
          continue
        }

        // Fetch fresh details
        const details = await getPlaceDetails(placeId)
        if (!details) {
          await db
            .from('ai_enrichment_queue')
            .update({ status: 'details_fetch_failed', updated_at: new Date().toISOString() })
            .eq('id', item.id)
          failed++
          results.push({ listing_id: item.listing_id, status: 'details_fetch_failed', place_id: placeId })
          continue
        }

        // Build update payload — only update fields that Google Places provides
        const updatePayload: Record<string, unknown> = {
          google_place_id: placeId,
          updated_at: new Date().toISOString(),
        }

        if (details.phone) updatePayload.phone = details.phone
        if (details.website) updatePayload.website = details.website
        if (details.hours?.length) updatePayload.opening_hours = details.hours
        if (details.photos?.length) updatePayload.photos = details.photos.slice(0, 5)

        // Flag possibly closed based on business status
        if (details.businessStatus === 'CLOSED_PERMANENTLY') {
          updatePayload.status = 'closed'
          // Log this to moderation for admin review
          await db.from('ai_moderation_log').insert({
            content_type: 'listing',
            content_id: item.listing_id,
            action: 'flagged',
            reason: 'Google Places reports CLOSED_PERMANENTLY — marking as closed',
            created_at: new Date().toISOString(),
          })
        } else if (details.businessStatus === 'CLOSED_TEMPORARILY') {
          updatePayload.status = 'temporarily_closed'
        }

        // Update location if not already set and we found coordinates
        if (placeLocation) {
          updatePayload.location = `POINT(${placeLocation.lng} ${placeLocation.lat})`
        }

        await db.from('listings').update(updatePayload).eq('id', item.listing_id)

        // Mark queue item as done
        await db
          .from('ai_enrichment_queue')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', item.id)

        enriched++
        results.push({ listing_id: item.listing_id, status: 'enriched', place_id: placeId })
      } catch (itemErr) {
        console.error(`[places-refresh] error enriching listing ${item.listing_id}:`, itemErr)
        await db
          .from('ai_enrichment_queue')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', item.id)
        failed++
        results.push({ listing_id: item.listing_id, status: 'failed' })
      }

      // Small delay between Places API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Activity log
    await db.from('ai_activity_log').insert({
      activity_type: 'places_refresh',
      activity_data: {
        refreshed_at: new Date().toISOString(),
        batch_size: items.length,
        enriched,
        failed,
        results,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, processed: items.length, enriched, failed })
  } catch (err: unknown) {
    console.error('[places-refresh] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
