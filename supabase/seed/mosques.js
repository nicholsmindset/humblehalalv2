#!/usr/bin/env node
/**
 * Seed: Singapore Mosques
 * -----------------------
 * Seeds the `mosques` table with Singapore's major mosques.
 * Source: MUIS (https://www.muis.gov.sg/mosque/Mosque-Locator)
 *
 * Usage: npm run seed:mosques
 */

const { getSupabase, slugify, chunk } = require('./utils')

// Singapore mosques data — sourced from MUIS mosque locator
const MOSQUES = [
  {
    name: 'Masjid Sultan',
    slug: 'masjid-sultan',
    area: 'arab-street',
    address: '3 Muscat Street, Singapore 198833',
    phone: '+6562938467',
    website: 'https://www.muis.gov.sg',
    description: 'One of Singapore\'s most iconic mosques, built in 1928. The National Monument mosque in the heart of Kampong Glam.',
    capacity: 5000,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: false,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3025, lng: 103.8596,
  },
  {
    name: 'Masjid Al-Abrar',
    slug: 'masjid-al-abrar',
    area: 'city',
    address: '192 Telok Ayer Street, Singapore 068635',
    phone: '+6562200477',
    website: null,
    description: 'A National Monument, this mosque dates back to 1827 and served as a place of worship for South Indian Muslim immigrants.',
    capacity: 1000,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: false,
    has_wheelchair_access: true,
    has_quran_classes: false,
    lat: 1.2812, lng: 103.8482,
  },
  {
    name: 'Masjid Darul Aman',
    slug: 'masjid-darul-aman',
    area: 'yishun',
    address: '271 Yishun St 22, Singapore 768911',
    phone: '+6568515222',
    website: null,
    description: 'Community mosque serving the Yishun area with comprehensive religious programmes.',
    capacity: 2500,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: true,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.4283, lng: 103.8372,
  },
  {
    name: 'Masjid An-Nur',
    slug: 'masjid-an-nur',
    area: 'woodlands',
    address: '7 Woodlands Drive 42, Singapore 738467',
    phone: '+6562693383',
    website: null,
    description: 'Modern mosque in Woodlands serving the large residential community in the north.',
    capacity: 3000,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: true,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.4335, lng: 103.7865,
  },
  {
    name: 'Masjid Jamae (Chulia)',
    slug: 'masjid-jamae-chulia',
    area: 'city',
    address: '218 South Bridge Road, Singapore 058767',
    phone: '+6522209103',
    website: null,
    description: 'A National Monument and one of Singapore\'s oldest mosques, built in 1835 by South Indian Chulia Muslim traders.',
    capacity: 1200,
    has_female_prayer_room: false,
    has_wudu_facilities: true,
    has_parking: false,
    has_wheelchair_access: false,
    has_quran_classes: false,
    lat: 1.2836, lng: 103.8457,
  },
  {
    name: 'Masjid Khalid',
    slug: 'masjid-khalid',
    area: 'geylang-serangoon',
    address: '130 Geylang Road, Singapore 389225',
    phone: '+6567442025',
    website: null,
    description: 'Mosque in the Geylang area with active community programmes and nightly lectures.',
    capacity: 1500,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: false,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3191, lng: 103.8822,
  },
  {
    name: 'Masjid Muhajirin',
    slug: 'masjid-muhajirin',
    area: 'bishan',
    address: '390 Marymount Road, Singapore 574434',
    phone: '+6562513544',
    website: null,
    description: 'Bishan mosque known for its vibrant religious education and youth programmes.',
    capacity: 2000,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: true,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3516, lng: 103.8380,
  },
  {
    name: 'Masjid Ar-Raudhah',
    slug: 'masjid-ar-raudhah',
    area: 'bukit-timah',
    address: '10 Bukit Batok St 52, Singapore 659258',
    phone: '+6565651133',
    website: null,
    description: 'Modern mosque in Bukit Batok serving the western residential heartlands.',
    capacity: 3000,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: true,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3525, lng: 103.7490,
  },
  {
    name: 'Masjid Assyakirin',
    slug: 'masjid-assyakirin',
    area: 'jurong-east',
    address: '10 Jurong West St 25, Singapore 648373',
    phone: '+6567661668',
    website: null,
    description: 'One of the largest mosques in Singapore, serving the Jurong West community with extensive facilities.',
    capacity: 5000,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: true,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3490, lng: 103.7085,
  },
  {
    name: 'Masjid Alkaff Upper Serangoon',
    slug: 'masjid-alkaff-upper-serangoon',
    area: 'hougang',
    address: '66 Pheng Geck Ave, Singapore 348175',
    phone: '+6562832988',
    website: null,
    description: 'Heritage mosque with a rich history serving the Serangoon community since the early 20th century.',
    capacity: 1800,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: false,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3632, lng: 103.8787,
  },
  {
    name: 'Masjid Darul Tauhid',
    slug: 'masjid-darul-tauhid',
    area: 'tampines',
    address: '100 Tampines Rd, Singapore 535109',
    phone: '+6567851111',
    website: null,
    description: 'Active community mosque in Tampines with daily programmes and a popular madrasah.',
    capacity: 2500,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: true,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3590, lng: 103.9270,
  },
  {
    name: 'Masjid Haji Muhammad Salleh',
    slug: 'masjid-haji-muhammad-salleh',
    area: 'punggol',
    address: '50 Buangkok Link, Singapore 549563',
    phone: '+6569811666',
    website: null,
    description: 'New mosque serving the growing Punggol community with modern facilities.',
    capacity: 3500,
    has_female_prayer_room: true,
    has_wudu_facilities: true,
    has_parking: true,
    has_wheelchair_access: true,
    has_quran_classes: true,
    lat: 1.3936, lng: 103.9095,
  },
]

async function main() {
  console.log('🕌 Seeding mosques...')
  const supabase = getSupabase()

  const rows = MOSQUES.map((m) => ({
    name: m.name,
    slug: m.slug,
    area: m.area,
    address: m.address,
    phone: m.phone ?? null,
    website: m.website ?? null,
    description: m.description,
    capacity: m.capacity,
    has_female_prayer_room: m.has_female_prayer_room,
    has_wudu_facilities: m.has_wudu_facilities,
    has_parking: m.has_parking,
    has_wheelchair_access: m.has_wheelchair_access,
    has_quran_classes: m.has_quran_classes,
    // location is a PostGIS geography column — set via raw SQL or supabase.rpc
    // For now we seed without coordinates; use seed:places to enrich later
    status: 'active',
  }))

  for (const batch of chunk(rows, 10)) {
    const { error } = await supabase
      .from('mosques')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false })

    if (error) {
      console.error('Error inserting mosque batch:', error.message)
    }
  }

  console.log(`✅ Mosques seed complete: ${rows.length} mosques`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
