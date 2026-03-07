import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Hotel Bookings | HumbleHalal',
  robots: { index: false },
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700' },
  pending:   { label: 'Pending',   className: 'bg-amber-50 text-amber-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-500' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-charcoal/50' },
  failed:    { label: 'Failed',    className: 'bg-red-50 text-red-500' },
}

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/my-bookings')

  const { data: bookings } = await db
    .from('travel_bookings')
    .select(
      'id, status, hotel_name, hotel_city, hotel_country, check_in, check_out, ' +
      'total_amount, currency, hotel_confirmation_code, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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
          <h1 className="text-2xl font-extrabold text-charcoal mt-1">My Hotel Bookings</h1>
        </div>

        {!bookings || bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/20 block mb-3">hotel</span>
            <p className="font-medium text-charcoal/60">No hotel bookings yet</p>
            <p className="text-sm text-charcoal/40 mt-1">
              Book Muslim-friendly hotels with mosque proximity scores and halal food ratings.
            </p>
            <Link
              href="/travel/hotels"
              className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Search hotels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => {
              const checkIn  = new Date(booking.check_in)
              const checkOut = new Date(booking.check_out)
              const nights   = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
              const isPast   = checkOut < now
              const status   = STATUS_LABEL[booking.status] ?? { label: booking.status, className: 'bg-gray-100 text-charcoal/50' }

              const formattedAmount = new Intl.NumberFormat('en-SG', {
                style: 'currency',
                currency: booking.currency ?? 'SGD',
                minimumFractionDigits: 0,
              }).format(booking.total_amount)

              const confirmationCode = booking.hotel_confirmation_code ?? booking.id.slice(0, 8).toUpperCase()

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isPast ? 'opacity-75' : ''}`}
                >
                  {/* Card header */}
                  <div className={`px-5 py-4 border-b border-gray-100 ${isPast ? 'bg-gray-50' : 'bg-primary/5'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/travel/bookings/${booking.id}`}
                          className="font-bold text-charcoal hover:text-primary transition-colors leading-snug block truncate"
                        >
                          {booking.hotel_name}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-xs text-charcoal/50 flex-wrap">
                          {(booking.hotel_city || booking.hotel_country) && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {[booking.hotel_city, booking.hotel_country].filter(Boolean).join(', ')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {checkIn.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' → '}
                            {checkOut.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {nights} night{nights !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-charcoal/40">Confirmation code</p>
                      <p className="font-mono text-sm font-bold text-charcoal tracking-wider">{confirmationCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-charcoal/40">Total</p>
                      <p className="font-bold text-primary">{formattedAmount}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
                    <p className="text-xs text-charcoal/40">
                      Booked {new Date(booking.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3">
                      {booking.status === 'confirmed' && !isPast && (
                        <CancelButton bookingId={booking.id} />
                      )}
                      <Link
                        href={`/travel/bookings/${booking.id}`}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">receipt_long</span>
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Flight cross-sell */}
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-xl">flight</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-charcoal text-sm">Need flights?</p>
            <p className="text-xs text-charcoal/60 mt-0.5">Search and compare flights via Skyscanner.</p>
          </div>
          <Link
            href="/travel/flights"
            className="shrink-0 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Search flights
          </Link>
        </div>
      </div>
    </div>
  )
}

// Client component for cancel action — inline so page stays RSC
function CancelButton({ bookingId }: { bookingId: string }) {
  // This is an RSC — return a simple link to a cancel confirm URL
  // The actual cancel is handled via the booking detail page
  return (
    <Link
      href={`/travel/bookings/${bookingId}#cancel`}
      className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1"
    >
      <span className="material-symbols-outlined text-xs">cancel</span>
      Cancel
    </Link>
  )
}
