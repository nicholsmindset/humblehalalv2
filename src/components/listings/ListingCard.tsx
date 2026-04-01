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
}

const PRICE_LABELS: Record<number, string> = {
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
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
}: ListingCardProps) {
  const href = `/${vertical === 'food' ? 'restaurant' : vertical}/${slug}`
  const photo = photos?.[0]

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
      {/* Photo */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-emerald-50">
            <span className="material-symbols-outlined text-5xl text-primary/30">restaurant</span>
          </div>
        )}
        {is_featured && (
          <span className="absolute top-2 left-2 bg-accent text-charcoal text-[10px] font-bold px-2 py-0.5 rounded-full">
            FEATURED
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-charcoal text-sm leading-snug line-clamp-2">{name}</h3>
          {halal_status === HalalStatus.MuisCertified && (
            <MuisBadge className="shrink-0 text-[10px] px-2 py-0.5" label="MUIS" />
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
          <span className="text-charcoal/50 text-xs line-clamp-1">{area}</span>
        </div>

        {/* Halal badge (non-MUIS) */}
        {halal_status !== HalalStatus.MuisCertified && (
          <p className="text-charcoal/40 text-[10px]">
            {HALAL_STATUS_LABELS[halal_status]}
          </p>
        )}
      </div>
    </Link>
  )
}
