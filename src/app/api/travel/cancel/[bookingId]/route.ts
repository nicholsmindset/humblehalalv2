import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLiteApiClient } from '@/lib/liteapi/client'

export async function POST(
  _request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any

  // Verify booking exists and is cancellable
  const { data: booking } = await db
    .from('travel_bookings')
    .select('id, status, liteapi_booking_id, holder_email')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (!['confirmed', 'pending'].includes(booking.status)) {
    return NextResponse.json(
      { error: `Booking cannot be cancelled (status: ${booking.status})` },
      { status: 400 }
    )
  }

  if (!booking.liteapi_booking_id) {
    // Booking never confirmed with LiteAPI — just mark cancelled locally
    await db
      .from('travel_bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId)
    return NextResponse.json({ ok: true, bookingId, status: 'cancelled' })
  }

  let liteapi
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ error: 'Travel service unavailable' }, { status: 503 })
  }

  // Call LiteAPI cancel
  let cancelResult: any
  try {
    cancelResult = await (liteapi as any).cancelBooking({
      bookingId: booking.liteapi_booking_id,
    })
  } catch (err: any) {
    console.error('[travel/cancel] LiteAPI error:', err?.message)
    return NextResponse.json(
      { error: 'Cancellation failed. Please contact support.' },
      { status: 502 }
    )
  }

  const refundAmount = cancelResult?.data?.refundAmount ?? cancelResult?.refundAmount ?? 0

  // Update DB
  await db
    .from('travel_bookings')
    .update({
      status: 'cancelled',
      refund_amount: refundAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  return NextResponse.json({
    ok: true,
    bookingId,
    status: 'cancelled',
    refundAmount,
  })
}
