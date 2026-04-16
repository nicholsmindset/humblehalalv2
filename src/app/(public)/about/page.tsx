import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About HumbleHalal — Singapore\'s Halal Ecosystem | HumbleHalal',
  description: 'HumbleHalal is Singapore\'s all-in-one halal platform — 2,400+ MUIS-certified restaurants, Muslim businesses, mosques, events, travel guides, and halal products.',
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0f231d] relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-[#D4A017] text-xs font-bold uppercase tracking-widest mb-3">
            Our Mission
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 font-sans leading-tight">
            About{' '}
            <span className="italic font-display text-[#D4A017]">HumbleHalal</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Singapore&apos;s all-in-one halal ecosystem — making it effortless for Muslims
            to find, discover, and connect with everything halal in one place.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1C1917] mb-4 font-sans">
              What We Do
            </h2>
            <p className="text-[#1C1917]/70 leading-relaxed mb-4">
              HumbleHalal is Singapore&apos;s most comprehensive halal directory and community
              platform. We bring together 10,000+ programmatic pages covering restaurants,
              Muslim businesses, mosques, prayer rooms, events, travel guides,
              halal products, and service providers.
            </p>
            <p className="text-[#1C1917]/70 leading-relaxed">
              Every listing is enriched with MUIS certification status, Google Maps data,
              community reviews, and up-to-date information — so you can always trust what
              you find here.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-[#1C1917] mb-4 font-sans">
              Our Values
            </h2>
            <ul className="space-y-4">
              {[
                { icon: 'verified', title: 'Accuracy', body: 'MUIS certification is our highest trust tier. We verify and update listings regularly.' },
                { icon: 'groups', title: 'Community', body: 'Built for the Muslim community in Singapore, by people who understand the ecosystem.' },
                { icon: 'public', title: 'Accessibility', body: 'Free to browse, free to discover. Premium features support our operations.' },
              ].map((v) => (
                <li key={v.title} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#047857] text-xl mt-0.5 shrink-0">{v.icon}</span>
                  <div>
                    <p className="font-bold text-[#1C1917] text-sm">{v.title}</p>
                    <p className="text-[#1C1917]/60 text-sm">{v.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#0f231d] rounded-2xl p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center mb-16">
          {[
            { n: '2,400+', label: 'Halal Listings' },
            { n: '70+', label: 'Mosques' },
            { n: '200+', label: 'Prayer Rooms' },
            { n: '50+', label: 'Areas Covered' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-[#D4A017]">{s.n}</p>
              <p className="text-white/60 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[#1C1917]/60 mb-6">
            Have a question or want to list your business?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="bg-[#047857] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#047857]/90 transition-colors text-sm"
            >
              Contact Us
            </Link>
            <Link
              href="/halal-food"
              className="bg-[#D4A017] text-[#1C1917] font-bold px-6 py-3 rounded-xl hover:bg-[#D4A017]/90 transition-colors text-sm"
            >
              Explore Listings
            </Link>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About HumbleHalal',
            url: 'https://humblehalal.sg/about',
            description: "Singapore's all-in-one halal ecosystem platform.",
            publisher: {
              '@type': 'Organization',
              name: 'HumbleHalal',
              url: 'https://humblehalal.sg',
            },
          }),
        }}
      />
    </>
  )
}
