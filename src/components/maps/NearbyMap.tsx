'use client'

import { haversineDistance, formatDistance } from '@/lib/maps/distance'

interface MapPin {
  id: string
  name: string
  lat: number
  lng: number
  slug: string
  halalStatus?: string
}

interface NearbyMapProps {
  pins: MapPin[]
  centerLat: number
  centerLng: number
  className?: string
}

/**
 * Cluster map of multiple listings with pins.
 * Renders as a list with distance + map link (no JS Maps SDK to avoid exposing API key).
 */
export function NearbyMap({ pins, centerLat, centerLng, className = '' }: NearbyMapProps) {
  const sortedPins = [...pins]
    .map((p) => ({
      ...p,
      distanceKm: haversineDistance(centerLat, centerLng, p.lat, p.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 10)

  const mapsQuery = encodeURIComponent(`halal food near ${centerLat},${centerLng}`)

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-charcoal text-sm">Nearby Listings</h3>
        <a
          href={`https://maps.google.com/?q=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          View on Google Maps →
        </a>
      </div>
      <ul className="divide-y divide-gray-50">
        {sortedPins.map((pin) => (
          <li key={pin.id}>
            <a
              href={`/restaurant/${pin.slug}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-warm-white transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-lg shrink-0">location_on</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-charcoal text-sm truncate">{pin.name}</p>
                {pin.halalStatus === 'muis_certified' && (
                  <span className="text-[10px] font-bold text-primary">MUIS Certified</span>
                )}
              </div>
              <span className="text-xs text-charcoal/50 shrink-0">{formatDistance(pin.distanceKm)}</span>
            </a>
          </li>
        ))}
      </ul>
      {sortedPins.length === 0 && (
        <div className="px-4 py-8 text-center text-charcoal/40 text-sm">
          No nearby listings found
        </div>
      )}
    </div>
  )
}
