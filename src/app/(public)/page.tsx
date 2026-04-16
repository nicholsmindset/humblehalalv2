import Image from 'next/image'
import Link from 'next/link'
import { IslamicPattern } from '@/components/layout/IslamicPattern'
import { HeroSearch } from '@/components/search/HeroSearch'
import { createClient } from '@/lib/supabase/server'

// ── Category grid data ────────────────────────────────────────
const categories = [
  { label: 'Restaurants', icon: 'restaurant', href: '/halal-food', count: '2,400+', color: 'bg-emerald-50 text-primary' },
  { label: 'Mosques', icon: 'mosque', href: '/mosque', count: '70+', color: 'bg-amber-50 text-accent' },
  { label: 'Prayer Rooms', icon: 'room_preferences', href: '/prayer-rooms', count: '200+', color: 'bg-emerald-50 text-primary' },
  { label: 'Muslim Businesses', icon: 'store', href: '/business', count: '800+', color: 'bg-amber-50 text-accent' },
  { label: 'Events', icon: 'event', href: '/events', count: '50+', color: 'bg-emerald-50 text-primary' },
  { label: 'Halal Travel', icon: 'flight', href: '/travel', count: '18 cities', color: 'bg-amber-50 text-accent' },
  { label: 'Muslim-Friendly Malls', icon: 'shopping_bag', href: '/malls', count: '20+', color: 'bg-emerald-50 text-primary' },
  { label: 'Products', icon: 'inventory_2', href: '/products', count: '500+', color: 'bg-amber-50 text-accent' },
] as const

// ── Popular areas ─────────────────────────────────────────────
const areas = [
  { label: 'Arab Street', href: '/halal-food?area=arab-street' },
  { label: 'Tampines', href: '/halal-food?area=tampines' },
  { label: 'Jurong East', href: '/halal-food?area=jurong-east' },
  { label: 'Woodlands', href: '/halal-food?area=woodlands' },
  { label: 'Bugis', href: '/halal-food?area=bugis' },
  { label: 'Bedok', href: '/halal-food?area=bedok' },
  { label: 'Yishun', href: '/halal-food?area=yishun' },
  { label: 'Orchard', href: '/halal-food?area=orchard' },
]

// ── Popular cuisines ──────────────────────────────────────────
const cuisines = [
  { label: 'Malay', href: '/halal-food?cuisine=malay' },
  { label: 'Indian', href: '/halal-food?cuisine=indian' },
  { label: 'Korean', href: '/halal-food?cuisine=korean' },
  { label: 'Middle Eastern', href: '/halal-food?cuisine=middle-eastern' },
  { label: 'Japanese', href: '/halal-food?cuisine=japanese' },
  { label: 'Turkish', href: '/halal-food?cuisine=turkish' },
  { label: 'Western', href: '/halal-food?cuisine=western' },
  { label: 'Buffet', href: '/halal-food?cuisine=buffet' },
]

export const metadata = {
  title: "HumbleHalal — Singapore's Halal Ecosystem",
  description:
    "Singapore's trusted halal directory. Find MUIS-certified restaurants, Muslim businesses, mosques, events and more. 2,000+ halal listings.",
}

export const revalidate = 1800

