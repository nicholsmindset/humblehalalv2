#!/usr/bin/env node

/**
 * Master seed script — runs all seeding in correct order.
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed/index.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Sample data ─────────────────────────────────────────────────

const RESTAURANTS = [
  { name: 'Zamzam Restaurant', slug: 'zamzam-restaurant-arab-street', area: 'arab-street', address: '697-699 North Bridge Rd, Singapore 198675', halal_status: 'muis_certified', vertical: 'food', description: 'Legendary Indian-Muslim restaurant known for murtabak since 1908. A must-visit on Arab Street.', phone: '+65 6298 6320', cuisine_types: ['indian', 'malay'], price_range: 2 },
  { name: 'Hajah Maimunah', slug: 'hajah-maimunah-bugis', area: 'bugis', address: '11 Jalan Pisang, Singapore 199078', halal_status: 'muis_certified', vertical: 'food', description: 'Award-winning Malay restaurant with the best nasi padang in Singapore. Michelin Bib Gourmand.', phone: '+65 6297 4294', cuisine_types: ['malay', 'indonesian'], price_range: 2 },
  { name: 'The Malayan Council', slug: 'malayan-council-arab-street', area: 'arab-street', address: '46 Kandahar St, Singapore 198893', halal_status: 'muis_certified', vertical: 'food', description: 'Modern Malay restaurant serving fusion dishes in a stylish heritage shophouse setting.', phone: '+65 6292 1838', cuisine_types: ['malay', 'fusion'], price_range: 3 },
  { name: 'Bismillah Biryani', slug: 'bismillah-biryani-bugis', area: 'bugis', address: '50 Dunlop St, Singapore 209379', halal_status: 'muis_certified', vertical: 'food', description: 'Famous for dum biryani cooked over charcoal. Over 30 years of authentic South Indian flavours.', phone: '+65 6294 3545', cuisine_types: ['indian'], price_range: 2 },
  { name: 'Springleaf Prata Place', slug: 'springleaf-prata-tampines', area: 'tampines', address: '1 Tampines North Dr 1, Singapore 528559', halal_status: 'muis_certified', vertical: 'food', description: 'Creative prata specialist with unique flavours like Plaster Blaster and Murtabak.', phone: '+65 6257 8890', cuisine_types: ['indian', 'malay'], price_range: 2 },
  { name: 'Sari Ratu', slug: 'sari-ratu-tampines', area: 'tampines', address: '7 Tampines Central 1, Singapore 529540', halal_status: 'muis_certified', vertical: 'food', description: 'Popular Padang restaurant chain known for beef rendang and fried chicken.', phone: '+65 6785 6333', cuisine_types: ['indonesian', 'malay'], price_range: 2 },
  { name: 'Gokul Vegetarian', slug: 'gokul-vegetarian-bugis', area: 'bugis', address: '19 Upper Dickson Rd, Singapore 207478', halal_status: 'self_declared', vertical: 'food', description: 'Indian vegetarian restaurant with all-you-can-eat thali and extensive menu.', cuisine_types: ['indian'], price_range: 1 },
  { name: 'Seoul Garden', slug: 'seoul-garden-jurong-east', area: 'jurong-east', address: '2 Jurong East Central 1, Singapore 609731', halal_status: 'muis_certified', vertical: 'food', description: 'Popular MUIS-certified Korean BBQ buffet. Great for groups and family outings.', phone: '+65 6665 0610', cuisine_types: ['korean'], price_range: 3 },
]

const CATERERS = [
  { name: 'Purple Sage Catering', slug: 'purple-sage-catering', area: 'tampines', halal_status: 'muis_certified', vertical: 'catering', description: 'Premium halal catering for weddings, corporate events, and private gatherings. Known for elegant presentations.' },
  { name: 'FoodLine Catering', slug: 'foodline-catering', area: 'jurong-east', halal_status: 'muis_certified', vertical: 'catering', description: 'Affordable halal buffet and bento catering for corporate and birthday events across Singapore.' },
]

const SERVICES = [
  { name: 'Iman Photography', slug: 'iman-photography-woodlands', area: 'woodlands', halal_status: 'muslim_owned', vertical: 'services', description: 'Muslim-friendly photography for weddings, events, and portraits. Female photographer available.' },
  { name: 'Al-Ameen Legal Consultancy', slug: 'al-ameen-legal-bugis', area: 'bugis', halal_status: 'muslim_owned', vertical: 'services', description: 'Islamic law and general legal services. Specialising in estate planning, wills, and MUIS matters.' },
]

const MOSQUES = [
  { name: 'Sultan Mosque', slug: 'sultan-mosque-arab-street', area: 'arab-street', address: '3 Muscat St, Singapore 198833', description: 'Singapore\'s most iconic mosque. A national monument with stunning Saracenic architecture.', phone: '+65 6293 4405' },
  { name: 'Al-Ansar Mosque', slug: 'al-ansar-mosque-bedok', area: 'bedok', address: '50 Bedok North Rd, Singapore 469724', description: 'Community mosque in Bedok serving the eastern Singapore Muslim community.' },
  { name: 'Masjid An-Nahdhah', slug: 'masjid-an-nahdhah-tampines', area: 'tampines', address: '9 Tampines St 92, Singapore 528879', description: 'Modern mosque in Tampines with multipurpose halls and community facilities.' },
  { name: 'Masjid Yusof Ishak', slug: 'masjid-yusof-ishak-woodlands', area: 'woodlands', address: '10 Woodlands Dr 17, Singapore 737726', description: 'One of Singapore\'s newest mosques with rooftop garden and green architecture.' },
]

const EVENTS = [
  { title: 'Hari Raya Bazaar Geylang Serai', slug: 'hari-raya-bazaar-2026', description: 'Singapore\'s biggest annual Ramadan bazaar with street food, fashion, and festive items.', area: 'geylang-serangoon', event_type: 'community', start_datetime: '2026-03-15T17:00:00+08:00', end_datetime: '2026-04-10T01:00:00+08:00', venue_name: 'Geylang Serai Market' },
  { title: 'Muslim Professionals Networking Night', slug: 'muslim-professionals-networking-2026', description: 'Connect with Muslim professionals across industries in Singapore. Halal food provided.', area: 'city', event_type: 'professional', start_datetime: '2026-04-05T19:00:00+08:00', end_datetime: '2026-04-05T22:00:00+08:00', venue_name: 'Marina Bay Sands Convention Centre' },
]

async function seed() {
  console.log('Seeding HumbleHalal database...\n')

  // ── Listings (Restaurants) ────────────────────────────────────
  console.log('Seeding restaurants...')
  for (const r of RESTAURANTS) {
    const { cuisine_types, price_range, ...listingData } = r
    const { data: listing, error } = await db
      .from('listings')
      .upsert({ ...listingData, status: 'active' }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`  ✗ ${r.name}:`, error.message)
      continue
    }

    // Insert food extension
    await db.from('listings_food').upsert(
      { listing_id: listing.id, cuisine_types, price_range },
      { onConflict: 'listing_id' }
    )
    console.log(`  ✓ ${r.name}`)
  }

  // ── Caterers ──────────────────────────────────────────────────
  console.log('\nSeeding caterers...')
  for (const c of CATERERS) {
    const { error } = await db
      .from('listings')
      .upsert({ ...c, status: 'active' }, { onConflict: 'slug' })
    if (error) console.error(`  ✗ ${c.name}:`, error.message)
    else console.log(`  ✓ ${c.name}`)
  }

  // ── Services ──────────────────────────────────────────────────
  console.log('\nSeeding services...')
  for (const s of SERVICES) {
    const { error } = await db
      .from('listings')
      .upsert({ ...s, status: 'active' }, { onConflict: 'slug' })
    if (error) console.error(`  ✗ ${s.name}:`, error.message)
    else console.log(`  ✓ ${s.name}`)
  }

  // ── Mosques ───────────────────────────────────────────────────
  console.log('\nSeeding mosques...')
  for (const m of MOSQUES) {
    const { error } = await db
      .from('mosques')
      .upsert(m, { onConflict: 'slug' })
    if (error) console.error(`  ✗ ${m.name}:`, error.message)
    else console.log(`  ✓ ${m.name}`)
  }

  // ── Events ────────────────────────────────────────────────────
  console.log('\nSeeding events...')
  for (const e of EVENTS) {
    const { error } = await db
      .from('events')
      .upsert({ ...e, status: 'active' }, { onConflict: 'slug' })
    if (error) console.error(`  ✗ ${e.title}:`, error.message)
    else console.log(`  ✓ ${e.title}`)
  }

  // ── AI Prompts ────────────────────────────────────────────────
  console.log('\nSeeding AI prompts...')
  const prompts = [
    { name: 'moderation', content_type: 'moderation', prompt_template: 'Review the submitted content and classify as approve/reject/flag...', version: 1, is_active: true },
    { name: 'seo-meta', content_type: 'seo', prompt_template: 'Generate SEO meta title (max 60 chars) and description (max 155 chars)...', version: 1, is_active: true },
    { name: 'listing-enrichment', content_type: 'enrichment', prompt_template: 'Given listing data, generate enriched description, highlights, and tags...', version: 1, is_active: true },
    { name: 'blog-post', content_type: 'blog', prompt_template: 'Write a 800-1500 word blog post for Singapore Muslim community...', version: 1, is_active: true },
    { name: 'newsletter', content_type: 'newsletter', prompt_template: 'Generate weekly newsletter with featured items, subject line, and CTAs...', version: 1, is_active: true },
    { name: 'travel-guide', content_type: 'travel', prompt_template: 'Write comprehensive halal travel guide for Muslim travellers...', version: 1, is_active: true },
  ]
  for (const p of prompts) {
    const { error } = await db.from('ai_prompts').upsert(p, { onConflict: 'name' })
    if (error) console.error(`  ✗ ${p.name}:`, error.message)
    else console.log(`  ✓ ${p.name}`)
  }

  console.log('\n✅ Seeding complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
