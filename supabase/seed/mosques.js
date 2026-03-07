#!/usr/bin/env node

/**
 * Mosque seeding script — imports Singapore mosque data.
 * Source: MUIS mosque directory
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed/mosques.js
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

// Comprehensive list of Singapore mosques
const MOSQUES = [
  { name: 'Sultan Mosque', slug: 'sultan-mosque', area: 'arab-street', address: '3 Muscat St, Singapore 198833', phone: '+65 6293 4405', description: 'National monument and Singapore\'s most prominent mosque. Built in 1824.' },
  { name: 'Masjid Jamae (Chulia)', slug: 'masjid-jamae', area: 'city', address: '218 South Bridge Rd, Singapore 058767', phone: '+65 6221 4165', description: 'One of the oldest mosques in Singapore, built by the Chulia Muslim community in 1826.' },
  { name: 'Masjid Al-Abrar', slug: 'masjid-al-abrar', area: 'city', address: '192 Telok Ayer St, Singapore 068635', description: 'Historic mosque on Telok Ayer Street. National monument built in 1827.' },
  { name: 'Masjid Hajjah Fatimah', slug: 'masjid-hajjah-fatimah', area: 'bugis', address: '4001 Beach Rd, Singapore 199584', description: 'Named after a prominent Malay businesswoman. Known for its leaning minaret.' },
  { name: 'Al-Ansar Mosque', slug: 'al-ansar-mosque', area: 'bedok', address: '50 Bedok North Rd, Singapore 469724', description: 'Community mosque serving Bedok and East Singapore.' },
  { name: 'Masjid An-Nahdhah', slug: 'masjid-an-nahdhah', area: 'tampines', address: '9 Tampines St 92, Singapore 528879', description: 'Modern mosque with multipurpose halls and community facilities.' },
  { name: 'Masjid Yusof Ishak', slug: 'masjid-yusof-ishak', area: 'woodlands', address: '10 Woodlands Dr 17, Singapore 737726', description: 'Green mosque named after Singapore\'s first president. Award-winning architecture.' },
  { name: 'Masjid Al-Istiqamah', slug: 'masjid-al-istiqamah', area: 'sengkang', address: '2 Sengkang West Way, Singapore 797631', description: 'Community mosque in Sengkang new town.' },
  { name: 'Masjid At-Taqwa', slug: 'masjid-at-taqwa', area: 'bedok', address: '25 Bedok Reservoir Rd, Singapore 479233', description: 'Active community mosque with religious classes and youth programmes.' },
  { name: 'Masjid Al-Mukminin', slug: 'masjid-al-mukminin', area: 'jurong-east', address: '271 Jurong East St 21, Singapore 609602', description: 'Mosque serving the Jurong East Muslim community.' },
  { name: 'Masjid Kassim', slug: 'masjid-kassim', area: 'geylang-serangoon', address: '350 Changi Rd, Singapore 419829', description: 'Historic mosque in the Geylang Serai area.' },
  { name: 'Masjid Al-Amin', slug: 'masjid-al-amin', area: 'queenstown', address: '88 Jln Bt Merah, Singapore 150088', description: 'One of the oldest mosques in the Queenstown area.' },
  { name: 'Masjid Darul Aman', slug: 'masjid-darul-aman', area: 'yishun', address: '4 Yishun Ring Rd, Singapore 768677', description: 'Modern mosque in Yishun serving the North Singapore community.' },
  { name: 'Masjid Al-Mawaddah', slug: 'masjid-al-mawaddah', area: 'sengkang', address: '151 Compassvale Bow, Singapore 544811', description: 'Mosque in Sengkang with a multipurpose hall and community garden.' },
  { name: 'Masjid Ar-Raudhah', slug: 'masjid-ar-raudhah', area: 'bukit-timah', address: '30 Bukit Batok East Ave 2, Singapore 659917', description: 'Community mosque in Bukit Batok.' },
  { name: 'Masjid Al-Falah', slug: 'masjid-al-falah', area: 'pasir-ris', address: '175 Bideford Park, Singapore 519930', description: 'Mosque serving the Bidadari and Toa Payoh area.' },
  { name: 'Masjid Khalid', slug: 'masjid-khalid', area: 'geylang-serangoon', address: '130 Joo Chiat Rd, Singapore 427494', description: 'Historic mosque in the Joo Chiat / Geylang area.' },
]

async function seedMosques() {
  console.log('Seeding Singapore mosques...\n')

  let success = 0
  let failed = 0

  for (const mosque of MOSQUES) {
    const { error } = await db
      .from('mosques')
      .upsert(mosque, { onConflict: 'slug' })

    if (error) {
      console.error(`  ✗ ${mosque.name}:`, error.message)
      failed++
    } else {
      console.log(`  ✓ ${mosque.name}`)
      success++
    }
  }

  console.log(`\n✅ Mosques seeded: ${success} success, ${failed} failed`)
}

seedMosques().catch((err) => {
  console.error('Mosque seed failed:', err)
  process.exit(1)
})
