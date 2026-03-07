#!/usr/bin/env node
/**
 * Seed: Sample Listings (all verticals)
 * --------------------------------------
 * Generates representative sample listings for local development and testing.
 * Covers: food, catering, services, products, events, classifieds.
 *
 * Usage: node supabase/seed/sample-listings.js
 */

const { getSupabase, slugify, chunk, randomElement, randomInt } = require('./utils')

// ── Food listings ─────────────────────────────────────────────────────────────
const FOOD_LISTINGS = [
  { name: 'Warung Pak Noor', area: 'tampines', cuisine: ['malay'], price_range: 1, halal_status: 'muis_certified' },
  { name: 'The Halal Guys', area: 'orchard', cuisine: ['middle-eastern', 'western'], price_range: 2, halal_status: 'muis_certified' },
  { name: 'Cedele (Halal)', area: 'marina-bay', cuisine: ['western', 'cafe'], price_range: 3, halal_status: 'muis_certified' },
  { name: 'Briyani House', area: 'geylang-serangoon', cuisine: ['indian'], price_range: 2, halal_status: 'muslim_owned' },
  { name: 'Seorae Korean BBQ', area: 'bugis', cuisine: ['korean'], price_range: 3, halal_status: 'muis_certified' },
  { name: 'Mariam's Kitchen', area: 'bedok', cuisine: ['malay', 'singaporean'], price_range: 1, halal_status: 'muslim_owned' },
  { name: 'Istanbul Turkish Kitchen', area: 'arab-street', cuisine: ['turkish'], price_range: 2, halal_status: 'muis_certified' },
  { name: 'Lagoon Seafood', area: 'pasir-ris', cuisine: ['seafood', 'malay'], price_range: 2, halal_status: 'muslim_owned' },
  { name: 'Four Seasons Noodle House', area: 'woodlands', cuisine: ['chinese'], price_range: 1, halal_status: 'muis_certified' },
  { name: 'Café de Paris (Halal)', area: 'city', cuisine: ['western', 'cafe'], price_range: 3, halal_status: 'muis_certified' },
  { name: 'Kafe Upin Ipin', area: 'jurong-east', cuisine: ['malay', 'mamak'], price_range: 1, halal_status: 'muslim_owned' },
  { name: 'Shiok Seafood', area: 'sengkang', cuisine: ['seafood'], price_range: 2, halal_status: 'muslim_owned' },
  { name: 'Putien (Halal branches)', area: 'tampines', cuisine: ['chinese', 'seafood'], price_range: 3, halal_status: 'muis_certified' },
  { name: 'Sakura Japanese Buffet', area: 'orchard', cuisine: ['japanese', 'buffet'], price_range: 3, halal_status: 'muis_certified' },
  { name: 'Naan Factory', area: 'hougang', cuisine: ['indian'], price_range: 2, halal_status: 'muslim_owned' },
  { name: 'The Mad Moose', area: 'ang-mo-kio', cuisine: ['western'], price_range: 2, halal_status: 'muis_certified' },
  { name: 'Al-Azhar Restaurant', area: 'bugis', cuisine: ['malay', 'singaporean'], price_range: 1, halal_status: 'muis_certified' },
  { name: 'Sate by the Bay', area: 'marina-bay', cuisine: ['malay', 'singaporean'], price_range: 2, halal_status: 'muslim_owned' },
  { name: 'Chir Chir Fusion Chicken Factory', area: 'city', cuisine: ['korean', 'western'], price_range: 2, halal_status: 'muis_certified' },
  { name: 'Makanplace', area: 'punggol', cuisine: ['malay', 'indian', 'chinese'], price_range: 1, halal_status: 'muis_certified' },
]

// ── Catering listings ─────────────────────────────────────────────────────────
const CATERING_LISTINGS = [
  { name: 'Royal Catering', area: 'tampines', service_types: ['wedding', 'buffet'], min_pax: 50, max_pax: 1000, halal_status: 'muis_certified' },
  { name: 'Bespoke Halal Events', area: 'city', service_types: ['corporate', 'buffet', 'bento'], min_pax: 20, max_pax: 500, halal_status: 'muis_certified' },
  { name: 'Aqiqah Specialist', area: 'woodlands', service_types: ['aqiqah', 'birthday'], min_pax: 10, max_pax: 200, halal_status: 'muslim_owned' },
  { name: 'Grand Feast Caterers', area: 'jurong-east', service_types: ['wedding', 'birthday', 'buffet'], min_pax: 30, max_pax: 800, halal_status: 'muis_certified' },
  { name: 'Office Box Meals SG', area: 'bugis', service_types: ['corporate', 'bento'], min_pax: 10, max_pax: 200, halal_status: 'muis_certified' },
]

// ── Service listings ──────────────────────────────────────────────────────────
const SERVICE_LISTINGS = [
  { name: 'Affin Islamic Finance', area: 'city', service_category: 'finance', pricing_model: 'quote', halal_status: 'not_applicable' },
  { name: 'Muslim Legal Aid SG', area: 'bugis', service_category: 'legal', pricing_model: 'hourly', halal_status: 'muslim_owned' },
  { name: 'Dr. Ahmad Family Clinic', area: 'tampines', service_category: 'healthcare', pricing_model: 'fixed', halal_status: 'muslim_owned' },
  { name: 'Bright Minds Islamic Tuition', area: 'woodlands', service_category: 'education', pricing_model: 'hourly', halal_status: 'muslim_owned' },
  { name: 'Nikah Bliss Wedding Planning', area: 'geylang-serangoon', service_category: 'wedding', pricing_model: 'fixed', halal_status: 'muslim_owned' },
  { name: 'Muslim Clicks Photography', area: 'bedok', service_category: 'photography', pricing_model: 'fixed', halal_status: 'muslim_owned' },
]

// ── Product listings ──────────────────────────────────────────────────────────
const PRODUCT_LISTINGS = [
  { name: 'HalalFresh Meat Delivery', area: 'tampines', categories: ['meat'], halal_status: 'muis_certified' },
  { name: 'SG Halal Grocery Box', area: 'jurong-east', categories: ['grocery'], halal_status: 'muis_certified' },
  { name: 'Wardah Halal Cosmetics SG', area: 'orchard', categories: ['cosmetics'], halal_status: 'muis_certified' },
  { name: 'Muslemaa Fashion', area: 'bugis', categories: ['fashion'], halal_status: 'muslim_owned' },
  { name: 'Herba Naturale Supplements', area: 'ang-mo-kio', categories: ['supplements'], halal_status: 'muis_certified' },
  { name: "Grandma's Kuih Shop", area: 'geylang-serangoon', categories: ['snacks'], halal_status: 'muslim_owned' },
]

// ── Sample reviews ────────────────────────────────────────────────────────────
const REVIEW_BODIES = [
  'Amazing food! The flavours are authentic and the service is great.',
  'Always my go-to spot. Consistently good quality.',
  'Friendly staff and generous portions. Highly recommended.',
  'Good value for money. The halal certification gives me peace of mind.',
  'Family-friendly atmosphere. Kids loved it too.',
  'Fresh ingredients and quick service. Will return.',
  'A hidden gem in the neighbourhood. Definitely worth a visit.',
]

async function main() {
  console.log('🌱 Seeding sample listings (all verticals)...')
  const supabase = getSupabase()

  const allListings = []
  const slugsSeen = new Set()

  // Helper to add unique slug
  function makeSlug(name, area) {
    let base = slugify(`${name}-${area}`)
    let slug = base
    let i = 1
    while (slugsSeen.has(slug)) slug = `${base}-${i++}`
    slugsSeen.add(slug)
    return slug
  }

  // ── Food ─────────────────────────────────────────────────────────────────────
  const foodInserts = FOOD_LISTINGS.map((f) => ({
    name: f.name,
    slug: makeSlug(f.name, f.area),
    vertical: 'food',
    area: f.area,
    address: `${randomInt(1, 999)} ${f.area.replace(/-/g, ' ')} Road, Singapore ${randomInt(100000, 799999)}`,
    halal_status: f.halal_status,
    status: 'active',
    featured: Math.random() < 0.15,
    avg_rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
    review_count: randomInt(5, 150),
    _cuisine: f.cuisine,
    _price_range: f.price_range,
  }))
  allListings.push(...foodInserts)

  // ── Catering ─────────────────────────────────────────────────────────────────
  const cateringInserts = CATERING_LISTINGS.map((c) => ({
    name: c.name,
    slug: makeSlug(c.name, c.area),
    vertical: 'catering',
    area: c.area,
    address: `${randomInt(1, 999)} ${c.area.replace(/-/g, ' ')} Avenue, Singapore ${randomInt(100000, 799999)}`,
    halal_status: c.halal_status,
    status: 'active',
    featured: Math.random() < 0.2,
    avg_rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
    review_count: randomInt(3, 60),
    _service_types: c.service_types,
    _min_pax: c.min_pax,
    _max_pax: c.max_pax,
  }))
  allListings.push(...cateringInserts)

  // ── Services ──────────────────────────────────────────────────────────────────
  const serviceInserts = SERVICE_LISTINGS.map((s) => ({
    name: s.name,
    slug: makeSlug(s.name, s.area),
    vertical: 'services',
    area: s.area,
    address: `${randomInt(1, 50)} ${s.area.replace(/-/g, ' ')} Street, Singapore ${randomInt(100000, 799999)}`,
    halal_status: s.halal_status,
    status: 'active',
    featured: Math.random() < 0.2,
    avg_rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
    review_count: randomInt(2, 40),
    _service_category: s.service_category,
    _pricing_model: s.pricing_model,
  }))
  allListings.push(...serviceInserts)

  // ── Products ──────────────────────────────────────────────────────────────────
  const productInserts = PRODUCT_LISTINGS.map((p) => ({
    name: p.name,
    slug: makeSlug(p.name, p.area),
    vertical: 'products',
    area: p.area,
    address: `${randomInt(1, 50)} ${p.area.replace(/-/g, ' ')} Drive, Singapore ${randomInt(100000, 799999)}`,
    halal_status: p.halal_status,
    status: 'active',
    featured: Math.random() < 0.2,
    avg_rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
    review_count: randomInt(1, 30),
    categories: p.categories,
  }))
  allListings.push(...productInserts)

  // Strip private fields before inserting into `listings`
  const listingRows = allListings.map(({ _cuisine, _price_range, _service_types, _min_pax, _max_pax, _service_category, _pricing_model, ...row }) => row)

  // Upsert listings
  for (const batch of chunk(listingRows, 20)) {
    const { error } = await supabase
      .from('listings')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false })
    if (error) console.error('Listings batch error:', error.message)
  }
  console.log(`  ✓ Upserted ${listingRows.length} base listings`)

  // Re-fetch to get IDs
  const { data: inserted } = await supabase
    .from('listings')
    .select('id, slug')
    .in('slug', listingRows.map((l) => l.slug))

  if (!inserted || inserted.length === 0) {
    console.log('  ⚠ Could not re-fetch inserted listings — skipping extension rows')
    return
  }

  const idBySlug = Object.fromEntries(inserted.map((l) => [l.slug, l.id]))

  // ── listings_food ─────────────────────────────────────────────────────────────
  const foodExtRows = foodInserts
    .map((f) => ({ listing_id: idBySlug[f.slug], cuisine_types: f._cuisine, price_range: f._price_range }))
    .filter((r) => r.listing_id)

  for (const batch of chunk(foodExtRows, 10)) {
    const { error } = await supabase.from('listings_food').upsert(batch, { onConflict: 'listing_id' })
    if (error) console.error('listings_food batch error:', error.message)
  }
  console.log(`  ✓ Upserted ${foodExtRows.length} food extension rows`)

  // ── listings_catering ─────────────────────────────────────────────────────────
  const cateringExtRows = cateringInserts
    .map((c) => ({
      listing_id: idBySlug[c.slug],
      service_types: c._service_types,
      min_pax: c._min_pax,
      max_pax: c._max_pax,
      cuisines: ['malay', 'singaporean'],
    }))
    .filter((r) => r.listing_id)

  for (const batch of chunk(cateringExtRows, 10)) {
    const { error } = await supabase.from('listings_catering').upsert(batch, { onConflict: 'listing_id' })
    if (error) console.error('listings_catering batch error:', error.message)
  }
  console.log(`  ✓ Upserted ${cateringExtRows.length} catering extension rows`)

  // ── listings_services ─────────────────────────────────────────────────────────
  const serviceExtRows = serviceInserts
    .map((s) => ({
      listing_id: idBySlug[s.slug],
      service_category: s._service_category,
      pricing_model: s._pricing_model,
      contact_methods: ['phone', 'email'],
    }))
    .filter((r) => r.listing_id)

  for (const batch of chunk(serviceExtRows, 10)) {
    const { error } = await supabase.from('listings_services').upsert(batch, { onConflict: 'listing_id' })
    if (error) console.error('listings_services batch error:', error.message)
  }
  console.log(`  ✓ Upserted ${serviceExtRows.length} service extension rows`)

  // ── Seed sample events ────────────────────────────────────────────────────────
  const EVENTS = [
    { title: 'Ramadan Night Market 2026', area: 'arab-street', type: 'community', capacity: 500, price: 0 },
    { title: 'Halal Business Networking Night', area: 'city', type: 'networking', capacity: 100, price: 25 },
    { title: 'Eid Family Celebration at the Bay', area: 'marina-bay', type: 'community', capacity: 2000, price: 0 },
    { title: 'Islamic Finance & Wealth Talk', area: 'orchard', type: 'talk', capacity: 80, price: 15 },
    { title: 'Halal Food Fair Singapore', area: 'tampines', type: 'fair', capacity: 3000, price: 0 },
  ]

  const eventRows = EVENTS.map((e, i) => {
    const startDate = new Date(Date.now() + (i + 1) * 14 * 86400 * 1000)
    const endDate = new Date(startDate.getTime() + 3 * 3600 * 1000)
    return {
      title: e.title,
      slug: slugify(e.title),
      description: `Join us for ${e.title}. Open to the Muslim community and all halal-conscious attendees.`,
      area: e.area,
      address: `Singapore`,
      event_type: e.type,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      capacity: e.capacity,
      tickets_sold: 0,
      ticket_price: e.price,
      is_free: e.price === 0,
      status: 'active',
    }
  })

  for (const batch of chunk(eventRows, 5)) {
    const { error } = await supabase.from('events').upsert(batch, { onConflict: 'slug', ignoreDuplicates: true })
    if (error) console.error('Events batch error:', error.message)
  }
  console.log(`  ✓ Upserted ${eventRows.length} sample events`)

  // ── Seed sample classifieds ───────────────────────────────────────────────────
  const CLASSIFIEDS = [
    { title: 'Brand new Sejadah prayer mat — never used', category: 'home', price: 25, condition: 'new' },
    { title: 'Secondhand Quran (hardcover, good condition)', category: 'books', price: 10, condition: 'used_good' },
    { title: 'Tudung collection — 10 pieces bundle', category: 'fashion', price: 50, condition: 'used_good' },
    { title: 'Halal catering equipment for sale', category: 'equipment', price: 800, condition: 'used_good' },
    { title: 'Islamic calligraphy wall art — framed', category: 'home', price: 60, condition: 'new' },
  ]

  const classifiedRows = CLASSIFIEDS.map((c) => ({
    title: c.title,
    slug: slugify(`${c.title}-sg`),
    description: `${c.title}. Halal-certified household/Muslim community item.`,
    category: c.category,
    price: c.price,
    condition: c.condition,
    area: randomElement(['tampines', 'woodlands', 'jurong-east', 'bedok', 'ang-mo-kio']),
    status: 'active',
  }))

  for (const batch of chunk(classifiedRows, 5)) {
    const { error } = await supabase.from('classifieds').upsert(batch, { onConflict: 'slug', ignoreDuplicates: true })
    if (error) console.error('Classifieds batch error:', error.message)
  }
  console.log(`  ✓ Upserted ${classifiedRows.length} sample classifieds`)

  console.log(`\n✅ Sample listings seed complete: ${listingRows.length} listings + events + classifieds`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
