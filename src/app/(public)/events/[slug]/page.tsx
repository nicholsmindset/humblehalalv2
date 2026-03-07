import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SITE_URL } from '@/config'
import TicketSelector from '@/components/events/TicketSelector'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: evt } = (await supabase
    .from('events')
    .select('title, area, description, starts_at')
    .eq('slug', slug)
    .single()) as any

  if (!evt) return { title: 'Event Not Found' }

  const date = new Date(evt.starts_at).toLocaleDateString('en-SG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  return {
    title: `${evt.title} — Halal Event in Singapore | HumbleHalal`,
    description: evt.description?.slice(0, 155) ?? `${evt.title} on ${date}${evt.area ? ` in ${evt.area}` : ''}, Singapore.`,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const db = supabase as any

  const { data: evt } = (await db
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()) as any

  if (!evt) notFound()

  const start = new Date(evt.starts_at)
  const end = evt.ends_at ? new Date(evt.ends_at) : null
  const dateStr = start.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const startTime = start.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  const endTime = end?.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  const isPast = end ? end < new Date() : start < new Date()

  // Fetch ticket tiers if ticketed event
  let tickets: any[] = []
  if (evt.is_ticketed) {
    const { data } = (await db
      .from('event_tickets')
      .select('id, name, description, price, quantity, sold_count, sale_start, sale_end, is_active')
      .eq('event_id', evt.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('price', { ascending: true })) as any
    tickets = data ?? []
  }

  const lowestPrice = tickets.length > 0
    ? Math.min(...tickets.map((t: any) => t.price))
    : null
  const allSoldOut = tickets.length > 0 && tickets.every((t: any) => t.quantity - t.sold_count <= 0)

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/events" className="hover:text-primary">Events</Link>
        <span className="mx-2">›</span>
        <span className="text-charcoal">{evt.title}</span>
      </nav>

      {/* Banner image */}
      {evt.images?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={evt.images[0]}
          alt={evt.title}
          className="w-full h-64 object-cover rounded-xl mb-8"
        />
      )}

      <header className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-3xl font-extrabold text-charcoal font-sans flex-1">{evt.title}</h1>
          {isPast && (
            <span className="bg-gray-100 text-charcoal/50 text-xs font-medium px-3 py-1 rounded-full">
              Past event
            </span>
          )}
          {evt.is_ticketed && !isPast && (
            allSoldOut ? (
              <span className="bg-gray-100 text-charcoal/50 text-xs font-bold px-3 py-1 rounded-full">
                SOLD OUT
              </span>
            ) : lowestPrice === 0 ? (
              <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">FREE</span>
            ) : lowestPrice != null ? (
              <span className="bg-accent/20 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                From SGD {lowestPrice.toFixed(2)}
              </span>
            ) : null
          )}
          {!evt.is_ticketed && evt.price_type === 'free' && !isPast && (
            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">FREE</span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">calendar_month</span>
            {dateStr}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            {startTime}{endTime ? ` — ${endTime}` : ''}
          </span>
          {evt.area && (
            <span className="flex items-center gap-1 capitalize">
              <span className="material-symbols-outlined text-base">location_on</span>
              {evt.area.replace(/-/g, ' ')}, Singapore
            </span>
          )}
          {evt.is_online && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">videocam</span>
              Online event
            </span>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {evt.description && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">About this Event</h2>
              <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">{evt.description}</p>
            </section>
          )}

          {evt.venue && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Venue</h2>
              <p className="text-charcoal/70">{evt.venue}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.venue + ' Singapore')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline mt-2"
              >
                <span className="material-symbols-outlined text-sm">directions</span>
                Get directions
              </a>
            </section>
          )}

          {evt.organiser && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Organiser</h2>
              <p className="text-charcoal/70">{evt.organiser}</p>
            </section>
          )}

          {evt.refund_policy && evt.refund_policy !== 'no_refund' && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Refund Policy</h2>
              <p className="text-charcoal/60 text-sm">
                {evt.refund_policy === 'full_refund' && 'Full refunds available upon request.'}
                {evt.refund_policy === 'partial' && 'Partial refunds may be available.'}
                {evt.refund_policy === 'custom' && (evt.refund_policy_text ?? '')}
              </p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {evt.is_ticketed ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-bold text-charcoal text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">confirmation_number</span>
                Tickets
              </h2>
              <TicketSelector
                eventId={evt.id}
                eventSlug={evt.slug}
                tickets={tickets}
                isPast={isPast}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <p className="text-xs text-charcoal/40 uppercase tracking-wide font-medium mb-1">Date & Time</p>
                <p className="text-sm text-charcoal font-medium">{dateStr}</p>
                <p className="text-sm text-charcoal/60">{startTime}{endTime ? ` — ${endTime}` : ''}</p>
              </div>
              {evt.venue && (
                <div>
                  <p className="text-xs text-charcoal/40 uppercase tracking-wide font-medium mb-1">Location</p>
                  <p className="text-sm text-charcoal">{evt.venue}</p>
                </div>
              )}
              {evt.ticket_url && !isPast && (
                <a
                  href={evt.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-accent text-charcoal rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-accent/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">confirmation_number</span>
                  Get Tickets
                </a>
              )}
              {evt.venue && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.venue + ' Singapore')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-primary text-primary rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">directions</span>
                  Get Directions
                </a>
              )}
            </div>
          )}

          <Link
            href="/events"
            className="flex items-center gap-2 text-charcoal/50 text-sm hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            All events
          </Link>
        </aside>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: evt.title,
            description: evt.description,
            startDate: evt.starts_at,
            endDate: evt.ends_at,
            eventAttendanceMode: evt.is_online
              ? 'https://schema.org/OnlineEventAttendanceMode'
              : 'https://schema.org/OfflineEventAttendanceMode',
            location: evt.venue
              ? {
                  '@type': 'Place',
                  name: evt.venue,
                  address: { '@type': 'PostalAddress', addressLocality: evt.area, addressCountry: 'SG' },
                }
              : undefined,
            organizer: evt.organiser ? { '@type': 'Organization', name: evt.organiser } : undefined,
            isAccessibleForFree: lowestPrice === 0 || evt.price_type === 'free',
            offers: tickets.length > 0
              ? tickets.map((t: any) => ({
                  '@type': 'Offer',
                  name: t.name,
                  price: t.price.toFixed(2),
                  priceCurrency: 'SGD',
                  availability: t.quantity - t.sold_count > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/SoldOut',
                  url: `${SITE_URL}/events/${evt.slug}`,
                }))
              : undefined,
            url: `${SITE_URL}/events/${evt.slug}`,
          }),
        }}
      />
    </article>
  )
}
