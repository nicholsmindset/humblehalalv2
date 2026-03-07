import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLiteApiClient } from '@/lib/liteapi/client'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    offerId,
    hotelId,
    hotelName,
    hotelCity,
    hotelCountry,
    checkIn,
    checkOut,
    guests,
    totalAmount,
    currency = 'SGD',
    holderFirstName,
    holderLastName,
    holderEmail,
  } = body

  if (!offerId || !hotelId || !hotelName || !checkIn || !checkOut || !holderFirstName || !holderLastName || !holderEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let liteapi
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ error: 'Travel booking unavailable' }, { status: 503 })
  }

  // Call LiteAPI prebook — locks the rate and creates a payment session
  let prebookResult: any
  try {
    prebookResult = await (liteapi as any).preBookRate({
      offerId,
      usePaymentSdk: true,
    })
  } catch (err: any) {
    console.error('[travel/prebook] LiteAPI error:', err?.message)
    return NextResponse.json({ error: 'Unable to prebook. Rate may have expired.' }, { status: 502 })
  }

  const prebookData = prebookResult?.data ?? prebookResult
  const prebookId = prebookData?.prebookId
  const transactionId = prebookData?.transactionId
  const secretKey = prebookData?.secretKey

  if (!prebookId) {
    console.error('[travel/prebook] No prebookId in response:', prebookData)
    return NextResponse.json({ error: 'Prebook failed — invalid response' }, { status: 502 })
  }

  // Get authenticated user (optional — guest booking allowed)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any

  // Create pending booking record
  const { data: booking, error: dbErr } = await supabase
    .from('travel_bookings')
    .insert({
      hotel_id: hotelId,
      hotel_name: hotelName,
      hotel_city: hotelCity ?? null,
      hotel_country: hotelCountry ?? null,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests ?? [],
      offer_id: offerId,
      total_amount: totalAmount ?? 0,
      currency,
      status: 'pending',
      holder_first_name: holderFirstName,
      holder_last_name: holderLastName,
      holder_email: holderEmail,
      liteapi_prebook_id: prebookId,
      liteapi_transaction_id: transactionId ?? null,
    })
    .select('id')
    .single()

  if (dbErr || !booking) {
    console.error('[travel/prebook] DB error:', dbErr)
    return NextResponse.json({ error: 'Failed to create booking record' }, { status: 500 })
  }

  return NextResponse.json({
    bookingId: booking.id,
    prebookId,
    transactionId,
    secretKey,
    // Updated price/policy from LiteAPI (user must re-confirm if price changed)
    updatedRate: prebookData?.updatedRateInfo ?? null,
    cancellationPolicy: prebookData?.cancellationPolicies ?? null,
  })
}
