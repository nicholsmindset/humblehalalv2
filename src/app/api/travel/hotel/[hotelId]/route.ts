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

  const rawHotel = (detailResult.value as any)?.data ?? (detailResult.value as any)
  const reviews = reviewsResult.status === 'fulfilled'
    ? (reviewsResult.value as any)?.data ?? []
    : []

  // Resolve lat/lng — LiteAPI may return them flat or nested under `location`
  const rawLat = rawHotel?.latitude ?? rawHotel?.location?.latitude ?? null
  const rawLng = rawHotel?.longitude ?? rawHotel?.location?.longitude ?? null
  const latitude = rawLat !== null ? parseFloat(rawLat) : null
  const longitude = rawLng !== null ? parseFloat(rawLng) : null

  // Normalize LiteAPI raw hotel fields → internal field names.
  // Spread rawHotel first so any extra fields are preserved, then override
  // with normalized names so they always win.
  const normalizedHotelFields = {
    hotelId,
    imageUrl: rawHotel?.main_photo ?? rawHotel?.thumbnail ?? null,
    starRating: rawHotel?.stars ?? 0,
    guestRating: rawHotel?.rating ?? null,
    reviewCount: rawHotel?.reviewCount ?? 0,
    latitude,
    longitude,
    facilityIds: rawHotel?.facilityIds ?? rawHotel?.facilities ?? [],
    description: rawHotel?.description ?? rawHotel?.hotelDescription ?? '',
  }

  // Fetch rates when search params are provided so the booking panel has a real offerId
  let rawRates: any[] = []
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
        rawRates = hotelRates?.roomTypes ?? hotelRates?.rates ?? []
      }
    } catch {
      // non-critical — hotel detail still shown without rates
    }
  }

  // Normalize rates: ensure each entry has a stable offerId and expected fields.
  // Spread the raw room first for passthrough of any extra fields, then override
  // with normalized names.
  const rates = rawRates.map((room: any) => {
    const offerId = room.offerId ?? room.offer_id ?? room.id ?? ''
    return {
      ...room,
      offerId,
      roomTypeId: room.roomTypeId ?? room.id ?? '',
      name: room.name ?? room.roomTypeName ?? 'Standard Room',
      boardName: room.boardName ?? room.mealPlan ?? room.board ?? '',
      retailRate: {
        ...(room.retailRate ?? {}),
        total: room.retailRate?.total ?? room.price ?? [],
      },
      cancellationPolicies: room.cancellationPolicies ?? room.cancellation_policies ?? [],
      maxOccupancy: room.maxOccupancy ?? room.max_occupancy ?? null,
    }
  })

  // Enrich with Muslim-friendly data (use normalized lat/lng)
  let enrichment = null
  if (latitude !== null && longitude !== null) {
    try {
      const boardCodes = rawRates.map((r: any) => r.boardCode ?? '')
      const enrichments = await enrichHotels([{
        hotelId,
        latitude,
        longitude,
        facilities: rawHotel?.facilities ?? [],
        boardCodes,
      }])
      enrichment = enrichments[hotelId] ?? null
    } catch {
      // non-critical
    }
  }

  // Merge: rawHotel passthrough first, then normalized fields win on conflict
  const hotel = { ...rawHotel, ...normalizedHotelFields, rates }

  return NextResponse.json({ hotel, reviews, muslimEnrichment: enrichment })
}
