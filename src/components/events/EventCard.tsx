import Link from 'next/link'

export interface EventCardProps {
  slug: string
  title: string
  area?: string | null
  venue_name?: string | null
  starts_at: string
  ends_at?: string | null
  ticket_price?: number | null
  is_free?: boolean
  image_url?: string | null
  category?: string | null
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function EventCard({
  slug,
  title,
  area,
  venue_name,
  starts_at,
  ticket_price,
  is_free,
  image_url,
}: EventCardProps) {
  const startDate = new Date(starts_at)
  const day = startDate.getDate()
  const month = MONTHS[startDate.getMonth()]
  const weekday = WEEKDAYS[startDate.getDay()]
  const timeStr = startDate.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  const isFreeEvent = is_free || ticket_price === 0 || ticket_price === null

  return (
    <Link
      href={`/events/${slug}`}
      className="group flex bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
    >
      {/* Date sidebar */}
      <div
        className={`w-20 flex flex-col items-center justify-center text-white shrink-0 py-4 ${isFreeEvent ? 'bg-primary' : 'bg-accent'}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{weekday}</span>
        <span className="text-3xl font-extrabold leading-none my-0.5">{day}</span>
        <span className="text-xs font-bold uppercase tracking-wide opacity-80">{month}</span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 min-w-0">
        {/* Price + time row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isFreeEvent
                ? 'bg-primary/10 text-primary'
                : 'bg-accent/10 text-accent'
            }`}
          >
            {isFreeEvent ? 'Free' : `S$${ticket_price}`}
          </span>
          <div className="flex items-center gap-1 text-charcoal/40">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <span className="text-xs">{timeStr}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-charcoal text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Venue / area */}
        {(venue_name || area) && (
          <div className="flex items-center gap-1 mt-2">
            <span className="material-symbols-outlined text-charcoal/40 text-xs">location_on</span>
            <span className="text-charcoal/50 text-xs line-clamp-1 capitalize">
              {venue_name ?? area?.replace(/-/g, ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Image thumbnail (optional) */}
      {image_url && (
        <div className="w-20 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </Link>
  )
}
