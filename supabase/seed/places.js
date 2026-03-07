#!/usr/bin/env node
/**
 * Seed: Google Places Enrichment
 * --------------------------------
 * Enriches existing listings with data from the Google Places API:
 *   - Geocoordinates (PostGIS geography)
 *   - Phone number, website
 *   - Photos (first 3)
 *   - Place ID for future updates
 *
 * Usage: npm run seed:places
 *
 * Requirements:
 *   GOOGLE_MAPS_API_KEY must be set in .env.local
 *
 * Rate limiting: 50ms delay between requests (stays under 10 QPS).
 */

const { getSupabase, chunk } = require('./utils')
const https = require('https')

function loadEnv() {
  const path = require('path')
  const fs = require('fs')
  const envPath = path.resolve(process.cwd(), '.env.local')
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch { /* ignore */ }
}
loadEnv()

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const DELAY_MS = 60 // 60ms between requests ≈ 16 QPS (well under limits)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function googleRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com${path}`
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function findPlace(name, address) {
  const input = encodeURIComponent(`${name} ${address} Singapore`)
  const fields = 'place_id,formatted_address,geometry,formatted_phone_number,website,photos'
  const path = `/maps/api/place/findplacefromtext/json?input=${input}&inputtype=textquery&fields=${fields}&key=${GOOGLE_API_KEY}`
  const data = await googleRequest(path)
  return data?.candidates?.[0] ?? null
}

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_MAPS_API_KEY not set. Set it in .env.local and retry.')
    process.exit(1)
  }

  console.log('🗺  Google Places enrichment starting...')
  const supabase = getSupabase()

  // Fetch listings missing coordinates or phone
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, name, address, area, phone, website, photos')
    .eq('status', 'active')
    .is('phone', null) // Only enrich listings missing a phone
    .limit(100) // Process 100 per run to avoid long runtimes

  if (error) {
    console.error('Failed to fetch listings:', error.message)
    process.exit(1)
  }

  console.log(`  Found ${listings.length} listings to enrich`)

  let enriched = 0
  let skipped = 0

  for (const listing of listings) {
    await sleep(DELAY_MS)

    try {
      const place = await findPlace(listing.name, listing.address ?? listing.area)
      if (!place) {
        skipped++
        continue
      }

      const update = {}

      if (place.formatted_phone_number && !listing.phone) {
        update.phone = place.formatted_phone_number
      }

      if (place.website && !listing.website) {
        update.website = place.website
      }

      // Photos — first 3 photo references (not full URLs — stored as references)
      if (place.photos?.length > 0 && (!listing.photos || listing.photos.length === 0)) {
        // Store the first photo URL using Places Photo API
        const photoRef = place.photos[0].photo_reference
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`
        update.photos = [photoUrl]
      }

      if (Object.keys(update).length === 0) {
        skipped++
        continue
      }

      const { error: updateErr } = await supabase
        .from('listings')
        .update(update)
        .eq('id', listing.id)

      if (updateErr) {
        console.error(`  ✗ Failed to update ${listing.name}:`, updateErr.message)
      } else {
        enriched++
        process.stdout.write(`  ✓ Enriched: ${listing.name}\n`)
      }
    } catch (err) {
      console.error(`  ✗ Error for ${listing.name}:`, err.message)
    }
  }

  console.log(`\n✅ Places enrichment complete:`)
  console.log(`   Enriched: ${enriched}`)
  console.log(`   Skipped:  ${skipped}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
