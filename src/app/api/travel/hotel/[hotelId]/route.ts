export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLiteApiClient } from '@/lib/liteapi/client'
import { enrichHotels } from '@/lib/liteapi/enrich'

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  const { hotelId } = params

  let liteapi
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ error: 'Travel unavailable' }, { status: 503 })
  }

  // Fetch hotel detail + reviews in parallel
  const checkin = request.nextUrl.searchParams.get('checkin') ?? ''
  const checkout = request.nextUrl.searchParams.get('checkout') ?? ''
  const guestsParam = request.nextUrl.searchParams.get('guests') ?? ''
  const currency = request.nextUrl.searchParams.get('currency') ?? 'SGD'

  const [detailResult, reviewsResult] = await Promise.allSettled([
    (liteapi as any).getHotelDetails(hotelId),
    (liteapi as any).getHotelReviews(hotelId, 10),
  ])

  if (detailResult.status === 'rejected') {
    console.error('[travel/hotel] detail error:', detailResult.reason)
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
  }

  const hotel = (detailResult.value as any)?.data ?? (detailResult.value as any)
  const reviews = reviewsResult.status === 'fulfilled'
    ? (reviewsResult.value as any)?.data ?? []
    : []

  // Fetch rates when search params are provided so the booking panel has a real offerId
  let rates: any[] = []
  if (checkin && checkout) {
    try {
      const adults = Math.max(1, parseInt(guestsParam) || 2)
      const ratesResult = await (liteapi as any).getFullRates({
        hotelIds: [hotelId],
        checkin,
        checkout,
        occupancies: [{ adults, children: [] }],
        currency,
        guestNationality: 'SG',
        timeout: 15,
      })
      if (ratesResult?.status !== 'failed') {
        const ratesList: any[] = ratesResult?.data?.data ?? ratesResult?.data ?? []
        const hotelRates = ratesList.find((r: any) => (r.hotelId ?? r.id) === hotelId)
        rates = hotelRates?.roomTypes ?? hotelRates?.rates ?? []
      }
    } catch {
      // non-critical — hotel detail still shown without rates
    }
  }

  // Enrich with Muslim-friendly data
  let enrichment = null
  if (hotel?.location?.latitude && hotel?.location?.longitude) {
    try {
      const boardCodes = rates.map((r: any) => r.boardCode ?? '')
      const enrichments = await enrichHotels([{
        hotelId,
        latitude: parseFloat(hotel.location.latitude),
        longitude: parseFloat(hotel.location.longitude),
        facilities: hotel.facilities ?? [],
        boardCodes,
      }])
      enrichment = enrichments[hotelId] ?? null
    } catch {
      // non-critical
    }
  }

  return NextResponse.json({ hotel: { ...hotel, rates }, reviews, muslimEnrichment: enrichment })
}
