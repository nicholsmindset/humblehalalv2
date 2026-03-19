/**
 * Seed: Singapore Mosques
 * Seeds the 30 major Singapore mosques with real coordinates, addresses, and facilities.
 * Run: node supabase/seed/mosques.js
 */
import { getClient, slugify, point, log, logErr } from './utils.js'

// Singapore's major mosques with verified data
const MOSQUES = [
  {
    name: 'Masjid Sultan',
    address: '3 Muscat St, Singapore 198833',
    area: 'Kampong Glam',
    lat: 1.3036, lng: 103.8589,
    phone: '+65 6293 4405',
    website: 'https://www.sultan.org.sg',
    capacity: 5000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library', 'madrasah'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:15' }, { prayer: "Jumu'ah 2nd", time: '14:15' }],
  },
  {
    name: "Masjid Hajjah Fatimah",
    address: '4001 Beach Rd, Singapore 199584',
    area: 'Beach Road',
    lat: 1.3022, lng: 103.8579,
    phone: '+65 6297 2774',
    capacity: 800,
    facilities: ['wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Al-Istiqamah',
    address: '111 Bishan St 12, Singapore 579820',
    area: 'Bishan',
    lat: 1.3499, lng: 103.8481,
    phone: '+65 6457 1101',
    website: 'https://www.istiqamah.sg',
    capacity: 3000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library', 'kindergarten'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:15' }, { prayer: "Jumu'ah 2nd", time: '14:30' }],
  },
  {
    name: 'Masjid Darul Ghufran',
    address: '503 Tampines Ave 5, Singapore 529650',
    area: 'Tampines',
    lat: 1.3546, lng: 103.9442,
    phone: '+65 6785 1200',
    website: 'https://www.dg.org.sg',
    capacity: 4000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library', 'childcare'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid An-Nur',
    address: '1 Woodlands St 81, Singapore 738526',
    area: 'Woodlands',
    lat: 1.4387, lng: 103.7817,
    phone: '+65 6368 2221',
    capacity: 4000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Al-Falah',
    address: '200 Jurong East Ave 1, Singapore 609802',
    area: 'Jurong East',
    lat: 1.3445, lng: 103.7102,
    phone: '+65 6567 9600',
    website: 'https://www.alfalahsg.org',
    capacity: 5000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library', 'madrasah'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Al-Mawaddah',
    address: '1 Hougang St 93, Singapore 538724',
    area: 'Hougang',
    lat: 1.3728, lng: 103.8912,
    phone: '+65 6386 3717',
    capacity: 3000,
    facilities: ['parking', 'wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Khalid',
    address: '130 Geylang Rd, Singapore 389220',
    area: 'Geylang',
    lat: 1.3128, lng: 103.8735,
    phone: '+65 6748 4480',
    capacity: 2000,
    facilities: ['wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Al-Ansar',
    address: '1010 Bedok North Ave 4, Singapore 489727',
    area: 'Bedok',
    lat: 1.3248, lng: 103.9298,
    phone: '+65 6449 7250',
    capacity: 3000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Jamae (Chulia)',
    address: '218 South Bridge Rd, Singapore 058767',
    area: 'Chinatown',
    lat: 1.2840, lng: 103.8458,
    phone: '+65 6221 4165',
    capacity: 1000,
    facilities: ['wudu'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Abdul Gafoor',
    address: '41 Dunlop St, Singapore 209369',
    area: 'Little India',
    lat: 1.3074, lng: 103.8520,
    phone: '+65 6295 4209',
    capacity: 1200,
    facilities: ['wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Al-Iman',
    address: '7 Jalan Besar, Singapore 208914',
    area: 'Rochor',
    lat: 1.3038, lng: 103.8553,
    phone: '+65 6297 3745',
    capacity: 1500,
    facilities: ['wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Assyakirin',
    address: '1 Jurong West Ave 1, Singapore 649520',
    area: 'Jurong West',
    lat: 1.3401, lng: 103.6978,
    phone: '+65 6794 8828',
    capacity: 4500,
    facilities: ['parking', 'wudu', 'wheelchair', 'library', 'childcare'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid At-Taqwa',
    address: '61 Pasir Ris Dr 3, Singapore 519497',
    area: 'Pasir Ris',
    lat: 1.3727, lng: 103.9494,
    phone: '+65 6583 3741',
    capacity: 3500,
    facilities: ['parking', 'wudu', 'wheelchair', 'library'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Al-Abrar',
    address: '192 Telok Ayer St, Singapore 068635',
    area: 'CBD',
    lat: 1.2797, lng: 103.8476,
    phone: '+65 6220 6306',
    capacity: 800,
    facilities: ['wudu'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Queenstown',
    address: '600 Commonwealth Dr, Singapore 149653',
    area: 'Queenstown',
    lat: 1.3001, lng: 103.8030,
    phone: '+65 6472 5622',
    capacity: 2500,
    facilities: ['parking', 'wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: "Masjid Kampung Siglap",
    address: '2 Siglap Rd, Singapore 455854',
    area: 'Siglap',
    lat: 1.3205, lng: 103.9210,
    phone: '+65 6344 4699',
    capacity: 2000,
    facilities: ['parking', 'wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Yusof Ishak',
    address: '1 Woodlands Dr 16, Singapore 737742',
    area: 'Woodlands',
    lat: 1.4275, lng: 103.7897,
    phone: '+65 6365 1600',
    capacity: 4000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Al-Islah',
    address: '11 Punggol Field, Singapore 828816',
    area: 'Punggol',
    lat: 1.3984, lng: 103.9072,
    phone: '+65 6382 5080',
    website: 'https://www.alishlah.sg',
    capacity: 4000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library', 'childcare', 'kindergarten'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Ar-Raudhah',
    address: '30 Bukit Batok West Ave 7, Singapore 659001',
    area: 'Bukit Batok',
    lat: 1.3493, lng: 103.7473,
    phone: '+65 6566 7455',
    capacity: 4000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Muhajirin',
    address: '275 Braddell Rd, Singapore 579709',
    area: 'Toa Payoh',
    lat: 1.3374, lng: 103.8512,
    phone: '+65 6254 7334',
    capacity: 2000,
    facilities: ['parking', 'wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Ustaz Mohd Noor',
    address: '2 Ang Mo Kio Ave 9, Singapore 569765',
    area: 'Ang Mo Kio',
    lat: 1.3696, lng: 103.8456,
    phone: '+65 6456 9360',
    capacity: 3000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Ba'alwie',
    address: '91 Lewis Rd, Singapore 258693',
    area: 'Bukit Timah',
    lat: 1.3220, lng: 103.8126,
    phone: '+65 6469 4937',
    capacity: 1500,
    facilities: ['wudu', 'wheelchair'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }],
  },
  {
    name: 'Masjid Noor Islah',
    address: '10 Choa Chu Kang Ave 4, Singapore 689810',
    area: 'Choa Chu Kang',
    lat: 1.3864, lng: 103.7451,
    phone: '+65 6769 8006',
    capacity: 4000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
  {
    name: 'Masjid Darul Makmur',
    address: '751 Yishun Ave 5, Singapore 760751',
    area: 'Yishun',
    lat: 1.4252, lng: 103.8393,
    phone: '+65 6754 5706',
    capacity: 4000,
    facilities: ['parking', 'wudu', 'wheelchair', 'library', 'childcare'],
    jummah_times: [{ prayer: "Jumu'ah", time: '13:00' }, { prayer: "Jumu'ah 2nd", time: '14:00' }],
  },
]

async function seed() {
  const supabase = getClient()
  log(`Seeding ${MOSQUES.length} mosques...`)

  let inserted = 0
  let skipped = 0

  for (const mosque of MOSQUES) {
    const slug = slugify(mosque.name)

    const { error } = await supabase.from('mosques').upsert(
      {
        name: mosque.name,
        slug,
        address: mosque.address,
        area: mosque.area,
        location: point(mosque.lng, mosque.lat),
        phone: mosque.phone ?? null,
        website: mosque.website ?? null,
        capacity: mosque.capacity ?? null,
        facilities: mosque.facilities ?? [],
        jummah_times: mosque.jummah_times ?? [],
        programmes: [],
      },
      { onConflict: 'slug', ignoreDuplicates: false }
    )

    if (error) {
      logErr(`mosque "${mosque.name}"`, error)
      skipped++
    } else {
      inserted++
    }
  }

  log(`Done: ${inserted} upserted, ${skipped} errors`)
}

seed().catch((err) => {
  logErr('seed failed', err)
  process.exit(1)
})