export default async function HomePage() {
  const supabase = await createClient()
  const [
    { data: featuredListings },
    { data: upcomingEvents },
    { data: newlyAdded },
    { count: listingCount },
    { count: mosqueCount },
    { count: prayerRoomCount },
  ] = await Promise.all([
    (supabase as any).from('listings')
      .select('id,name,slug,vertical,area,halal_status,photos,rating_avg,rating_count')
      .eq('status', 'active').eq('is_featured', true).limit(6),
    (supabase as any).from('events')
      .select('id,slug,title,area,venue,starts_at,ends_at,price_type,images,organiser')
      .eq('status', 'active').gte('ends_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(4),
    (supabase as any).from('listings')
      .select('id,name,slug,vertical,area,halal_status,photos,rating_avg,rating_count,created_at')
      .eq('status', 'active').order('created_at', { ascending: false }).limit(8),
    (supabase as any).from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    (supabase as any).from('mosques').select('*', { count: 'exact', head: true }),
    (supabase as any).from('prayer_rooms').select('*', { count: 'exact', head: true }),
  ])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-background-dark overflow-hidden min-h-[560px] flex items-center">
        {/* Singapore skyline photo with dark overlay */}
        <Image
          src="/images/singapore-hero.jpg"
          alt="Singapore skyline at dusk"
          fill
          priority
          className="object-cover object-center opacity-40"
          sizes="100vw"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/60 via-background-dark/40 to-background-dark/80 z-[1]" />
        <IslamicPattern opacity={0.06} />
        <div className="relative z-[2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {/* Verified badge */}
          <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30 mb-5">
            <span className="material-symbols-outlined text-sm">verified</span>
            Singapore&apos;s #1 Halal Ecosystem
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 font-sans leading-tight">
            Singapore&apos;s{' '}
            <span className="italic font-display text-accent">Halal</span>{' '}
            Ecosystem
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
            {(listingCount ?? 2400).toLocaleString()}+ MUIS-certified restaurants, Muslim businesses,
            mosques, events — all in one place.
          </p>

          {/* Frosted glass search bar (client component) */}
          <HeroSearch />
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: `${(listingCount ?? 2400).toLocaleString()}+`, label: 'Halal Listings' },
              { n: `${(mosqueCount ?? 70).toLocaleString()}+`, label: 'Mosques' },
              { n: `${(prayerRoomCount ?? 200).toLocaleString()}+`, label: 'Prayer Rooms' },
              { n: '50+', label: 'Areas Covered' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold">{s.n}</p>
                <p className="text-white/70 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category grid ────────────────────────────────────── */}
      <section className="bg-warm-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-charcoal font-sans">
              Explore the{' '}
              <span className="italic font-display text-primary">Ecosystem</span>
            </h2>
            <p className="text-charcoal/60 mt-2">Everything halal in Singapore, one platform.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all p-5 flex flex-col items-center text-center gap-2 min-h-[100px]"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <span className="font-bold text-charcoal text-sm">{cat.label}</span>
                <span className="text-charcoal/40 text-xs">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by area ───────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-charcoal">Browse by Area</h2>
            <Link href="/halal-food" className="text-primary text-sm font-medium hover:underline">
              View all areas →
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {areas.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className="bg-warm-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors min-h-[44px] flex items-center"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">location_on</span>
                {area.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by cuisine ────────────────────────────────── */}
      <section className="bg-warm-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-charcoal">Popular Cuisines</h2>
            <Link href="/halal-food" className="text-primary text-sm font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {cuisines.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors min-h-[44px] flex items-center"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Businesses ──────────────────────────────── */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-charcoal">Featured Businesses</h2>
              <Link href="/halal-food" className="text-primary text-sm font-medium hover:underline">See all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing: any) => (
                <Link key={listing.id} href={`/restaurant/${listing.slug}`} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden">
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                    {listing.photos?.[0] ? (
                      <Image src={listing.photos[0]} alt={listing.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                        <span className="material-symbols-outlined text-4xl text-primary">restaurant</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-charcoal text-sm leading-tight">{listing.name}</h3>
                      {listing.halal_status === 'muis_certified' && (
                        <span className="shrink-0 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">MUIS</span>
                      )}
                    </div>
                    <p className="text-charcoal/50 text-xs mt-1 capitalize">{listing.area?.replace(/-/g, ' ')}</p>
                    {listing.rating_avg && (
                      <p className="text-charcoal/70 text-xs mt-1">⭐ {Number(listing.rating_avg).toFixed(1)} ({listing.rating_count})</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Upcoming Events ──────────────────────────────────── */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="bg-warm-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-charcoal">Upcoming Events</h2>
              <Link href="/events" className="text-primary text-sm font-medium hover:underline">See all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingEvents.map((evt: any) => {
                const start = new Date(evt.starts_at)
                return (
                  <Link key={evt.id} href={`/events/${evt.slug}`} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden">
                    <div className="h-32 bg-amber-50 overflow-hidden relative">
                      {evt.images?.[0] ? (
                        <Image src={evt.images[0]} alt={evt.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="text-accent font-extrabold text-2xl">{start.toLocaleDateString('en-SG', { day: 'numeric' })}</span>
                          <span className="text-accent/70 text-xs font-bold uppercase">{start.toLocaleDateString('en-SG', { month: 'short' })}</span>
                        </div>
                      )}
                      {evt.price_type === 'free' && (
                        <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-charcoal text-sm leading-tight line-clamp-2">{evt.title}</p>
                      <p className="text-charcoal/50 text-xs mt-1">{start.toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-charcoal/50 text-xs capitalize">{evt.area?.replace(/-/g, ' ')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Newly Added ──────────────────────────────────────── */}
      {newlyAdded && newlyAdded.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-charcoal">Newly Added</h2>
              <Link href="/halal-food" className="text-primary text-sm font-medium hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {newlyAdded.map((listing: any) => (
                <Link key={listing.id} href={`/restaurant/${listing.slug}`} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all p-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary text-xl">restaurant</span>
                  </div>
                  <h3 className="font-bold text-charcoal text-sm leading-tight line-clamp-2">{listing.name}</h3>
                  <p className="text-charcoal/50 text-xs mt-1 capitalize">{listing.area?.replace(/-/g, ' ')}</p>
                  {listing.halal_status === 'muis_certified' && (
                    <span className="mt-2 inline-block bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">MUIS</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter CTA ───────────────────────────────────── */}
      <section className="relative bg-background-dark py-16 overflow-hidden">
        <IslamicPattern opacity={0.08} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <span className="material-symbols-outlined text-accent text-4xl mb-4 block">mail</span>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Stay in the Loop
          </h2>
          <p className="text-white/60 mb-8">
            Weekly halal dining guides, new openings, and community picks delivered
            to your inbox.
          </p>
          {/* text-base on input prevents iOS zoom; flex-col on mobile for full-width button */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 h-12 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-accent text-base"
            />
            <a
              href="https://humblehalal.beehiiv.com?utm_source=humblehalal&utm_medium=website&utm_campaign=homepage"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-charcoal font-bold px-6 h-12 rounded-xl hover:bg-accent/90 transition-colors shrink-0 text-sm flex items-center justify-center"
            >
              Subscribe
            </a>
          </div>
        </div>
      </section>

      {/* ── JSON-LD Schema ───────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'HumbleHalal',
            url: 'https://humblehalal.sg',
            description: "Singapore's trusted halal ecosystem directory",
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://humblehalal.sg/halal-food?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </>
  )
}
