import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EditListingForm } from '@/components/business/EditListingForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit Listing | HumbleHalal',
  robots: { index: false, follow: false },
}

type HalalStatus = 'muis_certified' | 'muslim_owned' | 'self_declared' | 'not_applicable'
type ListingStatus = 'active' | 'pending' | 'archived' | 'flagged'

type ListingRow = {
  id: string
  name: string
  slug: string
  vertical: string
  area: string
  halal_status: HalalStatus
  status: ListingStatus
  description: string | null
  address: string | null
  phone: string | null
  website: string | null
  operating_hours: string | null
  owner_id: string | null
  review_count: number
  avg_rating: number
}

const HALAL_LABELS: Record<HalalStatus, string> = {
  muis_certified: 'MUIS Certified',
  muslim_owned: 'Muslim Owned',
  self_declared: 'Self Declared',
  not_applicable: 'Not Applicable',
}

const HALAL_COLORS: Record<HalalStatus, string> = {
  muis_certified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  muslim_owned: 'bg-blue-50 text-blue-700 border border-blue-200',
  self_declared: 'bg-amber-50 text-amber-700 border border-amber-200',
  not_applicable: 'bg-gray-100 text-gray-500 border border-gray-200',
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/business/dashboard/listings/${id}`)

  const { data, error } = await (supabase as any)
    .from('listings')
    .select(
      'id, name, slug, vertical, area, halal_status, status, description, address, phone, website, operating_hours, owner_id, review_count, avg_rating'
    )
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const listing = data as ListingRow

  // Ownership check — admins bypass this via PATCH route but we guard the UI
  if (listing.owner_id !== user.id) {
    // Also check created_by via a second query to handle listings created before owner_id was set
    const { data: createdByCheck } = await (supabase as any)
      .from('listings')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!createdByCheck) notFound()
  }

  const isPublished = listing.status === 'active'

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#1C1917]/50 mb-8">
          <Link href="/business/dashboard" className="hover:text-[#047857] transition-colors">
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#1C1917] font-medium truncate">{listing.name}</span>
        </nav>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#047857]/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#047857] text-xl">store</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-[#1C1917] leading-tight">{listing.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs bg-gray-100 text-[#1C1917]/60 px-2 py-0.5 rounded-full capitalize">
                  {listing.vertical.replace('_', ' ')}
                </span>
                <span className="text-xs text-[#1C1917]/50">{listing.area}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${HALAL_COLORS[listing.halal_status]}`}
                >
                  {HALAL_LABELS[listing.halal_status]}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  />
                  <span
                    className={`text-xs font-medium ${isPublished ? 'text-emerald-600' : 'text-gray-400'}`}
                  >
                    {isPublished ? 'Published' : listing.status === 'pending' ? 'Pending Review' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#047857] text-lg">star</span>
              <div>
                <p className="text-lg font-extrabold text-[#1C1917] leading-none">
                  {listing.avg_rating > 0 ? listing.avg_rating.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-[#1C1917]/50 mt-0.5">Avg rating</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#047857] text-lg">rate_review</span>
              <div>
                <p className="text-lg font-extrabold text-[#1C1917] leading-none">
                  {listing.review_count}
                </p>
                <p className="text-xs text-[#1C1917]/50 mt-0.5">Reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit form card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#1C1917] mb-6">Edit Listing Details</h2>
          <EditListingForm
            listing={{
              id: listing.id,
              name: listing.name,
              description: listing.description,
              address: listing.address,
              phone: listing.phone,
              website: listing.website,
              operating_hours: listing.operating_hours,
            }}
          />
        </div>

        {/* Public listing link */}
        {isPublished && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#047857] text-lg">open_in_new</span>
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">View public listing</p>
                <p className="text-xs text-[#1C1917]/50">See how your listing looks to customers</p>
              </div>
            </div>
            <Link
              href={`/${listing.vertical === 'food' ? 'restaurant' : 'business'}/${listing.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-[#047857] hover:underline shrink-0"
            >
              View →
            </Link>
          </div>
        )}

        {/* Back link */}
        <div className="mt-6">
          <Link
            href="/business/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#1C1917]/50 hover:text-[#047857] transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
