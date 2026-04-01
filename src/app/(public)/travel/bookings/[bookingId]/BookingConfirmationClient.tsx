'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface BookingDetail {
  id: string
  status: string
  hotel_name: string
  hotel_city: string | null
  check_in: string
  check_out: string
  total_amount: number
  currency: string
  holder_first_name: string | null
  holder_last_name: string | null
  holder_email: string | null
  hotel_confirmation_code: string | null
  liteapi_booking_id: string | null
  cancellation_policy: unknown
  created_at: string
}

export default function BookingConfirmationClient() {
  const { bookingId } = useParams() as { bookingId: string }
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/travel/bookings/${bookingId}`)
        if (!res.ok) throw new Error('Booking not found')
        const data = await res.json()
        setBooking(data.booking)
      } catch {
        setError('We could not load your booking. Please check your confirmation email.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingId])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-charcoal/40">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p>Loading your booking…</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-red-400 block mb-3">error_outline</span>
        <p className="font-semibold text-charcoal">{error ?? 'Booking not found'}</p>
        <Link href="/travel/hotels" className="mt-4 inline-block text-primary text-sm hover:underline">
          ← Back to hotels
        </Link>
      </div>
    )
  }

  const checkInDate  = new Date(booking.check_in)
  const checkOutDate = new Date(booking.check_out)
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000)
  const formatDate = (d: Date) => d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  const formattedAmount = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: booking.currency,
    minimumFractionDigits: 0,
  }).format(booking.total_amount)

  const confirmationCode = booking.hotel_confirmation_code ?? bookingId.slice(0, 8).toUpperCase()
  const holderName = [booking.holder_first_name, booking.holder_last_name].filter(Boolean).join(' ') || 'Guest'

  const isConfirmed = booking.status === 'confirmed'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* Success header */}
      <div className={`rounded-2xl p-8 text-center mb-6 ${isConfirmed ? 'bg-primary' : 'bg-amber-600'}`}>
        <span className="material-symbols-outlined text-5xl text-white block mb-3">
          {isConfirmed ? 'check_circle' : 'pending'}
        </span>
        <h1 className="text-2xl font-extrabold text-white mb-1">
          {isConfirmed ? 'Booking confirmed!' : 'Booking pending'}
        </h1>
        <p className="text-white/80 text-sm">
          {isConfirmed
            ? `Your stay at ${booking.hotel_name} is booked.`
            : 'We are processing your booking — check your email for updates.'}
        </p>
      </div>

      {/* Confirmation code */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <p className="text-xs text-charcoal/50 font-semibold uppercase tracking-wide mb-1">Confirmation code</p>
        <p className="font-mono text-2xl font-bold text-charcoal tracking-widest">{confirmationCode}</p>
        <p className="text-xs text-charcoal/40 mt-1">Show this at check-in</p>
      </div>

      {/* Booking details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 space-y-4">
        <h2 className="font-bold text-charcoal">Booking details</h2>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/50">Hotel</span>
            <span className="font-semibold text-charcoal text-right">{booking.hotel_name}</span>
          </div>
          {booking.hotel_city && (
            <div className="flex justify-between text-sm">
              <span className="text-charcoal/50">City</span>
              <span className="font-semibold text-charcoal">{booking.hotel_city}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/50">Check-in</span>
            <span className="font-semibold text-charcoal">{formatDate(checkInDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/50">Check-out</span>
            <span className="font-semibold text-charcoal">{formatDate(checkOutDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/50">Duration</span>
            <span className="font-semibold text-charcoal">{nights} night{nights !== 1 ? 's' : ''}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
            <span className="text-charcoal/50">Total paid</span>
            <span className="font-bold text-primary text-base">{formattedAmount}</span>
          </div>
        </div>
      </div>

      {/* Guest info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="font-bold text-charcoal mb-3">Guest information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-charcoal/50">Lead guest</span>
            <span className="font-semibold text-charcoal">{holderName}</span>
          </div>
          {booking.holder_email && (
            <div className="flex justify-between">
              <span className="text-charcoal/50">Email</span>
              <span className="font-semibold text-charcoal">{booking.holder_email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/travel/hotels"
          className="flex-1 text-center border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-charcoal hover:bg-gray-50 transition-colors"
        >
          Search more hotels
        </Link>
        <button
          onClick={() => window.print()}
          className="flex-1 text-center bg-primary text-white rounded-xl px-4 py-3 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Print / Save PDF
        </button>
      </div>

      {/* LiteAPI booking ID (small, for support) */}
      {booking.liteapi_booking_id && (
        <p className="text-xs text-charcoal/30 text-center mt-6">
          LiteAPI ref: {booking.liteapi_booking_id}
        </p>
      )}
    </div>
  )
}
