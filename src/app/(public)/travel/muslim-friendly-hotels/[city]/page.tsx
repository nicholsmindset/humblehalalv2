import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HotelSearchBar } from '@/components/travel/HotelSearchBar'
import { SITE_URL } from '@/config'

export const revalidate = 3600 // ISR — revalidate hourly

// ─── City data ────────────────────────────────────────────────────────────────

interface CityData {
  name: string
  country: string
  countryCode: string
  iataCode: string   // For flight affiliate
  muslimTips: string
  halalHighlights: string[]
  metaDescription: string
}

const CITIES: Record<string, CityData> = {
  dubai: {
    name: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    iataCode: 'DXB',
    metaDescription: 'Find and book Muslim-friendly hotels in Dubai, UAE. Mosque proximity scores, halal restaurant counts and prayer room filters on every listing.',
    muslimTips: 'Dubai is one of the world\'s most Muslim-friendly destinations. The city is home to hundreds of mosques, a thriving halal food scene, and hotels that cater specifically to Muslim travellers. Alcohol-free hotels are available throughout the city, and most 5-star properties offer halal breakfast options.',
    halalHighlights: ['Al Fahidi Historic District mosques', '300+ halal restaurants in Deira', 'Prayer rooms in all major malls', 'Non-alcoholic luxury hotels available', 'Halal breakfast at most 5-star hotels'],
  },
  istanbul: {
    name: 'Istanbul',
    country: 'Turkey',
    countryCode: 'TR',
    iataCode: 'IST',
    metaDescription: 'Muslim-friendly hotels in Istanbul, Turkey. Book near the Grand Bazaar, Blue Mosque and Hagia Sophia with halal ratings and mosque proximity.',
    muslimTips: 'Istanbul is naturally one of the most Muslim-friendly cities in the world. The call to prayer echoes across the city five times a day, mosques are on every street corner, and almost all food is halal by default. The city bridges Europe and Asia, making it a unique hub for Muslim travellers.',
    halalHighlights: ['Blue Mosque and Hagia Sophia Mosque', 'Virtually all restaurants are halal', 'Friday prayers at Süleymaniye Mosque', 'Ramadan iftar traditions', 'Halal food in the Grand Bazaar'],
  },
  'kuala-lumpur': {
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    countryCode: 'MY',
    iataCode: 'KUL',
    metaDescription: 'Muslim-friendly hotels in Kuala Lumpur, Malaysia. JAKIM-certified halal food, mosque proximity and prayer room ratings for every hotel.',
    muslimTips: 'Kuala Lumpur is arguably the most Muslim-friendly major city outside the Middle East. Malaysia\'s official religion is Islam, JAKIM halal certification is strict and widely respected, and prayer rooms (surau) are found in every shopping mall, office building and hotel.',
    halalHighlights: ['National Mosque (Masjid Negara)', 'JAKIM-certified halal food everywhere', 'Prayer rooms in every Pavilion and KLCC', 'Ramadan Bazaars citywide', 'Halal buffet breakfast at all hotels'],
  },
  medina: {
    name: 'Medina',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    iataCode: 'MED',
    metaDescription: 'Hotels near Al-Masjid an-Nabawi in Medina, Saudi Arabia. Muslim-friendly stays for Umrah and Hajj pilgrims.',
    muslimTips: 'Medina is the second holiest city in Islam, home to Al-Masjid an-Nabawi — the Prophet\'s Mosque. The entire city is built around Islamic values; all food is halal, no alcohol exists, and hotels are designed to accommodate the spiritual needs of pilgrims visiting Masjid an-Nabawi.',
    halalHighlights: ['Al-Masjid an-Nabawi (Prophet\'s Mosque)', 'All food is halal — city-wide', 'Hotels within walking distance of the mosque', 'Special Umrah hotel packages', 'Non-Mus­lims restricted from holy areas'],
  },
  mecca: {
    name: 'Mecca',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    iataCode: 'JED', // Nearest major airport is Jeddah
    metaDescription: 'Hotels near Masjid Al-Haram in Mecca for Umrah and Hajj. Muslim-only city with complete halal environment.',
    muslimTips: 'Mecca is the holiest city in Islam and is accessible to Muslims only. Every hotel, restaurant and service is entirely halal. Hotels near the Grand Mosque (Masjid Al-Haram) fill up fast — book early, especially during Ramadan and Hajj season.',
    halalHighlights: ['Masjid Al-Haram — Grand Mosque', 'Muslim visitors only', 'All food is halal', 'Hotels steps from the Kaaba', 'Zamzam water available everywhere'],
  },
  marrakech: {
    name: 'Marrakech',
    country: 'Morocco',
    countryCode: 'MA',
    iataCode: 'RAK',
    metaDescription: 'Muslim-friendly riads and hotels in Marrakech, Morocco. Medina stays with mosque proximity scores and halal food ratings.',
    muslimTips: 'Marrakech is a deeply Islamic city where the call to prayer from the Koutoubia Mosque sets the rhythm of daily life. Traditional riads in the Medina offer authentic Muslim-friendly accommodation, and the souks overflow with halal street food and Moroccan cuisine.',
    halalHighlights: ['Koutoubia Mosque — iconic landmark', 'Halal Moroccan street food in Djemaa el-Fna', 'Traditional riads in the Medina', 'No alcohol in traditional riads', 'Hammams — traditional Islamic baths'],
  },
  amman: {
    name: 'Amman',
    country: 'Jordan',
    countryCode: 'JO',
    iataCode: 'AMM',
    metaDescription: 'Muslim-friendly hotels in Amman, Jordan. Gateway to Petra, Dead Sea and Islamic heritage sites.',
    muslimTips: 'Jordan\'s capital Amman is a welcoming, Muslim-majority city with a relaxed atmosphere. Halal food is ubiquitous, mosques are plentiful, and the city is an ideal base for visiting Petra, the Dead Sea, and Wadi Rum. Jordanians are known for their warm hospitality.',
    halalHighlights: ['King Abdullah I Mosque', 'Extensive halal dining in Rainbow Street', 'Gateway to Petra and Wadi Rum', 'Dead Sea day trips', 'Aqaba for halal beach holidays'],
  },
  doha: {
    name: 'Doha',
    country: 'Qatar',
    countryCode: 'QA',
    iataCode: 'DOH',
    metaDescription: 'Muslim-friendly hotels in Doha, Qatar. Luxury Gulf stays with halal food, mosque proximity and prayer room scores.',
    muslimTips: 'Qatar\'s capital Doha is a showcase of modern Islamic architecture alongside traditional culture. The city is deeply conservative by Gulf standards, with strict alcohol regulations, widespread halal dining, and world-class mosques. The Museum of Islamic Art is a must-visit.',
    halalHighlights: ['State Grand Mosque', 'Museum of Islamic Art', 'Souq Waqif traditional market', 'Halal luxury dining citywide', 'Limited alcohol — mostly in hotels'],
  },
  tokyo: {
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    iataCode: 'TYO',
    metaDescription: 'Muslim-friendly hotels in Tokyo, Japan. Halal-certified restaurants, prayer rooms in Shinjuku and Akihabara, and mosque-proximate stays.',
    muslimTips: 'Tokyo has rapidly expanded its halal food scene and Muslim-friendly facilities. The Tokyo Camii & Turkish Culture Center in Yoyogi is the largest mosque in Japan. Many restaurants now display halal certification, and major shopping malls have prayer rooms. Staff at major hotels are trained in Muslim guest needs.',
    halalHighlights: ['Tokyo Camii — Japan\'s largest mosque', '200+ halal-certified restaurants', 'Prayer rooms in Shinjuku and Shibuya malls', 'Muslim-friendly tours available', 'Halal-friendly ryokan (traditional inns)'],
  },
  london: {
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    iataCode: 'LON',
    metaDescription: 'Muslim-friendly hotels in London, UK. Stay near East London mosques, halal Brick Lane restaurants and prayer room facilities.',
    muslimTips: 'London has one of the largest Muslim populations in Europe, with vibrant communities in East London, Edgware Road, and Southall. Brick Lane and Whitechapel are packed with halal Bangladeshi and South Asian restaurants. The East London Mosque is one of the largest in Europe.',
    halalHighlights: ['East London Mosque — Europe\'s largest', 'Brick Lane halal restaurants', 'Edgware Road Arabic food street', 'Halal options in most supermarkets', 'Prayer rooms in Westfield malls'],
  },
  paris: {
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    iataCode: 'PAR',
    metaDescription: 'Muslim-friendly hotels in Paris, France. Find halal restaurants near the Eiffel Tower, mosque proximity scores and prayer facilities.',
    muslimTips: 'Paris has a large Muslim community — particularly in the 18th and 19th arrondissements — with excellent halal options. The Grande Mosquée de Paris in the 5th arrondissement has a beautiful courtyard café serving halal Moroccan food. Muslim-friendly hotels are widely available.',
    halalHighlights: ['Grande Mosquée de Paris', 'Halal Moroccan café at the mosque', '18ème and 19ème arrondissements', 'Barbès market halal food', 'Seine river halal picnic spots'],
  },
  maldives: {
    name: 'Maldives',
    country: 'Maldives',
    countryCode: 'MV',
    iataCode: 'MLE',
    metaDescription: 'Muslim-friendly island resorts in the Maldives. Halal island stays, alcohol-free options and pristine beaches for Muslim travellers.',
    muslimTips: 'The Maldives is a 100% Muslim nation, making it inherently halal-friendly. The inhabited local islands are alcohol-free and deeply Islamic, while resort islands operate differently. For Muslim couples seeking a halal honeymoon, local island stays in Maafushi or Dhigurah offer incredible beaches without alcohol.',
    halalHighlights: ['100% Muslim population', 'Local islands are completely alcohol-free', 'Friday mosque on every island', 'Halal seafood cuisine', 'Muslim honeymoon packages available'],
  },
  singapore: {
    name: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    iataCode: 'SIN',
    metaDescription: 'Muslim-friendly hotels in Singapore near Masjid Sultan, Kampong Glam and MUIS-certified halal restaurants.',
    muslimTips: 'Singapore has a thriving Muslim-Malay community centred around Kampong Glam and the historic Masjid Sultan. MUIS certification is the gold standard for halal food in Singapore, and options range from hawker centres to fine dining. Many hotels offer halal buffet breakfast.',
    halalHighlights: ['Masjid Sultan in Kampong Glam', 'MUIS-certified halal restaurants', 'Arab Street halal food scene', 'Prayer rooms in Orchard Road malls', 'Geylang Serai Malay village'],
  },
  // Additional cities
  'abu-dhabi': {
    name: 'Abu Dhabi',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    iataCode: 'AUH',
    metaDescription: 'Muslim-friendly hotels in Abu Dhabi, UAE. Sheikh Zayed Grand Mosque, halal dining and prayer room ratings.',
    muslimTips: 'Abu Dhabi is home to the Sheikh Zayed Grand Mosque — one of the largest and most magnificent mosques in the world. The city is more conservative than Dubai, with strong Islamic values and excellent halal dining throughout.',
    halalHighlights: ['Sheikh Zayed Grand Mosque', 'Halal dining at Yas Island', 'Prayer rooms in all malls', 'Ramadan celebrations', 'Non-alcoholic luxury options'],
  },
  cairo: {
    name: 'Cairo',
    country: 'Egypt',
    countryCode: 'EG',
    iataCode: 'CAI',
    metaDescription: 'Muslim-friendly hotels in Cairo, Egypt. Near Al-Azhar Mosque, Islamic Cairo and halal Egyptian cuisine.',
    muslimTips: 'Cairo is the cultural heart of the Arab world. Al-Azhar — the world\'s oldest university — is here, along with hundreds of historic mosques in Islamic Cairo. Egyptian cuisine is largely halal, and the city has a deep spiritual significance for Muslims worldwide.',
    halalHighlights: ['Al-Azhar Mosque and University', 'Islamic Cairo historic district', 'Halal Egyptian cuisine everywhere', 'Khan el-Khalili halal market', 'Nile dinner cruises with halal food'],
  },
  bali: {
    name: 'Bali',
    country: 'Indonesia',
    countryCode: 'ID',
    iataCode: 'DPS',
    metaDescription: 'Muslim-friendly villas and hotels in Bali, Indonesia. Halal-certified restaurants and prayer facilities for Muslim travellers.',
    muslimTips: 'While Bali is predominantly Hindu, it is part of Indonesia — the world\'s largest Muslim country. Halal food options are widely available, particularly in Seminyak and Kuta. Many hotels accommodate Muslim dietary requirements, and there are mosques in most tourist areas.',
    halalHighlights: ['Mosques in Seminyak and Kuta', 'Indonesian halal cuisine', 'Lombok (nearby) is 90% Muslim', 'Halal-certified restaurants growing', 'Rice paddy halal breakfast options'],
  },
  'kuala-terengganu': {
    name: 'Kuala Terengganu',
    country: 'Malaysia',
    countryCode: 'MY',
    iataCode: 'TGG',
    metaDescription: 'Muslim-friendly hotels in Kuala Terengganu, Malaysia. Conservative East Coast beaches and Islamic cultural tourism.',
    muslimTips: 'Kuala Terengganu on Malaysia\'s East Coast is one of the most Islamic states in the country. Conservative, peaceful and beautiful, it offers pristine beaches, exceptional halal seafood, and deep cultural connections to Malay-Islamic heritage.',
    halalHighlights: ['Crystal Mosque (Masjid Kristal)', 'Pristine halal East Coast beaches', 'Traditional Malay Islamic culture', 'Batik and handicraft heritage', 'Fresh halal seafood markets'],
  },
  jakarta: {
    name: 'Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    iataCode: 'CGK',
    metaDescription: 'Muslim-friendly hotels in Jakarta, Indonesia. World\'s largest Muslim population, halal food on every street.',
    muslimTips: 'Jakarta is the capital of Indonesia — the world\'s largest Muslim nation. Halal food is the overwhelming norm, the Istiqlal Mosque (Southeast Asia\'s largest mosque) is a landmark, and Muslim-friendly accommodation is everywhere. The city is a gateway to Java\'s Islamic heritage.',
    halalHighlights: ['Istiqlal Mosque — SE Asia\'s largest', 'Halal food on every street', 'Traditional Islamic batik culture', 'Ramadan street food bazaars', 'Muslim-friendly beach resorts nearby'],
  },
}

