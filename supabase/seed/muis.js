#!/usr/bin/env node
/**
 * Seed: MUIS Halal Directory
 * ---------------------------
 * Imports a representative set of MUIS-certified food establishments.
 * In production, replace the SAMPLE_DATA array with data fetched from
 * the official MUIS Halal Certificates API or a scraped/exported CSV.
 *
 * MUIS API reference: https://www.muis.gov.sg/halal/Halal-Certificates
 *
 * Usage: npm run seed:muis
 */

const { getSupabase, slugify, chunk } = require('./utils')

// ── Sample MUIS-certified data ─────────────────────────────────────────────
// Replace with real MUIS API data in production.
// Fields mirror the `listings` + `listings_food` tables.
const SAMPLE_DATA = [
  {
    name: 'The Coconut Club',
    area: 'arab-street',
    address: '6 Ann Siang Hill, Singapore 069787',
    cuisine: ['malay', 'singaporean'],
    price_range: 3,
    phone: '+6562227203',
    website: 'https://thecoconutclub.sg',
    muis_cert_no: 'MH-2024-001',
    lat: 1.2808, lng: 103.8457,
  },
  {
    name: 'Hjh Maimunah Restaurant',
    area: 'bugis',
    address: '11 & 15 Jalan Pisang, Singapore 199078',
    cuisine: ['malay'],
    price_range: 2,
    phone: '+6562979658',
    website: null,
    muis_cert_no: 'MH-2024-002',
    lat: 1.3015, lng: 103.8566,
  },
  {
    name: 'Zam Zam Restaurant',
    area: 'arab-street',
    address: '697-699 North Bridge Rd, Singapore 198675',
    cuisine: ['indian', 'malay'],
    price_range: 1,
    phone: '+6562982011',
    website: null,
    muis_cert_no: 'MH-2024-003',
    lat: 1.3030, lng: 103.8568,
  },
  {
    name: 'Nasi Lemak Kukus',
    area: 'woodlands',
    address: '888 Woodlands Drive 50, #01-748, Singapore 730888',
    cuisine: ['malay'],
    price_range: 1,
    phone: null,
    website: null,
    muis_cert_no: 'MH-2024-004',
    lat: 1.4356, lng: 103.7863,
  },
  {
    name: 'Springleaf Prata Place',
    area: 'ang-mo-kio',
    address: '1 Thong Soon Ave, Singapore 787431',
    cuisine: ['indian', 'mamak'],
    price_range: 1,
    phone: '+6564584800',
    website: 'https://springleafprata.com',
    muis_cert_no: 'MH-2024-005',
    lat: 1.3804, lng: 103.8351,
  },
  {
    name: "Mad Jack's",
    area: 'bugis',
    address: '200 Victoria St, Bugis+, #B1-09, Singapore 188021',
    cuisine: ['western'],
    price_range: 2,
    phone: null,
    website: null,
    muis_cert_no: 'MH-2024-006',
    lat: 1.2998, lng: 103.8547,
  },
  {
    name: 'Salam Restaurant',
    area: 'geylang-serangoon',
    address: '261 Geylang Rd, Singapore 389319',
    cuisine: ['malay', 'indonesian'],
    price_range: 1,
    phone: '+6567441148',
    website: null,
    muis_cert_no: 'MH-2024-007',
    lat: 1.3184, lng: 103.8822,
  },
  {
    name: 'Al-Tazzag Restaurant',
    area: 'arab-street',
    address: '19 Bussorah St, Singapore 199437',
    cuisine: ['middle-eastern', 'turkish'],
    price_range: 2,
    phone: '+6562968566',
    website: null,
    muis_cert_no: 'MH-2024-008',
    lat: 1.3031, lng: 103.8597,
  },
  {
    name: 'Seoul Yummy',
    area: 'tampines',
    address: 'Tampines Mall, 4 Tampines Central 5, #04-19, Singapore 529510',
    cuisine: ['korean'],
    price_range: 2,
    phone: null,
    website: null,
    muis_cert_no: 'MH-2024-009',
    lat: 1.3522, lng: 103.9448,
  },
  {
    name: 'Paya Lebar Quarter Halal Hawker',
    area: 'geylang-serangoon',
    address: '10 Paya Lebar Rd, PLQ, Singapore 409057',
    cuisine: ['malay', 'chinese', 'indian'],
    price_range: 1,
    phone: null,
    website: null,
    muis_cert_no: 'MH-2024-010',
    lat: 1.3174, lng: 103.8922,
  },
  {
    name: 'Bismillah Biryani',
    area: 'woodlands',
    address: '10 Woodlands Square, #01-05, Singapore 737714',
    cuisine: ['indian'],
    price_range: 2,
    phone: '+6563670808',
    website: null,
    muis_cert_no: 'MH-2024-011',
    lat: 1.4369, lng: 103.7864,
  },
  {
    name: 'Warong Nasi Pariaman',
    area: 'arab-street',
    address: '738 North Bridge Rd, Singapore 198706',
    cuisine: ['malay', 'indonesian'],
    price_range: 1,
    phone: '+6563936403',
    website: null,
    muis_cert_no: 'MH-2024-012',
    lat: 1.3033, lng: 103.8575,
  },
  {
    name: 'Ya Kun Kaya Toast (Halal certified branches)',
    area: 'city',
    address: '18 China Street, Far East Square, #01-01, Singapore 049560',
    cuisine: ['cafe', 'singaporean'],
    price_range: 1,
    phone: '+6563248007',
    website: 'https://yakun.com',
    muis_cert_no: 'MH-2024-013',
    lat: 1.2853, lng: 103.8481,
  },
  {
    name: 'PappaRich',
    area: 'orchard',
    address: '313@Somerset, 313 Orchard Rd, #B3-23, Singapore 238895',
    cuisine: ['malay', 'mamak', 'malaysian'],
    price_range: 2,
    phone: '+6562375128',
    website: 'https://papparich.com.sg',
    muis_cert_no: 'MH-2024-014',
    lat: 1.3005, lng: 103.8397,
  },
  {
    name: 'Pondok Makan Minang',
    area: 'tampines',
    address: '862 Tampines Ave 8, Singapore 520862',
    cuisine: ['indonesian', 'malay'],
    price_range: 1,
    phone: null,
    website: null,
    muis_cert_no: 'MH-2024-015',
    lat: 1.3590, lng: 103.9427,
  },
]

