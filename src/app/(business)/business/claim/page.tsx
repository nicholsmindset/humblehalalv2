import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClaimListingForm } from '@/components/forms/ClaimListingForm'

export const metadata: Metadata = {
  title: 'Claim Your Business Listing | HumbleHalal',
  description:
    'Own a halal business in Singapore? Claim your listing on HumbleHalal to manage your profile, respond to reviews, and reach more customers.',
}

export const dynamic = 'force-dynamic'

interface ClaimPageProps {
  searchParams: Promise<{ listing_id?: string; listing_name?: string }>
}

export default async function ClaimListingPage({ searchParams }: ClaimPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/business/claim')

  const params = await searchParams
  const listingId = params.listing_id ?? ''
  const listingName = params.listing_name ?? ''

  // If no listing context provided, try to surface a search prompt
  const hasClaim = Boolean(listingId && listingName)

  return (
    <main className="min-h-screen bg-warm-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/business"
          className="text-primary text-sm hover:underline mb-6 inline-block"
        >
          ← Business Hub
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">
                verified
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-charcoal">
              Claim Your Listing
            </h1>
            <p className="text-charcoal/60 mt-2 text-sm">
              Verify you own this business to unlock management features, respond
              to reviews, and update your profile.
            </p>
          </div>

          {hasClaim ? (
            <ClaimListingForm listingId={listingId} listingName={listingName} />
          ) : (
            <div className="text-center py-6">
              <p className="text-charcoal/60 text-sm mb-4">
                To claim a listing, find your business in our directory and click
                the &quot;Claim this listing&quot; button.
              </p>
              <Link
                href="/halal-food"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  search
                </span>
                Browse Directory
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
