'use client'

// Singapore area centre coordinates
const AREA_CENTRES: Record<string, { lat: number; lng: number }> = {
  'arab-street':    { lat: 1.3024, lng: 103.8591 },
  tampines:         { lat: 1.3547, lng: 103.9441 },
  'jurong-east':    { lat: 1.3337, lng: 103.7424 },
  woodlands:        { lat: 1.4382, lng: 103.7891 },
  bugis:            { lat: 1.3009, lng: 103.8555 },
  bedok:            { lat: 1.3236, lng: 103.9273 },
  yishun:           { lat: 1.4304, lng: 103.8354 },
  orchard:          { lat: 1.3048, lng: 103.8318 },
  sengkang:         { lat: 1.3868, lng: 103.8915 },
  punggol:          { lat: 1.3984, lng: 103.9072 },
  hougang:          { lat: 1.3719, lng: 103.8929 },
  clementi:         { lat: 1.3151, lng: 103.7649 },
  'toa-payoh':      { lat: 1.3343, lng: 103.8474 },
  'geylang-serai':  { lat: 1.3163, lng: 103.8940 },
  bishan:           { lat: 1.3520, lng: 103.8483 },
  'little-india':   { lat: 1.3066, lng: 103.8518 },
  queenstown:       { lat: 1.2942, lng: 103.8078 },
  'buona-vista':    { lat: 1.3072, lng: 103.7901 },
  'kallang':        { lat: 1.3100, lng: 103.8700 },
  pasir_ris:        { lat: 1.3721, lng: 103.9493 },
  choa_chu_kang:    { lat: 1.3840, lng: 103.7470 },
  ang_mo_kio:       { lat: 1.3691, lng: 103.8454 },
  novena:           { lat: 1.3200, lng: 103.8436 },
  dhoby_ghaut:      { lat: 1.2988, lng: 103.8459 },
}

interface AreaMapProps {
  area: string
  className?: string
}

/**
 * District/area overview map centred on a Singapore area.
 * Uses Google Maps embed — no API key exposure.
 */
export function AreaMap({ area, className = '' }: AreaMapProps) {
  const centre = AREA_CENTRES[area.toLowerCase().replace(/\s+/g, '-')]
  const areaLabel = area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const query = centre
    ? `${centre.lat},${centre.lng}`
    : encodeURIComponent(`${areaLabel}, Singapore`)

  const embedSrc = `https://maps.google.com/maps?q=${query}&z=14&output=embed&hl=en`

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}>
      <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-sm">map</span>
        <span className="text-xs font-medium text-charcoal">{areaLabel}, Singapore</span>
      </div>
      <iframe
        title={`Map of ${areaLabel}, Singapore`}
        src={embedSrc}
        width="100%"
        height="200"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
