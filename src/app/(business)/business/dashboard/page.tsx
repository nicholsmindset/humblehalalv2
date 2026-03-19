import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/business/ListingCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Business Dashboard | HumbleHalal',
  description: 'Manage your halal business listings on HumbleHalal.',
  robots: { index: false, follow: false },
}

type Listing = {
  id: string
  name: string
  slug: string
  vertical: string
  area: string
  halal_status: 'muis_certified' | 'muslim_owned' | 'self_declared' | 'not_applicable'
  status: 'active' | 'pending' | 'archived' | 'flagged'
  created_at: string
  review_count: number
  avg_rating: number
}

export default async function BusinessDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/business/dashboard')

  const { data } = await (supabase as any)
    .from('listings')
    .select('id, name, slug, vertical, area, halal_status, status, created_at, review_count, avg_rating')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const listings: Listing[] = data ?? []

  const published = listings.filter((l) => l.status === 'active').length
  const pending = listings.filter((l) => l.status === 'pending').length

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1C1917]">Business Dashboard</h1>
            <p className="text-[#1C1917]/50 text-sm mt-1">{user.email}</p>
          </div>
          <Link
            href="/business"
            className="inline-flex items-center gap-2 bg-[#047857] text-white rounded-lg font-bold px-4 py-2.5 text-sm hover:bg-[#047857]/90 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Listing
          </Link>
        </div>

        {/* Stats bar — only show when there are listings */}
        {listings.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              icon="store"
              label="Total Listings"
              value={listings.length}
              color="text-[#047857]"
              bg="bg-[#047857]/10"
            />
            <StatCard
              icon="check_circle"
              label="Published"
              value={published}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              icon="pending"
              label="Pending Review"
              value={pending}
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>
        )}

        {/* Listings grid */}
        {listings.length > 0 ? (
          <section>
            <h2 className="text-sm font-bold text-[#1C1917]/50 uppercase tracking-wider mb-4">
              Your Listings
            </h2>
            <div className="space-y-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  name={listing.name}
                  vertical={listing.vertical}
                  area={listing.area}
                  halal_status={listing.halal_status}
                  status={listing.status}
                />
              ))}
            </div>
          </section>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-[#047857]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[#047857] text-3xl">store</span>
            </div>
            <h2 className="text-lg font-bold text-[#1C1917] mb-2">No listings yet</h2>
            <p className="text-[#1C1917]/50 text-sm mb-6 max-w-sm mx-auto">
              Claim your existing listing or add your business to reach Singapore&apos;s Muslim community.
            </p>
            <Link
              href="/business"
              className="inline-flex items-center gap-2 bg-[#047857] text-white rounded-xl font-bold px-6 py-3 text-sm hover:bg-[#047857]/90 transition-colors"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Claim or Add a Listing
            </Link>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#1C1917]/50 hover:text-[#047857] transition-colors"
          >
            <span className="material-symbols-outlined text-base">person</span>
            My Account
          </Link>
          <Link
            href="/business"
            className="flex items-center gap-1.5 text-sm text-[#1C1917]/50 hover:text-[#047857] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add_business</span>
            Add Another Listing
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: string
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
        <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-[#1C1917]">{value}</p>
      <p className="text-xs text-[#1C1917]/50 mt-0.5">{label}</p>
    </div>
  )
}
