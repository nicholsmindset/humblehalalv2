'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MuslimBadges } from '@/components/travel/MuslimBadges'
import type { MuslimEnrichment } from '@/lib/liteapi/enrich'
import { formatDistance } from '@/lib/liteapi/enrich'

interface HotelDetail {
  hotelId?: string
  id?: string
  name: string
  starRating?: number
  description?: string
  hotelImages?: { url: string; caption?: string }[]
  location?: {
    city?: string
    country?: string
    address?: string
    latitude?: string
    longitude?: string
  }
  facilities?: string[]
  guestReviews?: { rating?: number; count?: number }
  checkInTime?: string
  checkOutTime?: string
  rates?: any[]
}

interface Review {
  reviewId?: string
  rating?: number
  title?: string
  comment?: string
  reviewer?: string
  date?: string
}

export default function HotelDetailPage() {
  const { hotelId } = useParams() as { hotelId: string }
  const searchParams = useSearchParams()
  const [hotel, setHotel] = useState<HotelDetail | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [muslimEnrichment, setMuslimEnrichment] = useState<MuslimEnrichment | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/travel/hotel/${hotelId}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setHotel(data.hotel)
        setReviews(data.reviews ?? [])
        setMuslimEnrichment(data.muslimEnrichment ?? null)
      } catch {
        // handled by null check below
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [hotelId])

  const backParams = searchParams.toString()
  const checkin = searchParams.get('checkin') ?? ''
  const checkout = searchParams.get('checkout') ?? ''
  const guests = searchParams.get('guests') ?? '2'

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-8 bg-gray-100 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center text-charcoal/50">
        <span className="material-symbols-outlined text-5xl block mb-3">hotel_class</span>
        <p className="text-lg font-semibold">Hotel not found</p>
        <Link href={`/travel/hotels?${backParams}`} className="mt-4 text-sm text-primary hover:underline inline-block">
          ← Back to search
        </Link>
      </div>
    )
  }

  const images = hotel.hotelImages ?? []
  const lowestRate = hotel.rates?.reduce((best: any, r: any) => {
    const amount = r.retailRate?.total?.[0]?.amount ?? Infinity
    return amount < (best?.retailRate?.total?.[0]?.amount ?? Infinity) ? r : best
  }, null)
  const price = lowestRate?.retailRate?.total?.[0]
  const isRefundable = lowestRate?.cancellationPolicies?.cancelPolicyInfos?.[0]?.policy?.toLowerCase().includes('free') ?? false

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/travel" className="hover:text-primary">Travel</Link>
        <span className="mx-2">›</span>
        <Link href={`/travel/hotels?${backParams}`} className="hover:text-primary">Hotels</Link>
        <span className="mx-2">›</span>
        <span className="text-charcoal">{hotel.name}</span>
      </nav>

      {/* Image gallery */}
      {images.length > 0 && (
        <div className="mb-6">
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={images[activeImage]?.url}
              alt={images[activeImage]?.caption ?? hotel.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
              className="object-cover"
              priority
              unoptimized
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((p) => Math.max(0, p - 1))}
                  disabled={activeImage === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  onClick={() => setActiveImage((p) => Math.min(images.length - 1, p + 1))}
                  disabled={activeImage === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
                <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {images.slice(0, 8).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors relative ${
                    i === activeImage ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image src={img.url} alt="" fill sizes="64px" className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: hotel.starRating ?? 0 }).map((_, i) => (
                    <span key={i} className="text-accent text-sm">★</span>
                  ))}
                </div>
                <h1 className="text-2xl font-extrabold text-charcoal">{hotel.name}</h1>
                {hotel.location?.city && (
                  <p className="text-sm text-charcoal/50 mt-1">
                    <span className="material-symbols-outlined text-xs align-middle mr-0.5">location_on</span>
                    {hotel.location.address ? `${hotel.location.address}, ` : ''}{hotel.location.city}
                    {hotel.location.country && `, ${hotel.location.country}`}
                  </p>
                )}
              </div>
              {hotel.guestReviews?.rating && (
                <div className="text-right flex-shrink-0">
                  <div className="bg-primary text-white font-extrabold text-lg rounded-xl px-3 py-1">
                    {hotel.guestReviews.rating.toFixed(1)}
                  </div>
                  {hotel.guestReviews.count && (
                    <p className="text-xs text-charcoal/40 mt-1">{hotel.guestReviews.count.toLocaleString()} reviews</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Muslim-friendly enrichment */}
          {muslimEnrichment && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h2 className="font-bold text-charcoal text-sm mb-3 flex items-center gap-2">
                <span>☪️</span> Muslim-Friendly Info
              </h2>
              <MuslimBadges enrichment={muslimEnrichment} />
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                {muslimEnrichment.nearestMosqueName && (
                  <div>
                    <p className="text-charcoal/50">Nearest mosque</p>
                    <p className="font-semibold text-charcoal">{muslimEnrichment.nearestMosqueName}</p>
                    <p className="text-primary">{formatDistance(muslimEnrichment.nearestMosqueDistanceM)}</p>
                  </div>
                )}
                {muslimEnrichment.halalFoodCount > 0 && (
                  <div>
                    <p className="text-charcoal/50">Halal restaurants nearby</p>
                    <p className="font-semibold text-charcoal">{muslimEnrichment.halalFoodCount} within 1km</p>
                    <Link href={`/halal-food?area=${hotel.location?.city ?? ''}`} className="text-primary hover:underline">
                      Browse halal food →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {hotel.description && (
            <div>
              <h2 className="font-bold text-charcoal text-base mb-2">About this hotel</h2>
              <p className="text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">{hotel.description}</p>
            </div>
          )}

          {/* Facilities */}
          {hotel.facilities && hotel.facilities.length > 0 && (
            <div>
              <h2 className="font-bold text-charcoal text-base mb-3">Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {hotel.facilities.map((f, i) => (
                  <span key={i} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-charcoal/70">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="font-bold text-charcoal text-base mb-3">Guest reviews</h2>
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={r.reviewId ?? i} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-sm text-charcoal">{r.reviewer ?? 'Guest'}</p>
                        {r.date && <p className="text-xs text-charcoal/40">{new Date(r.date).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}</p>}
                      </div>
                      {r.rating && (
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                          {r.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {r.title && <p className="font-semibold text-sm text-charcoal mb-1">{r.title}</p>}
                    {r.comment && <p className="text-sm text-charcoal/70 line-clamp-4">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky booking panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24 space-y-4">
            {price ? (
              <>
                <div>
                  <p className="text-xs text-charcoal/40">from</p>
                  <p className="text-3xl font-extrabold text-primary">{price.currency} {price.amount.toLocaleString()}</p>
                  <p className="text-xs text-charcoal/40">/night · taxes included</p>
                </div>
                {isRefundable && (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Free cancellation available
                  </p>
                )}
                <Link
                  href={`/travel/hotels/${hotelId}/checkout?offerId=${lowestRate?.offerId ?? ''}&${searchParams.toString()}`}
                  className="block w-full text-center bg-accent text-charcoal font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors text-sm"
                >
                  Book now
                </Link>
              </>
            ) : (
              <div className="text-center py-4 text-charcoal/40">
                <p className="text-sm">Search for availability to see prices</p>
                <Link
                  href={`/travel/hotels?dest=${encodeURIComponent(hotel.location?.city ?? '')}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`}
                  className="mt-2 text-sm text-primary hover:underline inline-block"
                >
                  Search hotels →
                </Link>
              </div>
            )}

            {/* Check-in/out times */}
            {(hotel.checkInTime || hotel.checkOutTime) && (
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-xs">
                {hotel.checkInTime && (
                  <div>
                    <p className="text-charcoal/40">Check-in</p>
                    <p className="font-semibold text-charcoal">{hotel.checkInTime}</p>
                  </div>
                )}
                {hotel.checkOutTime && (
                  <div>
                    <p className="text-charcoal/40">Check-out</p>
                    <p className="font-semibold text-charcoal">{hotel.checkOutTime}</p>
                  </div>
                )}
              </div>
            )}

            {/* Flight nudge */}
            <div className="border-t border-gray-100 pt-3">
              <Link
                href="/travel/flights"
                className="flex items-center gap-2 text-xs text-charcoal/50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">flight</span>
                Also need flights? Find them here →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
