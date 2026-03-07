import type { Metadata } from 'next'
import Link from 'next/link'
import { HotelSearchBar } from '@/components/travel/HotelSearchBar'

export const metadata: Metadata = {
  title: 'Halal Travel — Muslim-Friendly Hotels & Flights | HumbleHalal',
  description: 'Search Muslim-friendly hotels worldwide with mosque proximity scores, halal food ratings and prayer room filters. Book confidently with HumbleHalal.',
  openGraph: {
    title: 'Halal Travel — Muslim-Friendly Hotels | HumbleHalal',
    description: 'Find and book hotels near mosques and halal restaurants. Muslim-friendly enrichment on every search result.',
    type: 'website',
  },
}

const TOP_CITIES = [
  { name: 'Dubai', slug: 'dubai',       emoji: '🕌', tag: 'Iconic halal destination' },
  { name: 'Istanbul', slug: 'istanbul', emoji: '🏛️', tag: 'Ottoman heritage & cuisine' },
  { name: 'Kuala Lumpur', slug: 'kuala-lumpur', emoji: '🌴', tag: 'Malaysia\'s halal capital' },
  { name: 'Medina', slug: 'medina',     emoji: '☪️', tag: 'Sacred city in Saudi Arabia' },
  { name: 'Mecca', slug: 'mecca',       emoji: '🕋', tag: 'Holiest city in Islam' },
  { name: 'Marrakech', slug: 'marrakech', emoji: '🌅', tag: 'Morocco magic & medinas' },
  { name: 'Amman', slug: 'amman',       emoji: '🏜️', tag: 'Ancient Jordanian capital' },
  { name: 'Doha', slug: 'doha',         emoji: '🏙️', tag: 'Gulf luxury & culture' },
  { name: 'Tokyo', slug: 'tokyo',       emoji: '🗼', tag: 'Growing halal food scene' },
  { name: 'London', slug: 'london',     emoji: '🎡', tag: 'Vibrant Muslim community' },
  { name: 'Paris', slug: 'paris',       emoji: '🗼', tag: 'Eiffel & halal hotspots' },
  { name: 'Maldives', slug: 'maldives', emoji: '🏝️', tag: 'Island luxury & halal stays' },
]

export default function TravelHubPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-background-dark relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern" aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Halal Travel</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
            Book Muslim-Friendly Hotels <br className="hidden sm:block" />
            <span className="text-accent font-display italic">Worldwide</span>
          </h1>
          <p className="text-white/70 text-base mb-8 max-w-xl">
            Every hotel is scored for mosque proximity, halal food density, prayer rooms and halal breakfast — so you can book with confidence.
          </p>

          {/* Hotel search bar */}
          <div className="bg-white rounded-2xl p-4 shadow-xl max-w-3xl">
            <HotelSearchBar />
          </div>
        </div>
      </section>

      {/* Feature badges */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-charcoal/60 font-semibold">
            {[
              { icon: 'mosque', text: 'Mosque proximity scores' },
              { icon: 'restaurant', text: 'Halal food nearby' },
              { icon: 'self_improvement', text: 'Prayer room indicator' },
              { icon: 'free_breakfast', text: 'Halal breakfast flag' },
              { icon: 'star', text: 'Muslim-friendly rating' },
              { icon: 'flight', text: 'Skyscanner flights' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-charcoal">Popular halal destinations</h2>
          <Link
            href="/travel/hotels"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            All hotels
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {TOP_CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/travel/muslim-friendly-hotels/${city.slug}`}
              className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <span className="text-3xl block mb-2">{city.emoji}</span>
              <p className="font-bold text-charcoal text-sm group-hover:text-primary transition-colors">{city.name}</p>
              <p className="text-xs text-charcoal/40 mt-0.5">{city.tag}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Flight affiliate nudge */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-3xl">flight</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-extrabold text-charcoal text-lg">Also need flights?</h3>
            <p className="text-charcoal/60 text-sm mt-1">
              Search and compare flights from Singapore and worldwide via Skyscanner.
              Track your trip from takeoff to check-in.
            </p>
          </div>
          <Link
            href="/travel/flights"
            className="shrink-0 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">flight_takeoff</span>
            Search flights
          </Link>
        </div>
      </section>
    </div>
  )
}