async function main() {
  console.log('🕌 Seeding MUIS halal directory...')
  const supabase = getSupabase()

  const listings = SAMPLE_DATA.map((item) => ({
    name: item.name,
    slug: slugify(`${item.name}-${item.area}`),
    vertical: 'food',
    area: item.area,
    address: item.address,
    phone: item.phone ?? null,
    website: item.website ?? null,
    halal_status: 'muis_certified',
    muis_cert_no: item.muis_cert_no,
    muis_expiry: new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10), // 1 year from now
    status: 'active',
    featured: false,
    avg_rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 – 5.0
    review_count: Math.floor(Math.random() * 120) + 5,
    // PostGIS geometry — set via coordinates if available
    // location: `SRID=4326;POINT(${item.lng} ${item.lat})` — requires raw SQL or PostGIS function
  }))

  // Upsert by (vertical, slug) to be idempotent
  const slugs = listings.map((l) => l.slug)

  for (const batch of chunk(listings, 10)) {
    const { error } = await supabase
      .from('listings')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false })

    if (error) {
      console.error('Error inserting listings batch:', error.message)
      // Continue rather than abort — slug conflicts are expected on re-runs
    }
  }

  console.log(`  ✓ Upserted ${listings.length} MUIS listings`)

  // Seed listings_food extension rows
  const { data: insertedListings } = await supabase
    .from('listings')
    .select('id, slug')
    .in('slug', slugs)

  if (insertedListings && insertedListings.length > 0) {
    const foodRows = insertedListings.map((l) => {
      const original = SAMPLE_DATA.find((s) => slugify(`${s.name}-${s.area}`) === l.slug)
      return {
        listing_id: l.id,
        cuisine_types: original?.cuisine ?? [],
        price_range: original?.price_range ?? 2,
      }
    })

    for (const batch of chunk(foodRows, 10)) {
      const { error } = await supabase
        .from('listings_food')
        .upsert(batch, { onConflict: 'listing_id', ignoreDuplicates: false })

      if (error) console.error('Error inserting listings_food batch:', error.message)
    }
    console.log(`  ✓ Upserted ${foodRows.length} food extension rows`)
  }

  console.log(`✅ MUIS seed complete: ${listings.length} establishments`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