export async function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }))
}

export async function generateMetadata(
  { params }: { params: { city: string } }
): Promise<Metadata> {
  const city = CITIES[params.city]
  if (!city) return { title: 'Muslim-Friendly Hotels | HumbleHalal' }

  const title = `Muslim-Friendly Hotels in ${city.name} | HumbleHalal`
  return {
    title,
    description: city.metaDescription,
    openGraph: {
      title,
      description: city.metaDescription,
      type: 'website',
      url: `${SITE_URL}/travel/muslim-friendly-hotels/${params.city}`,
    },
    alternates: {
      canonical: `${SITE_URL}/travel/muslim-friendly-hotels/${params.city}`,
    },
  }
}

export default function MuslimFriendlyHotelsPage({
  params,
}: {
  params: { city: string }
}) {
  const city = CITIES[params.city]
  if (!city) notFound()

  // Checkin/checkout defaults: 30 days out, 3-night stay
  const checkin = new Date()
  checkin.setDate(checkin.getDate() + 30)
  const checkout = new Date(checkin)
  checkout.setDate(checkout.getDate() + 3)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: `Muslim-Friendly Hotels in ${city.name}`,
    description: city.metaDescription,
    url: `${SITE_URL}/travel/muslim-friendly-hotels/${params.city}`,
    touristType: 'Muslim travellers',
    containedInPlace: {
      '@type': 'Country',
      name: city.country,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Travel', item: `${SITE_URL}/travel` },
        { '@type': 'ListItem', position: 2, name: 'Muslim-Friendly Hotels', item: `${SITE_URL}/travel/muslim-friendly-hotels` },
        { '@type': 'ListItem', position: 3, name: city.name, item: `${SITE_URL}/travel/muslim-friendly-hotels/${params.city}` },
      ],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        {/* Hero */}
        <section className="bg-background-dark relative overflow-hidden">
          <div className="absolute inset-0 islamic-pattern" aria-hidden />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
            {/* Breadcrumb */}
            <nav className="text-xs text-white/50 mb-4 flex items-center gap-1.5 flex-wrap">
              <Link href="/travel" className="hover:text-white transition-colors">Travel</Link>
              <span>/</span>
              <Link href="/travel/hotels" className="hover:text-white transition-colors">Hotels</Link>
              <span>/</span>
              <span className="text-white/80">{city.name}</span>
            </nav>
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Muslim-Friendly Travel</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
              Muslim-Friendly Hotels<br className="hidden sm:block" />
              in <span className="text-accent font-display italic">{city.name}</span>
            </h1>
            <p className="text-white/70 text-base mb-8 max-w-xl">
              {city.metaDescription}
            </p>

            {/* Search bar — pre-filled with this city */}
            <div className="bg-white rounded-2xl p-4 shadow-xl max-w-3xl">
              <HotelSearchBar
                defaultDestination={city.name}
                defaultCheckin={fmt(checkin)}
                defaultCheckout={fmt(checkout)}
              />
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Muslim travel tips */}
              <section>
                <h2 className="text-xl font-extrabold text-charcoal mb-3">
                  Muslim Travel Tips for {city.name}
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-charcoal/70 leading-relaxed">{city.muslimTips}</p>
                </div>
              </section>

              {/* Halal highlights */}
              <section>
                <h2 className="text-xl font-extrabold text-charcoal mb-3">
                  Halal Highlights in {city.name}
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <ul className="space-y-2">
                    {city.halalHighlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-charcoal/80">
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5 shrink-0">check_circle</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Search CTA */}
              <section className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                <h3 className="font-bold text-charcoal mb-2">Ready to search hotels in {city.name}?</h3>
                <p className="text-sm text-charcoal/60 mb-4">
                  Every result is enriched with mosque proximity, halal food counts and prayer room availability.
                </p>
                <Link
                  href={`/travel/hotels?dest=${encodeURIComponent(city.name)}&checkin=${fmt(checkin)}&checkout=${fmt(checkout)}&guests=2`}
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                >
                  <span className="material-symbols-outlined text-sm">hotel</span>
                  Search hotels in {city.name}
                </Link>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">

              {/* Quick facts */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-charcoal text-sm mb-3">Quick facts</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-charcoal/50">Country</span>
                    <span className="font-semibold text-charcoal">{city.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/50">Nearest airport</span>
                    <span className="font-mono font-bold text-charcoal">{city.iataCode}</span>
                  </div>
                </div>
              </div>

              {/* Flight affiliate */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">flight</span>
                  <p className="font-bold text-charcoal text-sm">Flights to {city.name}</p>
                </div>
                <p className="text-xs text-charcoal/60 mb-3">
                  Search and compare flights from Singapore to {city.iataCode} via Skyscanner.
                </p>
                <Link
                  href={`/travel/flights?from=SIN&to=${city.iataCode}`}
                  className="block text-center bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Search flights →
                </Link>
              </div>

              {/* Other destinations */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-charcoal text-sm mb-3">Other destinations</h3>
                <div className="space-y-1">
                  {Object.entries(CITIES)
                    .filter(([slug]) => slug !== params.city)
                    .slice(0, 6)
                    .map(([slug, c]) => (
                      <Link
                        key={slug}
                        href={`/travel/muslim-friendly-hotels/${slug}`}
                        className="block text-xs text-charcoal/70 hover:text-primary transition-colors py-0.5"
                      >
                        → {c.name}, {c.country}
                      </Link>
                    ))}
                </div>
                <Link
                  href="/travel"
                  className="block text-xs text-primary font-semibold mt-3 hover:underline"
                >
                  All destinations →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
