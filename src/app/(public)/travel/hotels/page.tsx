'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { HotelSearchBar } from '@/components/travel/HotelSearchBar'
import { HotelCard } from '@/components/travel/HotelCard'
import type { MuslimEnrichment } from '@/lib/liteapi/enrich'
import Link from 'next/link'

interface Hotel {
  hotelId?: string
  id?: string
  name: string
  starRating?: number
  imageUrl?: string | null
  rates?: { retailRate?: { total?: [{ amount: number; currency: string }] }; cancellationPolicies?: { cancelPolicyInfos?: { policy: string }[] } }[]
  location?: { city?: string; address?: string }
  guestRating?: number | null
  reviewCount?: number
  muslimEnrichment: MuslimEnrichment | null
}

// Shared filter panel used in both sidebar and mobile drawer
function FilterPanel({
  muslimOnly,
  setMuslimOnly,
  minStars,
  setMinStars,
  sortBy,
  setSortBy,
}: {
  muslimOnly: boolean
  setMuslimOnly: (v: boolean) => void
  minStars: number
  setMinStars: (v: number) => void
  sortBy: 'price' | 'rating' | 'muslim'
  setSortBy: (v: 'price' | 'rating' | 'muslim') => void
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-bold text-charcoal text-sm">Filters</h2>

      {/* Muslim-friendly toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={muslimOnly}
            onChange={(e) => setMuslimOnly(e.target.checked)}
            className="accent-primary w-5 h-5"
          />
          <span className="text-sm text-charcoal font-semibold">Muslim-Friendly Only</span>
        </label>
        <p className="text-xs text-charcoal/40 mt-1 ml-7">Score ≥ 3/5</p>
      </div>

      {/* Star rating */}
      <div>
        <p className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-2">Min. Stars</p>
        <div className="flex gap-1">
          {[0, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setMinStars(s)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[44px] ${
                minStars === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-charcoal/60 border-gray-200 hover:border-primary/40'
              }`}
            >
              {s === 0 ? 'All' : `${s}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-2">Sort by</p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary bg-white min-h-[44px]"
        >
          <option value="price">Lowest price</option>
          <option value="rating">Best rated</option>
          <option value="muslim">Most Muslim-friendly</option>
        </select>
      </div>
    </div>
  )
}

function HotelSearchContent() {
  const searchParams = useSearchParams()
  const dest = searchParams.get('dest') ?? ''
  const checkin = searchParams.get('checkin') ?? ''
  const checkout = searchParams.get('checkout') ?? ''
  const guestsParam = parseInt(searchParams.get('guests') ?? '2')

  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [muslimOnly, setMuslimOnly] = useState(false)
  const [minStars, setMinStars] = useState(0)
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'muslim'>('price')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const search = useCallback(async () => {
    if (!dest || !checkin || !checkout) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/travel/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest,
          checkin,
          checkout,
          guests: [{ adults: guestsParam, children: 0, childAges: [] }],
        }),
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setHotels(data.hotels ?? [])
    } catch {
      setError('Hotel search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [dest, checkin, checkout, guestsParam])

  useEffect(() => { search() }, [search])

  // Filter + sort
  const filtered = hotels
    .filter((h) => {
      if (muslimOnly && (!h.muslimEnrichment || h.muslimEnrichment.muslimFriendlyScore < 3)) return false
      if (minStars && (h.starRating ?? 0) < minStars) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'muslim') {
        return (b.muslimEnrichment?.muslimFriendlyScore ?? 0) - (a.muslimEnrichment?.muslimFriendlyScore ?? 0)
      }
      if (sortBy === 'rating') {
        return (b.guestRating ?? 0) - (a.guestRating ?? 0)
      }
      // price
      const priceA = a.rates?.[0]?.retailRate?.total?.[0]?.amount ?? Infinity
      const priceB = b.rates?.[0]?.retailRate?.total?.[0]?.amount ?? Infinity
      return priceA - priceB
    })

  const passThrough = searchParams.toString()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <div className="mb-8">
        <HotelSearchBar
          defaultDestination={dest}
          defaultCheckin={checkin}
          defaultCheckout={checkout}
          defaultGuests={guestsParam}
        />
      </div>

      <div className="flex gap-6">
        {/* Desktop filters sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
            <FilterPanel
              muslimOnly={muslimOnly}
              setMuslimOnly={setMuslimOnly}
              minStars={minStars}
              setMinStars={setMinStars}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="min-w-0">
              {dest && (
                <h1 className="text-xl font-extrabold text-charcoal truncate">
                  Hotels in {dest}
                </h1>
              )}
              {!loading && (
                <p className="text-sm text-charcoal/50">
                  {filtered.length} {filtered.length === 1 ? 'hotel' : 'hotels'} found
                  {checkin && checkout && ` · ${checkin} — ${checkout}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile filter button — hidden on lg */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-xs text-charcoal font-semibold border border-gray-200 rounded-full px-3 py-2 hover:border-primary transition-colors min-h-[44px]"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                Filters
                {(muslimOnly || minStars > 0) && (
                  <span className="bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {(muslimOnly ? 1 : 0) + (minStars > 0 ? 1 : 0)}
                  </span>
                )}
              </button>
              {/* Flight affiliate nudge */}
              <Link
                href="/travel/flights"
                className="hidden sm:flex items-center gap-1.5 text-xs text-primary font-semibold border border-primary/20 rounded-full px-3 py-2 hover:bg-emerald-50 transition-colors min-h-[44px]"
              >
                <span className="material-symbols-outlined text-sm">flight</span>
                Need flights?
              </Link>
            </div>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={search}
                className="mt-3 text-sm text-primary font-semibold hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && hotels.length > 0 && (
            <div className="text-center py-12 text-charcoal/50">
              <span className="material-symbols-outlined text-4xl block mb-2">filter_alt_off</span>
              <p className="font-semibold">No hotels match your filters</p>
              <button onClick={() => { setMuslimOnly(false); setMinStars(0) }} className="mt-2 text-sm text-primary hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && !dest && (
            <div className="text-center py-16 text-charcoal/40">
              <span className="material-symbols-outlined text-5xl block mb-3">travel_explore</span>
              <p className="text-lg font-semibold">Search for Muslim-friendly hotels</p>
              <p className="text-sm mt-1">Enter a destination to see hotels with halal food, mosques, and prayer rooms nearby</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((h) => {
                const id = h.hotelId ?? h.id ?? ''
                const rate = h.rates?.[0]
                const price = rate?.retailRate?.total?.[0]
                const cancellation = rate?.cancellationPolicies?.cancelPolicyInfos?.[0]?.policy
                return (
                  <HotelCard
                    key={id}
                    hotelId={id}
                    name={h.name}
                    stars={h.starRating ?? 0}
                    imageUrl={h.imageUrl ?? null}
                    pricePerNight={price ? price.amount : null}
                    currency={price?.currency ?? 'SGD'}
                    city={h.location?.city ?? ''}
                    address={h.location?.address ?? ''}
                    reviewRating={h.guestRating ?? null}
                    reviewCount={h.reviewCount ?? null}
                    isRefundable={cancellation?.toLowerCase().includes('free') ?? false}
                    muslimEnrichment={h.muslimEnrichment}
                    searchParams={passThrough}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer — slides in from bottom */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog" aria-label="Filters">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-charcoal text-base">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-charcoal/40 hover:text-charcoal min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close filters"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <FilterPanel
              muslimOnly={muslimOnly}
              setMuslimOnly={setMuslimOnly}
              minStars={minStars}
              setMinStars={setMinStars}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full mt-6 bg-primary text-white rounded-xl py-3 font-bold text-sm min-h-[44px]"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HotelSearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-charcoal/40">
        <span className="material-symbols-outlined text-4xl block mb-2 animate-pulse">travel_explore</span>
        <p>Loading hotels…</p>
      </div>
    }>
      <HotelSearchContent />
    </Suspense>
  )
}
