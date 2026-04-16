import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Grow Your Halal Business | HumbleHalal',
  description: 'List your halal business on HumbleHalal — reach Singapore\'s Muslim community. Claim your existing listing or add your business for free.',
}

const BENEFITS = [
  {
    icon: 'search',
    title: 'Get Discovered',
    desc: 'Appear in searches by 10,000+ monthly visitors looking for halal businesses across Singapore.',
  },
  {
    icon: 'verified',
    title: 'Build Trust',
    desc: 'Display your MUIS certification, halal status, and collect verified reviews from the community.',
  },
  {
    icon: 'analytics',
    title: 'Track Performance',
    desc: 'See how many people viewed your listing, clicked your website, and requested directions.',
  },
  {
    icon: 'star',
    title: 'Stand Out',
    desc: 'Upgrade to featured placement for premium visibility across search results and category pages.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: 'SGD 0',
    period: 'forever',
    cta: 'Claim Free Listing',
    href: '/login?next=/business/claim',
    highlight: false,
    features: [
      'Basic business profile',
      'Address, phone, website',
      'Halal status badge',
      'Customer reviews',
      'Up to 3 photos',
      'Standard search placement',
    ],
  },
  {
    name: 'Premium',
    price: 'SGD 49',
    period: 'per month',
    cta: 'Start Free Trial',
    href: '/login?next=/business/upgrade',
    highlight: true,
    features: [
      'Everything in Free',
      'Featured placement in search',
      'Up to 20 photos + menu',
      'Priority in category pages',
      'Analytics dashboard',
      'WhatsApp enquiry button',
      'Social media links',
      'Boost posts to community feed',
    ],
  },
]

export default async function BusinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If signed in, check if they have any listings
  let myListings: any[] = []
  if (user) {
    const { data } = await (supabase as any)
      .from('listings')
      .select('id, name, vertical, slug, status, halal_status, is_featured')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    myListings = data ?? []
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Hero */}
      <section className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          <span className="material-symbols-outlined text-base">store</span>
          For Business Owners
        </div>
        <h1 className="text-4xl font-extrabold text-charcoal font-sans mb-4 leading-tight">
          Grow your halal business<br className="hidden sm:block" />
          with <span className="text-primary">HumbleHalal</span>
        </h1>
        <p className="text-charcoal/60 text-lg max-w-2xl mx-auto">
          Singapore&apos;s largest halal directory. Reach thousands of Muslim consumers actively
          searching for food, services, and experiences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/login?next=/business/claim"
            className="bg-primary text-white rounded-xl font-bold px-8 py-3.5 text-base hover:bg-primary/90 transition-colors"
          >
            Claim Your Free Listing
          </Link>
          <Link
            href="#plans"
            className="border border-gray-200 text-charcoal rounded-xl font-bold px-8 py-3.5 text-base hover:bg-gray-50 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </section>

      {/* My listings (signed-in) */}
      {user && myListings.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-charcoal mb-4">Your Listings</h2>
          <div className="space-y-3">
            {myListings.map((l: any) => (
              <div
                key={l.id}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">store</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal truncate">{l.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-gray-100 text-charcoal/60 px-2 py-0.5 rounded-full capitalize">
                      {l.vertical}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        l.status === 'published'
                          ? 'bg-primary/10 text-primary'
                          : l.status === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-charcoal/40'
                      }`}
                    >
                      {l.status}
                    </span>
                    {l.is_featured && (
                      <span className="text-xs bg-accent/20 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href="/business/dashboard"
                  className="text-sm text-primary font-medium hover:underline shrink-0"
                >
                  Manage →
                </Link>
              </div>
            ))}
          </div>
          <Link
            href="/business/claim"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary font-medium hover:underline"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Add another listing
          </Link>
        </section>
      )}

      {/* Benefits */}
      <section className="mb-14">
        <h2 className="text-2xl font-extrabold text-charcoal text-center mb-8">
          Why list on HumbleHalal?
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-xl">{b.icon}</span>
              </div>
              <h3 className="font-bold text-charcoal mb-2">{b.title}</h3>
              <p className="text-charcoal/60 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="mb-14">
        <h2 className="text-2xl font-extrabold text-charcoal text-center mb-2">
          Simple, honest pricing
        </h2>
        <p className="text-charcoal/50 text-center text-sm mb-8">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-7 ${
                plan.highlight
                  ? 'border-primary bg-primary text-white shadow-xl'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <p className={`text-sm font-bold mb-1 ${plan.highlight ? 'text-white/80' : 'text-charcoal/50'}`}>
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-extrabold ${plan.highlight ? 'text-white' : 'text-charcoal'}`}>
                  {plan.price}
                </span>
              </div>
              <p className={`text-xs mb-6 ${plan.highlight ? 'text-white/60' : 'text-charcoal/40'}`}>
                {plan.period}
              </p>
              <ul className="space-y-2.5 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span
                      className={`material-symbols-outlined text-base ${
                        plan.highlight ? 'text-white/80' : 'text-primary'
                      }`}
                    >
                      check_circle
                    </span>
                    <span className={plan.highlight ? 'text-white/90' : 'text-charcoal/70'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center rounded-xl font-bold py-3 text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl font-extrabold text-charcoal text-center mb-6">
          Common questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: 'My business is already listed. How do I claim it?',
              a: "Click 'Claim Your Free Listing', sign in, and search for your business. We'll send a verification code to your registered business email or phone.",
            },
            {
              q: 'Do I need a MUIS certificate to list?',
              a: "No. We support all halal statuses: MUIS Certified, Muslim Owned, Self Declared, and Not Applicable. You can list and update your halal status at any time.",
            },
            {
              q: 'How long does approval take?',
              a: 'Free listings are reviewed within 24–48 hours. Premium listings get priority review within a few hours.',
            },
            {
              q: 'Can I list more than one business?',
              a: 'Yes. You can manage multiple listings from your business dashboard with one account.',
            },
          ].map((item) => (
            <div key={item.q} className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-charcoal text-sm mb-2">{item.q}</h3>
              <p className="text-charcoal/60 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bg-primary rounded-2xl p-10 text-center relative overflow-hidden">
        <div className="islamic-pattern absolute inset-0" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-white mb-3">
            Ready to grow your halal business?
          </h2>
          <p className="text-white/70 text-sm mb-6">
            Join hundreds of halal businesses already on HumbleHalal.
          </p>
          <Link
            href="/login?next=/business/claim"
            className="inline-block bg-accent text-charcoal rounded-xl font-bold px-8 py-3.5 text-sm hover:bg-accent/90 transition-colors"
          >
            Get Listed Free Today
          </Link>
        </div>
      </div>
    </div>
  )
}
