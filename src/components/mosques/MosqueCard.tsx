import Link from 'next/link'

export interface MosqueCardProps {
  slug: string
  name: string
  area: string
  address?: string
  facilities?: string[]
  capacity?: number | null
  wheelchair_accessible?: boolean
  prayer_room_available?: boolean
  distance_m?: number | null
}

const FACILITY_LABELS: Record<string, { label: string; icon: string }> = {
  parking: { label: 'Parking', icon: 'local_parking' },
  wudu: { label: 'Wudhu', icon: 'water_drop' },
  wheelchair: { label: 'Wheelchair', icon: 'accessible' },
  library: { label: 'Library', icon: 'menu_book' },
  madrasah: { label: 'Madrasah', icon: 'school' },
  kindergarten: { label: 'Kindergarten', icon: 'child_care' },
  childcare: { label: 'Childcare', icon: 'family_restroom' },
  prayer_room: { label: 'Prayer Room', icon: 'mosque' },
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m away`
  return `${(m / 1000).toFixed(1)}km away`
}

export function MosqueCard({
  slug,
  name,
  area,
  address,
  facilities = [],
  capacity,
  wheelchair_accessible,
  prayer_room_available,
  distance_m,
}: MosqueCardProps) {
  const displayFacilities = facilities.slice(0, 4)

  return (
    <Link
      href={`/mosque/${slug}`}
      className="group flex items-start gap-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all p-4"
    >
      {/* Icon */}
      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary text-2xl">mosque</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-charcoal text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {name}
          </h3>
          {distance_m !== null && distance_m !== undefined && (
            <span className="text-[10px] text-charcoal/40 whitespace-nowrap shrink-0">
              {formatDistance(distance_m)}
            </span>
          )}
        </div>

        {/* Area */}
        <div className="flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-charcoal/40 text-xs">location_on</span>
          <span className="text-charcoal/50 text-xs capitalize">{area?.replace(/-/g, ' ')}, Singapore</span>
        </div>

        {address && (
          <p className="text-charcoal/40 text-xs mt-0.5 line-clamp-1">{address}</p>
        )}

        {/* Facility pills */}
        {displayFacilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {wheelchair_accessible && (
              <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[10px]">accessible</span>
                Wheelchair
              </span>
            )}
            {prayer_room_available && (
              <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[10px]">wc</span>
                Prayer Room
              </span>
            )}
            {displayFacilities.map((f) => {
              const meta = FACILITY_LABELS[f]
              if (!meta || f === 'wheelchair' || f === 'prayer_room') return null
              return (
                <span
                  key={f}
                  className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full"
                >
                  <span className="material-symbols-outlined text-[10px]">{meta.icon}</span>
                  {meta.label}
                </span>
              )
            })}
            {capacity && (
              <span className="text-[10px] text-charcoal/40 px-2 py-0.5 rounded-full bg-gray-100">
                {capacity.toLocaleString()} capacity
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
