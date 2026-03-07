import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Ticket | HumbleHalal',
  robots: { index: false },
}

interface Props {
  params: Promise<{ qrCode: string }>
}

export default async function TicketPage({ params }: Props) {
  const { qrCode } = await params
  const supabase = await createClient()
  const db = supabase as any

  const { data: item } = (await db
    .from('event_order_items')
    .select('id, qr_code, attendee_name, attendee_email, checked_in, checked_in_at, status, order_id, ticket_id')
    .eq('qr_code', qrCode)
    .single()) as any

  if (!item || item.status === 'cancelled') notFound()

  const { data: order } = (await db
    .from('event_orders')
    .select('order_number, event_id, status')
    .eq('id', item.order_id)
    .single()) as any

  if (!order || order.status !== 'completed') notFound()

  const { data: evt } = (await db
    .from('events')
    .select('id, title, slug, starts_at, ends_at, venue, area, is_online, online_platform, organiser')
    .eq('id', order.event_id)
    .single()) as any

  const { data: ticket } = (await db
    .from('event_tickets')
    .select('name, price')
    .eq('id', item.ticket_id)
    .single()) as any

  const ticketUrl = `${SITE_URL}/tickets/${qrCode}`
  const qrSVG = await QRCode.toString(ticketUrl, { type: 'svg', margin: 1, width: 240 })

  const startDate = evt
    ? new Date(evt.starts_at).toLocaleDateString('en-SG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'
  const startTime = evt
    ? new Date(evt.starts_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
    : ''

  const isPast = evt ? new Date(evt.ends_at ?? evt.starts_at) < new Date() : false

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      {/* Ticket card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
        {/* Header */}
        <div className={`px-6 py-4 ${item.checked_in ? 'bg-gray-400' : 'bg-primary'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider">
                {item.checked_in ? 'Already Used' : 'Valid Ticket'}
              </p>
              <p className="text-white font-extrabold text-lg leading-tight mt-0.5">
                {ticket?.name ?? 'Ticket'}
              </p>
            </div>
            <span className="material-symbols-outlined text-white/80 text-3xl">
              {item.checked_in ? 'check_circle' : 'confirmation_number'}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center py-8 px-6 bg-white">
          <div
            className="w-48 h-48 rounded-xl overflow-hidden border border-gray-100"
            dangerouslySetInnerHTML={{ __html: qrSVG }}
          />
          {item.checked_in && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-charcoal/50">
              <span className="material-symbols-outlined text-base text-green-500">check_circle</span>
              Checked in
              {item.checked_in_at && (
                <span className="text-xs">
                  {new Date(item.checked_in_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider with dashes */}
        <div className="flex items-center px-4 -my-2">
          <div className="h-px flex-1 border-t border-dashed border-gray-200" />
        </div>

        {/* Event details */}
        <div className="px-6 py-5 space-y-3">
          {evt && (
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider">Event</p>
              <p className="font-bold text-charcoal text-sm leading-snug">{evt.title}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider">Date</p>
              <p className="text-xs text-charcoal font-medium">{startDate}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider">Time</p>
              <p className="text-xs text-charcoal font-medium">{startTime}</p>
            </div>
            {evt?.venue && (
              <div className="col-span-2">
                <p className="text-xs text-charcoal/40 uppercase tracking-wider">Venue</p>
                <p className="text-xs text-charcoal font-medium">{evt.venue}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider">Attendee</p>
              <p className="text-xs text-charcoal font-medium">{item.attendee_name}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider">Price</p>
              <p className="text-xs text-charcoal font-medium">
                {ticket?.price === 0 ? 'Free' : `SGD ${ticket?.price?.toFixed(2) ?? '—'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-charcoal/30 font-mono text-center truncate">{qrCode}</p>
          <p className="text-xs text-charcoal/30 text-center mt-0.5">Order #{order.order_number}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {evt && !isPast && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((evt.venue ?? evt.title) + ' Singapore')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-primary text-primary rounded-xl py-3 text-sm font-bold hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">directions</span>
            Get Directions
          </a>
        )}
        {evt && (
          <Link
            href={`/events/${evt.slug}`}
            className="flex items-center justify-center gap-2 w-full text-charcoal/50 text-sm hover:text-charcoal transition-colors py-2"
          >
            View event details →
          </Link>
        )}
      </div>

      <p className="text-center text-xs text-charcoal/30 mt-6">
        Show this QR code at the entrance for check-in.
        <br />Screenshot this page as backup.
      </p>
    </div>
  )
}
