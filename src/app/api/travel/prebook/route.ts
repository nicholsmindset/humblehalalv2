import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLiteApiClient } from '@/lib/liteapi/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkLimit, travelBookLimiter, getIdentifier } from '@/lib/security/rate-limit'

export async function POST(request: NextRequest) {
  const rl = await checkLimit(travelBookLimiter, getIdentifier(request))
  if (rl.limited) return rl.response

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
    guestNationality = 'SG',
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

  // Get authenticated user (optional — guest booking allowed)
  // Must be done before any async DB writes so user_id can be stored
  let userId: string | null = null
  try {
    const serverClient = await createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    userId = user?.id ?? null
  } catch {
    // Not authenticated — guest checkout, continue without user_id
  }

  // Call LiteAPI prebook — locks the rate and creates a payment session
  console.log('[travel/prebook] Calling preBook with offerId:', offerId)
  let prebookResult: any
  try {
    prebookResult = await (liteapi as any).preBook({
      offerId,
      usePaymentSdk: true,
      guestNationality,
    })
    console.log('[travel/prebook] Raw SDK response:', JSON.stringify(prebookResult, null, 2))
  } catch (err: any) {
    console.error('[travel/prebook] LiteAPI exception:', err?.message, err?.stack)
    return NextResponse.json({ error: 'Unable to prebook. Rate may have expired.' }, { status: 502 })
  }

  // SDK returns {status: "failed", error/errors} on failure
  if (prebookResult?.status === 'failed') {
    const rawErr = prebookResult?.error
    const errMsg = typeof rawErr === 'string'
      ? rawErr
      : rawErr?.message ?? rawErr?.description ?? prebookResult?.errors?.join(', ') ?? 'Unknown error'
    console.error('[travel/prebook] LiteAPI prebook failed:', errMsg, JSON.stringify(rawErr))
    return NextResponse.json({ error: `Prebook failed: ${errMsg}` }, { status: 502 })
  }

  // LiteAPI response structure can vary — try multiple paths
  const prebookData = prebookResult?.data ?? prebookResult
  const prebookId = prebookData?.prebookId ?? prebookData?.prebook_id
  const transactionId = prebookData?.transactionId ?? prebookData?.transaction_id
  const secretKey = prebookData?.secretKey ?? prebookData?.secret_key

  if (!prebookId) {
    console.error('[travel/prebook] No prebookId found. Full response:', JSON.stringify(prebookResult, null, 2))
    return NextResponse.json({ error: 'Prebook failed — rate may have expired. Please search again.' }, { status: 502 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any

  // Create pending booking record — include user_id if authenticated
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
      user_id: userId,
    })
    .select('id')
    .single()

  if (dbErr || !booking) {
    console.error('[travel/prebook] DB error:', dbErr)
    return NextResponse.json({ error: 'Failed to create booking record' }, { status: 500 })
  }

  // Detect sandbox mode — sandbox keys typically don't support payment SDK
  const isSandbox = (process.env.LITEAPI_API_KEY ?? '').startsWith('sand_')
    || !secretKey

  return NextResponse.json({
    bookingId: booking.id,
    prebookId,
    transactionId,
    secretKey,
    sandboxMode: isSandbox,
    // Updated price/policy from LiteAPI (user must re-confirm if price changed)
    updatedRate: prebookData?.updatedRateInfo ?? null,
    cancellationPolicy: prebookData?.cancellationPolicies ?? null,
  })
}
