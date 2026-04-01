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
  const [detailResult, reviewsResult] = await Promise.allSettled([
    (liteapi as any).getHotel({ hotelId }),
    (liteapi as any).getHotelReviews({ hotelId, limit: 10 }),
  ])

  if (detailResult.status === 'rejected') {
    console.error('[travel/hotel] detail error:', detailResult.reason)
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
  }

  const hotel = (detailResult.value as any)?.data ?? (detailResult.value as any)
  const reviews = reviewsResult.status === 'fulfilled'
    ? (reviewsResult.value as any)?.data ?? []
    : []

  // Enrich with Muslim-friendly data
  let enrichment = null
  if (hotel?.location?.latitude && hotel?.location?.longitude) {
    try {
      const enrichments = await enrichHotels([{
        hotelId,
        latitude: parseFloat(hotel.location.latitude),
        longitude: parseFloat(hotel.location.longitude),
        facilities: hotel.facilities ?? [],
        boardCodes: [],
      }])
      enrichment = enrichments[hotelId] ?? null
    } catch {
      // non-critical
    }
  }

  return NextResponse.json({ hotel, reviews, muslimEnrichment: enrichment })
}
