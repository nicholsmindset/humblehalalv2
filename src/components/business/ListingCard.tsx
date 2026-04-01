import Link from 'next/link'

type HalalStatus = 'muis_certified' | 'muslim_owned' | 'self_declared' | 'not_applicable'
type ListingStatus = 'active' | 'pending' | 'archived' | 'flagged'

interface ListingCardProps {
  id: string
  name: string
  vertical: string
  area: string
  halal_status: HalalStatus
  status: ListingStatus
}

const HALAL_BADGE: Record<HalalStatus, { label: string; className: string }> = {
  muis_certified: {
    label: 'MUIS Certified',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  muslim_owned: {
    label: 'Muslim Owned',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  self_declared: {
    label: 'Self Declared',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  not_applicable: {
    label: 'Not Applicable',
    className: 'bg-gray-100 text-gray-500 border border-gray-200',
  },
}

const VERTICAL_ICON: Record<string, string> = {
  food: 'restaurant',
  business: 'store',
  catering: 'dining',
  service_provider: 'handyman',
  mosque: 'mosque',
  product: 'inventory_2',
  prayer_room: 'self_improvement',
}

export function ListingCard({ id, name, vertical, area, halal_status, status }: ListingCardProps) {
  const halal = HALAL_BADGE[halal_status] ?? HALAL_BADGE.not_applicable
  const icon = VERTICAL_ICON[vertical] ?? 'store'
  const isPublished = status === 'active'

  return (
    <Link
      href={`/business/dashboard/listings/${id}`}
      className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all p-5 flex items-start gap-4"
    >
      {/* Icon */}
      <div className="w-11 h-11 bg-[#047857]/10 rounded-xl flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#047857] text-xl">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#1C1917] text-sm leading-tight group-hover:text-[#047857] transition-colors truncate">
            {name}
          </h3>
          {/* Published/Draft dot */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
            <span className={`text-xs font-medium ${isPublished ? 'text-emerald-600' : 'text-gray-400'}`}>
              {isPublished ? 'Published' : status === 'pending' ? 'Pending' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Vertical */}
          <span className="text-xs bg-gray-100 text-[#1C1917]/60 px-2 py-0.5 rounded-full capitalize">
            {vertical.replace('_', ' ')}
          </span>

          {/* Area */}
          <span className="flex items-center gap-0.5 text-xs text-[#1C1917]/50">
            <span className="material-symbols-outlined text-xs" style={{ fontSize: '13px' }}>
              location_on
            </span>
            {area}
          </span>

          {/* Halal status */}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${halal.className}`}>
            {halal.label}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <span className="material-symbols-outlined text-gray-300 group-hover:text-[#047857] transition-colors shrink-0 mt-0.5">
        chevron_right
      </span>
    </Link>
  )
}
