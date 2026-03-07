import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLiteApiClient } from '@/lib/liteapi/client'
import { sendBookingConfirmation } from '@/lib/resend/send'
import { SITE_URL } from '@/config'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { bookingId, prebookId, transactionId, holderFirstName, holderLastName, holderEmail, holderPhone } = body

  if (!bookingId || !prebookId || !transactionId || !holderFirstName || !holderLastName || !holderEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any

  // Verify booking exists and is pending
  const { data: pendingBooking } = await db
    .from('travel_bookings')
    .select('id, hotel_name, hotel_city, check_in, check_out, total_amount, currency, liteapi_prebook_id')
    .eq('id', bookingId)
    .eq('status', 'pending')
    .single()

  if (!pendingBooking) {
    return NextResponse.json({ error: 'Booking not found or already processed' }, { status: 404 })
  }

  // Verify prebookId matches
  if (pendingBooking.liteapi_prebook_id !== prebookId) {
    return NextResponse.json({ error: 'Invalid prebook reference' }, { status: 400 })
  }

  let liteapi
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ error: 'Travel booking unavailable' }, { status: 503 })
  }

  // Call LiteAPI book — finalise the booking after payment
  let bookResult: any
  try {
    bookResult = await (liteapi as any).book({
      prebookId,
      holder: {
        firstName: holderFirstName,
        lastName: holderLastName,
        email: holderEmail,
        phone: holderPhone ?? undefined,
      },
      payment: {
        method: 'TRANSACTION_ID',
        transactionId,
      },
    })
  } catch (err: any) {
    console.error('[travel/book] LiteAPI error:', err?.message)
    // Mark booking failed
    await db.from('travel_bookings').update({ status: 'failed' }).eq('id', bookingId)
    return NextResponse.json({ error: 'Booking confirmation failed. Your payment has not been charged.' }, { status: 502 })
  }

  const bookData = bookResult?.data ?? bookResult
  const litapiBookingId = bookData?.bookingId
  const hotelConfirmationCode = bookData?.supplierBookingName ?? bookData?.hotelConfirmationCode

  // Update booking to confirmed
  await db.from('travel_bookings').update({
    status: 'confirmed',
    liteapi_booking_id: litapiBookingId ?? null,
    hotel_confirmation_code: hotelConfirmationCode ?? null,
    holder_first_name: holderFirstName,
    holder_last_name: holderLastName,
    holder_email: holderEmail,
    cancellation_policy: bookData?.cancellationPolicies ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId)

  // Send booking confirmation email (best-effort)
  try {
    const checkInDate = new Date(pendingBooking.check_in)
    const checkOutDate = new Date(pendingBooking.check_out)
    await sendBookingConfirmation({
      holderName: `${holderFirstName} ${holderLastName}`,
      holderEmail,
      hotelName: pendingBooking.hotel_name,
      hotelCity: pendingBooking.hotel_city ?? '',
      checkIn: checkInDate.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      checkOut: checkOutDate.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      totalAmount: pendingBooking.total_amount,
      currency: pendingBooking.currency,
      confirmationCode: hotelConfirmationCode ?? bookingId.slice(0, 8).toUpperCase(),
      bookingUrl: `${SITE_URL}/travel/bookings/${bookingId}`,
    })
  } catch (emailErr) {
    console.error('[travel/book] Email error (non-fatal):', emailErr)
  }

  return NextResponse.json({
    ok: true,
    bookingId,
    liteapiBookingId: litapiBookingId,
    confirmationCode: hotelConfirmationCode,
    redirect_url: `${SITE_URL}/travel/bookings/${bookingId}`,
  })
}
