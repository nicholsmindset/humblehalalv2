import Link from 'next/link'
import { MuslimBadges } from './MuslimBadges'
import type { MuslimEnrichment } from '@/lib/liteapi/enrich'

interface HotelCardProps {
  hotelId: string
  name: string
  stars: number
  imageUrl: string | null
  pricePerNight: number | null
  currency: string
  city: string
  address: string
  reviewRating: number | null
  reviewCount: number | null
  isRefundable: boolean
  muslimEnrichment: MuslimEnrichment | null
  searchParams: string // pass-through for back navigation
}

export function HotelCard({
  hotelId,
  name,
  stars,
  imageUrl,
  pricePerNight,
  currency,
  city,
  address,
  reviewRating,
  reviewCount,
  isRefundable,
  muslimEnrichment,
  searchParams,
}: HotelCardProps) {
  const href = `/travel/hotels/${hotelId}?${searchParams}`

  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col sm:flex-row"
    >
      {/* Image */}
      <div className="sm:w-48 sm:flex-shrink-0 h-48 sm:h-auto relative bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-gray-300">hotel</span>
          </div>
        )}
        {isRefundable && (
          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Free cancellation
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
        {/* Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className="text-accent text-xs">★</span>
          ))}
        </div>

        {/* Name */}
        <h3 className="font-bold text-charcoal text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {name}
        </h3>

        {/* Location */}
        <p className="text-xs text-charcoal/50 line-clamp-1">
          <span className="material-symbols-outlined text-xs align-middle mr-0.5">location_on</span>
          {city}{address ? ` · ${address}` : ''}
        </p>

        {/* Muslim badges */}
        {muslimEnrichment && muslimEnrichment.badges.length > 0 && (
          <MuslimBadges enrichment={muslimEnrichment} compact />
        )}

        {/* Bottom row */}
        <div className="flex items-end justify-between mt-auto pt-1">
          <div>
            {reviewRating !== null && (
              <span className="text-xs text-charcoal/60">
                <span className="font-bold text-charcoal text-sm">{reviewRating.toFixed(1)}</span>
                {reviewCount !== null && ` (${reviewCount.toLocaleString()} reviews)`}
              </span>
            )}
          </div>
          <div className="text-right">
            {pricePerNight !== null ? (
              <>
                <p className="text-xs text-charcoal/40">from</p>
                <p className="font-extrabold text-primary text-lg leading-none">
                  {currency} {pricePerNight.toLocaleString()}
                </p>
                <p className="text-xs text-charcoal/40">/night</p>
              </>
            ) : (
              <p className="text-sm text-charcoal/40">Check price</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
