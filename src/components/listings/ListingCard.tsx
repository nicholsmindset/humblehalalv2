'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MuisBadge } from '@/components/ui/MuisBadge'
import { track } from '@/lib/analytics/tracker'
import { HalalStatus, HALAL_STATUS_LABELS } from '@/config'

export interface ListingCardProps {
  id: string
  slug: string
  name: string
  vertical: string
  cuisine_types?: string[]
  area: string
  address: string
  halal_status: HalalStatus
  avg_rating: number
  review_count: number
  photos?: string[]
  price_range?: number | null
  is_featured?: boolean
  category?: string
  // Stitch additions
  operating_hours?: Record<string, string> | null
  delivery_platforms?: string[] | null
}

const PRICE_LABELS: Record<number, string> = {
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
}

function isOpenNow(hours: Record<string, string>): boolean | null {
  try {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const now = new Date()
    const dayKey = days[now.getDay()]
    const hoursStr = hours[dayKey]
    if (!hoursStr || hoursStr.toLowerCase() === 'closed') return false
    const [open, close] = hoursStr.split('-').map((t) => {
      const [h, m] = t.trim().split(':').map(Number)
      return h * 60 + (m || 0)
    })
    const nowMin = now.getHours() * 60 + now.getMinutes()
    return nowMin >= open && nowMin < close
  } catch {
    return null
  }
}

export function ListingCard({
  id,
  slug,
  name,
  vertical,
  cuisine_types,
  area,
  halal_status,
  avg_rating,
  review_count,
  photos,
  price_range,
  is_featured,
  category,
  operating_hours,
  delivery_platforms,
}: ListingCardProps) {
  const href = `/${vertical === 'food' ? 'restaurant' : vertical}/${slug}`
  const photo = photos?.[0]
  const openStatus = operating_hours ? isOpenNow(operating_hours) : null
  const hasDelivery = delivery_platforms && delivery_platforms.length > 0

  function handleView() {
    track.viewListing({
      listing_id: id,
      listing_name: name,
      listing_category: category ?? cuisine_types?.[0],
      listing_area: area,
    })
  }

  return (
    <Link
      href={href}
      onClick={handleView}
      className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
    >
      {/* Photo — fix 1: h-48, fix 2: gradient placeholder, fix 3: heart button */}
      <div className="relative h-48 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-emerald-100 to-emerald-50">
            <span className="material-symbols-outlined text-5xl text-primary/30">restaurant</span>
          </div>
        )}
        {is_featured && (
          <span className="absolute top-2 left-2 bg-accent text-charcoal text-[10px] font-bold px-2 py-0.5 rounded-full">
            FEATURED
          </span>
        )}
        {/* Heart / favourite button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-white transition-colors shadow-sm"
          aria-label="Save to favourites"
        >
          <span className="material-symbols-outlined text-charcoal/50 text-base">favorite_border</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-charcoal text-sm leading-snug line-clamp-2">{name}</h3>
          {/* fix 4: multiple halal badge variants */}
          {halal_status === HalalStatus.MuisCertified && (
            <MuisBadge className="shrink-0 text-[10px] px-2 py-0.5" label="MUIS" />
          )}
          {halal_status === HalalStatus.MuslimOwned && (
            <span className="shrink-0 bg-emerald-50 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              Muslim Owned
            </span>
          )}
        </div>

        {/* Cuisine + price */}
        {(cuisine_types?.length || price_range) && (
          <p className="text-charcoal/50 text-xs">
            {cuisine_types?.slice(0, 2).join(' · ')}
            {price_range ? ` · ${PRICE_LABELS[price_range]}` : ''}
          </p>
        )}

        {/* Rating */}
        {review_count > 0 && (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-accent text-sm">star</span>
            <span className="text-xs font-bold text-charcoal">{avg_rating.toFixed(1)}</span>
            <span className="text-charcoal/40 text-xs">({review_count})</span>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 mt-auto pt-1">
          <span className="material-symbols-outlined text-charcoal/40 text-sm">location_on</span>
          <span className="text-charcoal/50 text-xs line-clamp-1 capitalize">{area?.replace(/-/g, ' ')}</span>
        </div>

        {/* fix 5: Open now / Closed hours indicator */}
        {openStatus !== null && (
          <p className={`text-[10px] font-bold ${openStatus ? 'text-primary' : 'text-red-500'}`}>
            {openStatus ? 'Open now' : 'Closed'}
          </p>
        )}

        {/* fix 6: Delivery badge */}
        {hasDelivery && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-xs">delivery_dining</span>
            Delivery
          </span>
        )}

        {/* Halal badge (non-MUIS, non-Muslim-Owned) */}
        {halal_status !== HalalStatus.MuisCertified && halal_status !== HalalStatus.MuslimOwned && (
          <p className="text-charcoal/40 text-[10px]">
            {HALAL_STATUS_LABELS[halal_status]}
          </p>
        )}
      </div>
    </Link>
  )
}
