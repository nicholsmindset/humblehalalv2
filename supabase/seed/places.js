#!/usr/bin/env node

/**
 * Google Places enrichment script.
 * Finds Google Place IDs for existing listings and updates with Places data.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GOOGLE_MAPS_API_KEY=... node supabase/seed/places.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!MAPS_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY — required for Places enrichment')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

async function findPlaceId(name, address) {
  const query = encodeURIComponent(`${name} ${address}`)
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,formatted_address,geometry&key=${MAPS_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.status === 'OK' && data.candidates?.length > 0) {
    return data.candidates[0]
  }
  return null
}

async function getPlaceDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,opening_hours,rating,user_ratings_total,business_status,price_level,photos&key=${MAPS_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.status === 'OK') return data.result
  return null
}

async function enrichListings() {
  console.log('Enriching listings with Google Places data...\n')

  // Get listings without Google Place IDs
  const { data: listings } = await db
    .from('listings')
    .select('id, name, address, area, google_place_id')
    .eq('status', 'active')
    .is('google_place_id', null)
    .limit(50)

  if (!listings?.length) {
    console.log('No listings need enrichment.')
    return
  }

  let enriched = 0
  let skipped = 0

  for (const listing of listings) {
    console.log(`\nProcessing: ${listing.name}...`)

    // Find Place ID
    const candidate = await findPlaceId(listing.name, listing.address || listing.area)
    if (!candidate) {
      console.log(`  ⚠ No Google Places match found`)
      skipped++
      continue
    }

    const placeId = candidate.place_id
    console.log(`  Found: ${placeId}`)

    // Get details
    const details = await getPlaceDetails(placeId)
    if (!details) {
      console.log(`  ⚠ Could not fetch details`)
      skipped++
      continue
    }

    // Build update
    const updates = {
      google_place_id: placeId,
      updated_at: new Date().toISOString(),
    }

    if (details.formatted_phone_number && !listing.phone) {
      updates.phone = details.formatted_phone_number
    }
    if (details.website && !listing.website) {
      updates.website = details.website
    }
    if (details.rating) {
      updates.google_rating = details.rating
    }
    if (details.user_ratings_total) {
      updates.google_review_count = details.user_ratings_total
    }
    if (details.opening_hours?.weekday_text) {
      updates.operating_hours = details.opening_hours.weekday_text
    }
    if (details.price_level !== undefined) {
      updates.price_level = details.price_level
    }

    // Update listing with coordinates
    if (candidate.geometry?.location) {
      const { lat, lng } = candidate.geometry.location
      // PostGIS point update via raw SQL would be better,
      // but for seed script, store lat/lng for manual PostGIS update
      updates.latitude = lat
      updates.longitude = lng
    }

    const { error } = await db
      .from('listings')
      .update(updates)
      .eq('id', listing.id)

    if (error) {
      console.error(`  ✗ Update failed:`, error.message)
      skipped++
    } else {
      console.log(`  ✓ Enriched (rating: ${details.rating ?? 'N/A'}, reviews: ${details.user_ratings_total ?? 0})`)
      enriched++
    }

    // Respect API rate limits
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`\n✅ Places enrichment: ${enriched} enriched, ${skipped} skipped`)
}

enrichListings().catch((err) => {
  console.error('Places enrichment failed:', err)
  process.exit(1)
})
