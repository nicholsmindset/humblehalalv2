import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Tickets | HumbleHalal',
  robots: { index: false },
}

export default async function MyTicketsPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/my-tickets')

  const { data: orders } = (await db
    .from('event_orders')
    .select(`
      id, order_number, status, total_amount, created_at,
      events(id, slug, title, starts_at, ends_at, venue, area, is_online),
      event_order_items(id, qr_code, attendee_name, checked_in, status, event_tickets(name, price))
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })) as any

  const now = new Date()

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-charcoal/40 hover:text-primary inline-flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-charcoal mt-1">My Tickets</h1>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/20 block mb-3">confirmation_number</span>
            <p className="font-medium text-charcoal/60">No tickets yet</p>
            <p className="text-sm text-charcoal/40 mt-1">Browse upcoming events and grab your tickets.</p>
            <Link
              href="/events"
              className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order: any) => {
              const evt = order.events
              if (!evt) return null

              const startDate = new Date(evt.starts_at)
              const isPast = new Date(evt.ends_at ?? evt.starts_at) < now
              const items: any[] = order.event_order_items ?? []
              const activeItems = items.filter(i => i.status !== 'cancelled')

              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Event header */}
                  <div className={`px-5 py-4 border-b border-gray-100 ${isPast ? 'bg-gray-50' : 'bg-primary/5'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/events/${evt.slug}`}
                          className="font-bold text-charcoal hover:text-primary transition-colors leading-snug block truncate"
                        >
                          {evt.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-xs text-charcoal/50 flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {startDate.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {startDate.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {evt.venue && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {evt.venue}
                            </span>
                          )}
                          {evt.is_online && !evt.venue && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">videocam</span>
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                      {isPast && (
                        <span className="text-xs bg-gray-100 text-charcoal/40 px-2.5 py-0.5 rounded-full shrink-0">Past</span>
                      )}
                    </div>
                  </div>

                  {/* Ticket items */}
                  <div className="divide-y divide-gray-100">
                    {activeItems.map((item: any) => (
                      <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.checked_in ? 'bg-gray-100' : 'bg-primary/10'}`}>
                            <span className={`material-symbols-outlined text-sm ${item.checked_in ? 'text-charcoal/30' : 'text-primary'}`}>
                              {item.checked_in ? 'check_circle' : 'confirmation_number'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-charcoal">{item.event_tickets?.name ?? 'Ticket'}</p>
                            <p className="text-xs text-charcoal/40">{item.attendee_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.checked_in && (
                            <span className="text-xs text-charcoal/40 bg-gray-100 px-2 py-0.5 rounded-full">Used</span>
                          )}
                          <Link
                            href={`/tickets/${item.qr_code}`}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">qr_code</span>
                            View ticket
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-charcoal/40 font-mono">Order #{order.order_number}</p>
                    {order.total_amount > 0 && (
                      <p className="text-xs text-charcoal/50">
                        SGD {(order.total_amount / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
