'use client'

interface ListingMapProps {
  lat: number
  lng: number
  name: string
  address?: string
  className?: string
}

/**
 * Single listing location map — renders a Google Maps embed iframe.
 * Uses static embed API (no JS SDK required, no API key exposed to client).
 */
export function ListingMap({ lat, lng, name, address, className = '' }: ListingMapProps) {
  const query = encodeURIComponent(address ?? `${lat},${lng}`)
  const embedSrc = `https://maps.google.com/maps?q=${query}&z=16&output=embed&hl=en`

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}>
      <iframe
        title={`Map showing ${name}`}
        src={embedSrc}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 220 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-100">
        <span className="material-symbols-outlined text-primary text-sm">location_on</span>
        <span className="text-xs text-charcoal/70 truncate">{address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</span>
        <a
          href={`https://maps.google.com/?q=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 text-xs text-primary hover:underline font-medium"
        >
          Directions →
        </a>
      </div>
    </div>
  )
}
