/**
 * Seed: Google Places Enrichment
 * For each active listing without coordinates or photos, fetches enriched data
 * from Google Places API: photos, rating, opening hours, website, phone.
 * Run: node supabase/seed/places.js
 * Requires: GOOGLE_MAPS_API_KEY in .env.local
 */
import { getClient, log, logErr } from './utils.js'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

const PLACES_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
const PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'
const PLACES_PHOTO_URL  = 'https://maps.googleapis.com/maps/api/place/photo'

async function findPlace(name, address) {
  const input = `${name} ${address} Singapore`
  const url = new URL(PLACES_SEARCH_URL)
  url.searchParams.set('input', input)
  url.searchParams.set('inputtype', 'textquery')
  url.searchParams.set('fields', 'place_id,name')
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)

  const res = await fetch(url.toString())
  const json = await res.json()
  return json.candidates?.[0]?.place_id ?? null
}

async function getPlaceDetails(placeId) {
  const url = new URL(PLACES_DETAILS_URL)
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', [
    'name', 'formatted_address', 'formatted_phone_number',
    'website', 'rating', 'user_ratings_total',
    'opening_hours', 'photos', 'geometry',
  ].join(','))
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)

  const res = await fetch(url.toString())
  const json = await res.json()
  return json.result ?? null
}

function photoUrl(photoRef, maxWidth = 800) {
  return `${PLACES_PHOTO_URL}?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`
}

function parseHours(openingHours) {
  if (!openingHours?.periods) return null
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return openingHours.periods.map((p) => ({
    day: days[p.open?.day ?? 0],
    open: p.open?.time ?? '0000',
    close: p.close?.time ?? '2359',
  }))
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function seed() {
  if (!GOOGLE_MAPS_API_KEY) {
    log('GOOGLE_MAPS_API_KEY not set — skipping Places enrichment')
    log('Add GOOGLE_MAPS_API_KEY to .env.local and re-run to enrich listings')
    return
  }

  const supabase = getClient()

  // Fetch listings that need enrichment (no photos yet)
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, name, address, area, avg_rating, review_count')
    .eq('status', 'active')
    .filter('photos', 'eq', '{}')
    .limit(100)

  if (error) { logErr('fetch listings', error); return }
  if (!listings?.length) { log('No listings need enrichment'); return }

  log(`Enriching ${listings.length} listings via Google Places...`)

  let enriched = 0
  let skipped = 0

  for (const listing of listings) {
    try {
      const placeId = await findPlace(listing.name, listing.address ?? listing.area)
      if (!placeId) {
        log(`  no match: "${listing.name}"`)
        skipped++
        continue
      }

      await sleep(200) // respect rate limits

      const details = await getPlaceDetails(placeId)
      if (!details) { skipped++; continue }

      const photos = (details.photos ?? [])
        .slice(0, 5)
        .map((p) => photoUrl(p.photo_reference))

      const updateData = {}
      if (photos.length)             updateData.photos = photos
      if (details.formatted_phone_number) updateData.phone = details.formatted_phone_number
      if (details.website)           updateData.website = details.website
      if (details.rating)            updateData.avg_rating = details.rating
      if (details.user_ratings_total) updateData.review_count = details.user_ratings_total
      if (details.opening_hours)     updateData.operating_hours = parseHours(details.opening_hours)

      if (Object.keys(updateData).length) {
        const { error: updateErr } = await supabase
          .from('listings')
          .update(updateData)
          .eq('id', listing.id)

        if (updateErr) {
          logErr(`update "${listing.name}"`, updateErr)
        } else {
          log(`  ✓ enriched: "${listing.name}"`)
          enriched++
        }
      }

      await sleep(300)
    } catch (err) {
      logErr(`places fetch for "${listing.name}"`, err)
      skipped++
    }
  }

  log(`Done: ${enriched} enriched, ${skipped} skipped/errors`)
}

seed().catch((err) => {
  logErr('seed failed', err)
  process.exit(1)
})
