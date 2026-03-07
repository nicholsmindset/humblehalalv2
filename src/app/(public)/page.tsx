import Link from 'next/link'
import { IslamicPattern } from '@/components/layout/IslamicPattern'

// ── Category grid data ────────────────────────────────────────
const categories = [
  { label: 'Restaurants', icon: 'restaurant', href: '/halal-food', count: '2,400+', color: 'bg-emerald-50 text-primary' },
  { label: 'Muslim Businesses', icon: 'store', href: '/business', count: '800+', color: 'bg-amber-50 text-accent' },
  { label: 'Catering', icon: 'lunch_dining', href: '/catering', count: '150+', color: 'bg-emerald-50 text-primary' },
  { label: 'Events', icon: 'event', href: '/events', count: '50+', color: 'bg-amber-50 text-accent' },
  { label: 'Classifieds', icon: 'sell', href: '/classifieds', count: '300+', color: 'bg-emerald-50 text-primary' },
  { label: 'Mosques', icon: 'mosque', href: '/mosque', count: '70+', color: 'bg-amber-50 text-accent' },
  { label: 'Prayer Rooms', icon: 'location_on', href: '/prayer-rooms', count: '200+', color: 'bg-emerald-50 text-primary' },
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
    "Singapore's trusted halal directory. Find MUIS-certified restaurants, Muslim businesses, mosques, events, classifieds and more. 2,000+ halal listings.",
}

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-background-dark overflow-hidden min-h-[560px] flex items-center">
        <IslamicPattern opacity={0.08} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-accent text-sm font-bold uppercase tracking-widest mb-4">
            Singapore&apos;s Halal Ecosystem
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 font-sans leading-tight">
            Find Halal in{' '}
            <span className="italic font-display text-accent">Singapore</span>
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
            2,000+ MUIS-certified restaurants, Muslim businesses, mosques, events,
            and community classifieds — all in one place.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
                search
              </span>
              <input
                type="search"
                placeholder="Search halal restaurants, businesses…"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-charcoal placeholder-charcoal/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Link
              href="/halal-food"
              className="bg-accent text-charcoal font-bold px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors shrink-0 text-sm"
            >
              Search
            </Link>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {cuisines.slice(0, 5).map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: '2,400+', label: 'Halal Listings' },
              { n: '70+', label: 'Mosques' },
              { n: '200+', label: 'Prayer Rooms' },
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
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all p-5 flex flex-col items-center text-center gap-2"
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
                className="bg-warm-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
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
                className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

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
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-accent text-sm"
            />
            <Link
              href="/newsletter"
              className="bg-accent text-charcoal font-bold px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors shrink-0 text-sm"
            >
              Subscribe
            </Link>
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
