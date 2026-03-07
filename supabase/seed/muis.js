#!/usr/bin/env node

/**
 * MUIS halal certification seed script.
 * Marks known MUIS-certified restaurants and their cert details.
 * In production, this would scrape/API-call the actual MUIS halal directory.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed/muis.js
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

// Known MUIS certifications (sample data — production would sync from MUIS API)
const MUIS_CERTS = [
  { slug: 'zamzam-restaurant-arab-street', muis_cert_no: 'MUIS-HC-2024-1234', muis_expiry: '2027-06-30' },
  { slug: 'hajah-maimunah-bugis', muis_cert_no: 'MUIS-HC-2024-2345', muis_expiry: '2027-08-15' },
  { slug: 'malayan-council-arab-street', muis_cert_no: 'MUIS-HC-2024-3456', muis_expiry: '2027-03-20' },
  { slug: 'bismillah-biryani-bugis', muis_cert_no: 'MUIS-HC-2024-4567', muis_expiry: '2027-09-10' },
  { slug: 'springleaf-prata-tampines', muis_cert_no: 'MUIS-HC-2024-5678', muis_expiry: '2027-12-01' },
  { slug: 'sari-ratu-tampines', muis_cert_no: 'MUIS-HC-2024-6789', muis_expiry: '2027-04-25' },
  { slug: 'seoul-garden-jurong-east', muis_cert_no: 'MUIS-HC-2024-7890', muis_expiry: '2027-11-15' },
]

async function seedMuisCerts() {
  console.log('Seeding MUIS certification data...\n')

  let success = 0
  let failed = 0
  let notFound = 0

  for (const cert of MUIS_CERTS) {
    // Find listing by slug
    const { data: listing } = await db
      .from('listings')
      .select('id, name')
      .eq('slug', cert.slug)
      .single()

    if (!listing) {
      console.log(`  ⚠ ${cert.slug}: listing not found (run seed first)`)
      notFound++
      continue
    }

    const { error } = await db
      .from('listings')
      .update({
        halal_status: 'muis_certified',
        muis_cert_no: cert.muis_cert_no,
        muis_expiry: cert.muis_expiry,
      })
      .eq('id', listing.id)

    if (error) {
      console.error(`  ✗ ${listing.name}:`, error.message)
      failed++
    } else {
      console.log(`  ✓ ${listing.name} → ${cert.muis_cert_no} (expires ${cert.muis_expiry})`)
      success++
    }
  }

  console.log(`\n✅ MUIS certs seeded: ${success} success, ${failed} failed, ${notFound} not found`)
}

seedMuisCerts().catch((err) => {
  console.error('MUIS seed failed:', err)
  process.exit(1)
})
