import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Order Confirmation | HumbleHalal',
  robots: { index: false },
}

interface Props {
  params: Promise<{ slug: string; orderId: string }>
}

async function generateQRSVG(data: string): Promise<string> {
  return QRCode.toString(data, { type: 'svg', margin: 1, width: 200 })
}

export default async function ConfirmationPage({ params }: Props) {
  const { slug, orderId } = await params
  const supabase = await createClient()
  const db = supabase as any

  // Verify order belongs to this event
  const { data: order } = (await db
    .from('event_orders')
    .select('id, order_number, name, email, total_amount, status, created_at, event_id')
    .eq('id', orderId)
    .single()) as any

  if (!order || order.status === 'pending') notFound()

  // Verify event slug matches
  const { data: evt } = (await db
    .from('events')
    .select('id, title, slug, starts_at, ends_at, venue, area, is_online, online_platform')
    .eq('id', order.event_id)
    .single()) as any

  if (!evt || evt.slug !== slug) notFound()

  // Fetch order items with ticket info
  const { data: itemsRaw } = (await db
    .from('event_order_items')
    .select('id, qr_code, attendee_name, attendee_email, checked_in, status, ticket_id')
    .eq('order_id', orderId)
    .eq('status', 'active')) as any

  const items: any[] = itemsRaw ?? []

  // Fetch ticket names
  const ticketIds = Array.from(new Set(items.map((i: any) => i.ticket_id)))
  const { data: ticketRows } = (await db
    .from('event_tickets')
    .select('id, name, price')
    .in('id', ticketIds)) as any
  const ticketMap: Record<string, any> = {}
  for (const t of (ticketRows ?? [])) ticketMap[t.id] = t

  // Generate QR SVGs
  const qrSVGs: Record<string, string> = {}
  for (const item of items) {
    const ticketUrl = `${SITE_URL}/tickets/${item.qr_code}`
    qrSVGs[item.qr_code] = await generateQRSVG(ticketUrl)
  }

  const startDate = new Date(evt.starts_at).toLocaleDateString('en-SG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const startTime = new Date(evt.starts_at).toLocaleTimeString('en-SG', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
        </div>
        <h1 className="text-2xl font-extrabold text-charcoal">
          {order.total_amount === 0 ? 'Registration Confirmed!' : 'Payment Successful!'}
        </h1>
        <p className="text-charcoal/50 mt-2 text-sm">
          Your tickets have been sent to <strong>{order.email}</strong>
        </p>
        <p className="text-charcoal/30 text-xs mt-1">
          Order #{order.order_number}
        </p>
      </div>

      {/* Event info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-charcoal mb-3">{evt.title}</h2>
        <div className="space-y-1.5 text-sm text-charcoal/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
            {startDate} at {startTime}
          </div>
          {evt.venue && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              {evt.venue}
            </div>
          )}
          {evt.is_online && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">videocam</span>
              {evt.online_platform ?? 'Online event'} — link sent via email after registration
            </div>
          )}
        </div>
      </div>

      {/* E-tickets */}
      <h2 className="font-bold text-charcoal mb-4">
        Your Ticket{items.length !== 1 ? 's' : ''} ({items.length})
      </h2>

      <div className="space-y-4 mb-8">
        {items.map((item: any) => {
          const ticket = ticketMap[item.ticket_id]
          return (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
            >
              {/* Ticket header */}
              <div className="bg-primary px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{ticket?.name ?? 'Ticket'}</p>
                  <p className="text-white/70 text-xs">{evt.title}</p>
                </div>
                <span className="material-symbols-outlined text-white/80 text-2xl">
                  confirmation_number
                </span>
              </div>

              {/* QR code + details */}
              <div className="p-5 flex gap-5 items-start">
                <div
                  className="shrink-0 w-32 h-32 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: qrSVGs[item.qr_code] ?? '' }}
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">Attendee</p>
                    <p className="text-sm font-medium text-charcoal">{item.attendee_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">Date</p>
                    <p className="text-sm text-charcoal">{startDate}</p>
                  </div>
                  {evt.venue && (
                    <div>
                      <p className="text-xs text-charcoal/40 uppercase tracking-wider">Venue</p>
                      <p className="text-sm text-charcoal truncate">{evt.venue}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">Price</p>
                    <p className="text-sm font-bold text-charcoal">
                      {ticket?.price === 0 ? 'Free' : `SGD ${ticket?.price?.toFixed(2) ?? '—'}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-charcoal/40 font-mono truncate">{item.qr_code}</p>
                <Link
                  href={`/tickets/${item.qr_code}`}
                  className="text-xs text-primary font-medium hover:underline shrink-0 ml-3"
                >
                  View ticket →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add to calendar (ICS download) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-charcoal text-sm mb-3">Save to Calendar</h3>
        <a
          href={`/api/events/${evt.id}/calendar.ics`}
          className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
        >
          <span className="material-symbols-outlined text-base">calendar_add_on</span>
          Download .ics calendar file
        </a>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/events/${evt.slug}`}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-charcoal rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Event
        </Link>
        <Link
          href="/dashboard/my-tickets"
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">confirmation_number</span>
          My Tickets
        </Link>
      </div>

      <p className="text-center text-xs text-charcoal/30 mt-6">
        A confirmation email has been sent to {order.email}. Screenshot your QR codes as backup.
      </p>
    </div>
  )
}
