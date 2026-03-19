/**
 * Seed: MUIS Halal Listings
 * Seeds halal-certified restaurants and food establishments across Singapore.
 * Uses realistic data modelled on MUIS-certified establishments.
 * Run: node supabase/seed/muis.js
 */
import { getClient, slugify, point, log, logErr } from './utils.js'

// Realistic Singapore halal restaurant data across all major areas
const RESTAURANTS = [
  // --- Kampong Glam / Beach Road ---
  {
    name: 'Warong Nasi Pariaman',
    area: 'Kampong Glam',
    address: '738B North Bridge Rd, Singapore 198706',
    lat: 1.3043, lng: 103.8575,
    halal_status: 'muis_certified',
    categories: ['nasi padang', 'malay'],
    cuisine_types: ['Malay', 'Indonesian'],
    food_type: 'restaurant',
    price_range: 1,
    description: 'Iconic Nasi Pariaman spot since 1948. Famous for their rendang and gulai dishes.',
  },
  {
    name: 'Zam Zam Restaurant',
    area: 'Kampong Glam',
    address: '697-699 North Bridge Rd, Singapore 198675',
    lat: 1.3039, lng: 103.8582,
    halal_status: 'muis_certified',
    categories: ['murtabak', 'indian muslim', 'biryani'],
    cuisine_types: ['Indian Muslim'],
    food_type: 'restaurant',
    price_range: 1,
    description: 'Legendary murtabak and biryani since 1908. A Kampong Glam institution.',
  },
  {
    name: 'Café De Habous',
    area: 'Kampong Glam',
    address: '47 Haji Lane, Singapore 189244',
    lat: 1.3025, lng: 103.8601,
    halal_status: 'muslim_owned',
    categories: ['cafe', 'moroccan', 'middle eastern'],
    cuisine_types: ['Moroccan', 'Middle Eastern'],
    food_type: 'cafe',
    price_range: 2,
    description: 'Moroccan-inspired café in the heart of Haji Lane serving mint tea and couscous.',
  },

  // --- Geylang ---
  {
    name: 'Ali Hassan Restaurant',
    area: 'Geylang',
    address: '32 Geylang Rd, Singapore 389222',
    lat: 1.3125, lng: 103.8719,
    halal_status: 'muis_certified',
    categories: ['indian muslim', 'fish head curry', 'briyani'],
    cuisine_types: ['Indian Muslim'],
    food_type: 'restaurant',
    price_range: 2,
    description: 'Famous for fish head curry and mutton briyani. Open till late.',
  },
  {
    name: 'Geylang Serai Market',
    area: 'Geylang',
    address: '1 Geylang Serai, Singapore 402001',
    lat: 1.3153, lng: 103.8974,
    halal_status: 'muis_certified',
    categories: ['hawker', 'malay', 'nasi lemak', 'satay'],
    cuisine_types: ['Malay', 'Indonesian'],
    food_type: 'hawker',
    price_range: 1,
    description: 'Iconic wet market and hawker centre with dozens of halal Malay food stalls.',
  },

  // --- Tampines ---
  {
    name: 'Tampines Round Market & Food Centre',
    area: 'Tampines',
    address: '137 Tampines St 11, Singapore 521137',
    lat: 1.3514, lng: 103.9437,
    halal_status: 'muis_certified',
    categories: ['hawker', 'malay', 'chinese muslim'],
    cuisine_types: ['Malay', 'Chinese Muslim'],
    food_type: 'hawker',
    price_range: 1,
    description: 'Popular hawker centre with multiple halal-certified stalls.',
  },
  {
    name: "Nasi Padang Putri Minang",
    area: 'Tampines',
    address: '201E Tampines St 23, #01-114, Singapore 527201',
    lat: 1.3497, lng: 103.9472,
    halal_status: 'muis_certified',
    categories: ['nasi padang', 'malay', 'indonesian'],
    cuisine_types: ['Malay', 'Indonesian'],
    food_type: 'restaurant',
    price_range: 1,
    description: 'Authentic Padang cuisine with over 20 dishes daily. Community favourite.',
  },

  // --- Jurong ---
  {
    name: 'Hjh Maimunah',
    area: 'Jurong East',
    address: '11 & 15 Jalan Pisang, Singapore 199078',
    lat: 1.3058, lng: 103.8540,
    halal_status: 'muis_certified',
    categories: ['nasi padang', 'malay'],
    cuisine_types: ['Malay'],
    food_type: 'restaurant',
    price_range: 1,
    description: 'Award-winning Malay restaurant famous for nasi ambeng and rendang.',
  },
  {
    name: 'The Halal Guys (JEM)',
    area: 'Jurong East',
    address: '50 Jurong Gateway Rd, #B1-08 JEM, Singapore 608549',
    lat: 1.3334, lng: 103.7430,
    halal_status: 'muis_certified',
    categories: ['american', 'mediterranean', 'fast food'],
    cuisine_types: ['American', 'Mediterranean'],
    food_type: 'restaurant',
    price_range: 2,
    description: 'NYC-famous halal food chain serving gyro platters and falafel.',
  },

  // --- Woodlands ---
  {
    name: 'Causeway Point Food Court',
    area: 'Woodlands',
    address: '1 Woodlands Square, Causeway Point B2, Singapore 738099',
    lat: 1.4366, lng: 103.7863,
    halal_status: 'muis_certified',
    categories: ['food court', 'malay', 'chinese muslim', 'indian'],
    cuisine_types: ['Malay', 'Indian'],
    food_type: 'hawker',
    price_range: 1,
    description: 'Large food court with dedicated halal sections across multiple cuisines.',
  },

  // --- Bedok ---
  {
    name: 'Bedok Interchange Hawker Centre',
    area: 'Bedok',
    address: '208 New Upper Changi Rd, Singapore 460208',
    lat: 1.3241, lng: 103.9302,
    halal_status: 'muis_certified',
    categories: ['hawker', 'malay', 'nasi lemak', 'mee rebus'],
    cuisine_types: ['Malay'],
    food_type: 'hawker',
    price_range: 1,
    description: 'Bustling hawker centre with legendary nasi lemak and mee rebus stalls.',
  },
  {
    name: 'Warung Sudi Mampir',
    area: 'Bedok',
    address: '58 Bedok Timah Rd, Singapore 467367',
    lat: 1.3285, lng: 103.9312,
    halal_status: 'muis_certified',
    categories: ['malay', 'seafood', 'grilled'],
    cuisine_types: ['Malay', 'Seafood'],
    food_type: 'restaurant',
    price_range: 2,
    description: 'Beloved family restaurant serving grilled seafood and Malay classics.',
  },

  // --- CBD / Raffles Place ---
  {
    name: 'Masjid Omar Kampong Melaka Canteen',
    area: 'CBD',
    address: '10 Kallang Rd, Singapore 208718',
    lat: 1.3059, lng: 103.8625,
    halal_status: 'muis_certified',
    categories: ['malay', 'hawker', 'economic rice'],
    cuisine_types: ['Malay'],
    food_type: 'hawker',
    price_range: 1,
    description: 'Affordable halal hawker food popular with CBD office workers.',
  },
  {
    name: 'Lau Pa Sat Halal Stalls',
    area: 'CBD',
    address: '18 Raffles Quay, Singapore 048582',
    lat: 1.2804, lng: 103.8498,
    halal_status: 'muis_certified',
    categories: ['hawker', 'satay', 'malay'],
    cuisine_types: ['Malay', 'Indian'],
    food_type: 'hawker',
    price_range: 2,
    description: 'Historic Victorian market with halal satay stalls that come alive at night.',
  },

  // --- Ang Mo Kio ---
  {
    name: 'Samy\'s Curry Restaurant',
    area: 'Ang Mo Kio',
    address: '25 AMK Industrial Park 2A, Singapore 567760',
    lat: 1.3698, lng: 103.8431,
    halal_status: 'muis_certified',
    categories: ['indian', 'curry', 'banana leaf'],
    cuisine_types: ['Indian'],
    food_type: 'restaurant',
    price_range: 2,
    description: 'Singapore\'s best banana leaf curry since 1963. Famous fish head curry.',
  },

  // --- Yishun ---
  {
    name: 'Chong Pang Nasi Lemak',
    area: 'Yishun',
    address: '105 Yishun Ring Rd, #01-188, Singapore 760105',
    lat: 1.4238, lng: 103.8351,
    halal_status: 'muis_certified',
    categories: ['nasi lemak', 'malay'],
    cuisine_types: ['Malay'],
    food_type: 'hawker',
    price_range: 1,
    description: 'Famous nasi lemak with a loyal following. Lines form before opening.',
  },

  // --- Pasir Ris ---
  {
    name: 'D\'Original Katong Laksa',
    area: 'Pasir Ris',
    address: '820 Tampines Ave 10, #B1-52, Singapore 521820',
    lat: 1.3691, lng: 103.9479,
    halal_status: 'muis_certified',
    categories: ['laksa', 'peranakan', 'noodles'],
    cuisine_types: ['Peranakan', 'Malay'],
    food_type: 'hawker',
    price_range: 1,
    description: 'Spicy and creamy Katong laksa with thick cockles. Singapore heritage dish.',
  },

  // --- Choa Chu Kang ---
  {
    name: 'Al-Ameen Eating House',
    area: 'Choa Chu Kang',
    address: '360 Choa Chu Kang Ave 3, #01-04, Singapore 680360',
    lat: 1.3862, lng: 103.7446,
    halal_status: 'muis_certified',
    categories: ['indian muslim', 'prata', 'briyani'],
    cuisine_types: ['Indian Muslim'],
    food_type: 'restaurant',
    price_range: 1,
    description: '24/7 Indian Muslim restaurant. Best murtabak and teh tarik in the west.',
  },

  // --- Serangoon ---
  {
    name: 'Bismillah Biryani',
    area: 'Serangoon',
    address: '14 Kandahar St, Singapore 198885',
    lat: 1.3032, lng: 103.8601,
    halal_status: 'muis_certified',
    categories: ['biryani', 'indian muslim'],
    cuisine_types: ['Indian Muslim'],
    food_type: 'restaurant',
    price_range: 1,
    description: 'Legendary biryani with fragrant basmati rice and tender mutton. Cash only.',
  },

  // --- Punggol ---
  {
    name: 'Punggol Settlement Food Village',
    area: 'Punggol',
    address: '830 Punggol Rd, Singapore 829787',
    lat: 1.3991, lng: 103.9076,
    halal_status: 'muis_certified',
    categories: ['seafood', 'malay', 'chinese muslim'],
    cuisine_types: ['Malay', 'Seafood'],
    food_type: 'restaurant',
    price_range: 2,
    description: 'Waterfront seafood village with halal-certified restaurants and satay.',
  },

  // --- Bukit Timah ---
  {
    name: 'Shish Mahal',
    area: 'Bukit Timah',
    address: '50 Craig Rd, Singapore 089686',
    lat: 1.3218, lng: 103.8123,
    halal_status: 'muis_certified',
    categories: ['north indian', 'mughlai', 'kebab'],
    cuisine_types: ['Indian'],
    food_type: 'fine_dining',
    price_range: 3,
    description: 'Upscale North Indian dining with a tandoor and extensive kebab selection.',
  },

  // --- Queenstown ---
  {
    name: 'Restoran Al-Ameen',
    area: 'Queenstown',
    address: '55 Dawson Rd, Singapore 141055',
    lat: 1.2993, lng: 103.7998,
    halal_status: 'muis_certified',
    categories: ['indian muslim', 'prata', 'economy rice'],
    cuisine_types: ['Indian Muslim', 'Malay'],
    food_type: 'restaurant',
    price_range: 1,
    description: 'No-frills kopitiam with fresh roti prata and nasi padang.',
  },
]

