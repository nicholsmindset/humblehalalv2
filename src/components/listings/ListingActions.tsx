'use client'

import { track } from '@/lib/analytics/tracker'

interface Listing {
  id: string
  name: string
  area: string
  address: string
  phone?: string
  website?: string
  menu_url?: string
  cuisine_type?: string
}

interface Props {
  listing: Listing
}

export function ListingActions({ listing }: Props) {
  const mapsQuery = encodeURIComponent(`${listing.name} ${listing.address}`)

  function handleWebsite() {
    track.clickWebsite({ listing_id: listing.id, listing_name: listing.name, listing_area: listing.area, listing_category: listing.cuisine_type })
  }

  function handleDirections() {
    track.clickDirections({ listing_id: listing.id, listing_name: listing.name, listing_area: listing.area })
  }

  function handlePhone() {
    track.clickPhone({ listing_id: listing.id, listing_name: listing.name, listing_area: listing.area })
  }

  function handleMenu() {
    track.clickMenu({ listing_id: listing.id, listing_name: listing.name })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      {/* Address */}
      <div className="flex gap-2 text-sm text-charcoal/70">
        <span className="material-symbols-outlined text-charcoal/40 shrink-0">location_on</span>
        <span>{listing.address}, {listing.area}, Singapore</span>
      </div>

      {/* CTA buttons */}
      <div className="space-y-2 pt-2">
        {listing.website && (
          <a
            href={listing.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWebsite}
            className="flex items-center justify-center gap-2 w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Visit Website
          </a>
        )}

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDirections}
          className="flex items-center justify-center gap-2 w-full border border-primary text-primary rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-base">directions</span>
          Get Directions
        </a>

        {listing.phone && (
          <a
            href={`tel:${listing.phone}`}
            onClick={handlePhone}
            className="flex items-center justify-center gap-2 w-full border border-gray-200 text-charcoal rounded-lg px-4 py-2.5 text-sm font-medium hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">call</span>
            {listing.phone}
          </a>
        )}

        {listing.menu_url && (
          <a
            href={listing.menu_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleMenu}
            className="flex items-center justify-center gap-2 w-full border border-gray-200 text-charcoal rounded-lg px-4 py-2.5 text-sm font-medium hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">menu_book</span>
            View Menu
          </a>
        )}
      </div>
    </div>
  )
}
