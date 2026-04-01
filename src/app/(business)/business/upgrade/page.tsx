import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PREMIUM_TIERS } from '@/lib/stripe/client'
import { UpgradeButton } from './UpgradeButton'

export const metadata: Metadata = {
  title: 'Upgrade Your Listing | HumbleHalal Business',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

type Listing = {
  id: string
  name: string
  slug: string
  premium_tier: string | null
  status: string
}

export default async function UpgradePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/business/upgrade')

  const { data } = await (supabase as any)
    .from('listings')
    .select('id, name, slug, premium_tier, status')
    .eq('created_by', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const listings: Listing[] = data ?? []

  const tiers = Object.entries(PREMIUM_TIERS) as [
    keyof typeof PREMIUM_TIERS,
    (typeof PREMIUM_TIERS)[keyof typeof PREMIUM_TIERS],
  ][]

  return (
    <main className="min-h-screen bg-warm-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/business/dashboard"
            className="text-primary text-sm hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold text-charcoal mb-4">
            Upgrade Your{' '}
            <span className="font-display italic text-primary">Listing</span>
          </h1>
          <p className="text-charcoal/60 text-lg max-w-2xl mx-auto">
            Stand out from the crowd. Get more customers with a premium listing
            on Singapore&apos;s #1 halal directory.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map(([tierKey, tier]) => (
            <div
              key={tierKey}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${
                tierKey === 'premium'
                  ? 'border-primary shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              {tierKey === 'premium' && (
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-extrabold text-charcoal">
                {tier.name}
              </h2>
              <p className="text-3xl font-extrabold text-primary mt-2">
                SGD {tier.amountSgd}
                <span className="text-sm font-normal text-charcoal/50">
                  /month
                </span>
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-charcoal/70"
                  >
                    <span className="material-symbols-outlined text-primary text-base mt-0.5">
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {listings.length > 0 ? (
                <UpgradeButton
                  listingId={listings[0].id}
                  tier={tierKey}
                  tierName={tier.name}
                />
              ) : (
                <Link
                  href="/business/dashboard"
                  className="mt-6 w-full bg-primary text-white font-bold py-3 px-4 rounded-xl text-sm text-center hover:bg-primary/90 transition-colors"
                >
                  Create a Listing First
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Listing selector if multiple listings */}
        {listings.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-charcoal mb-2">Your Listings</h3>
            <p className="text-charcoal/60 text-sm mb-4">
              The upgrade above will apply to your first active listing. Contact
              support to upgrade a specific listing.
            </p>
            <div className="space-y-2">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-charcoal text-sm">
                    {l.name}
                  </span>
                  {l.premium_tier && (
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full capitalize">
                      {l.premium_tier}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