async function seed() {
  const supabase = getClient()
  log(`Seeding ${RESTAURANTS.length} restaurant listings...`)

  let inserted = 0
  let skipped = 0

  for (const r of RESTAURANTS) {
    const slug = slugify(r.name, r.area)

    // 1. Insert base listing
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .upsert(
        {
          vertical: 'food',
          name: r.name,
          slug,
          description: r.description ?? null,
          address: r.address,
          area: r.area,
          location: point(r.lng, r.lat),
          halal_status: r.halal_status,
          categories: r.categories ?? [],
          price_range: r.price_range ?? null,
          status: 'active',
          verified: r.halal_status === 'muis_certified',
        },
        { onConflict: 'vertical,slug', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (listingErr) {
      logErr(`listing "${r.name}"`, listingErr)
      skipped++
      continue
    }

    // 2. Insert food extension
    const { error: foodErr } = await supabase.from('listings_food').upsert(
      {
        listing_id: listing.id,
        cuisine_types: r.cuisine_types ?? [],
        food_type: r.food_type ?? 'restaurant',
      },
      { onConflict: 'listing_id', ignoreDuplicates: false }
    )

    if (foodErr) {
      logErr(`listings_food for "${r.name}"`, foodErr)
    }

    inserted++
  }

  log(`Done: ${inserted} upserted, ${skipped} errors`)
}

seed().catch((err) => {
  logErr('seed failed', err)
  process.exit(1)
})
