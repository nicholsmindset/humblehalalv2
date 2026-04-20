export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLiteApiClient } from '@/lib/liteapi/client'
import { enrichHotels, type HotelLocation } from '@/lib/liteapi/enrich'
import { createClient } from '@supabase/supabase-js'
import { checkLimit, travelSearchLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { travelSearchSchema, validationError } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const rl = await checkLimit(travelSearchLimiter, getIdentifier(request))
  if (rl.limited) return rl.response

  const raw = await request.json()
  const parsedBody = travelSearchSchema.safeParse(raw)
  if (!parsedBody.success) return validationError(parsedBody.error.issues)

  const { destination, checkin, checkout, guests, currency = 'SGD' } = parsedBody.data as {
    destination: string; checkin?: string; checkout?: string; guests?: unknown; currency?: string
  }

  if (!destination || !checkin || !checkout || !guests) {
    return NextResponse.json({ error: 'Missing required search parameters' }, { status: 400 })
  }

  let liteapi: any
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ error: 'Travel search unavailable' }, { status: 503 })
  }

  const countryCode = getCountryFromDestination(destination)

  // Step 1: Get hotel list (static data — name, images, location, starRating)
  const hotelStaticMap: Record<string, any> = {}
  const hotelIds: string[] = []
  try {
    const hotelsResult = await liteapi.getHotels({
      countryCode,
      cityName: destination,
      limit: 50,
      offset: 0,
    })
    const hotelList: any[] = hotelsResult?.data ?? []
    for (const h of hotelList) {
      const id = h.id ?? h.hotelId
      if (id) {
        hotelStaticMap[id] = h
        hotelIds.push(id)
      }
    }
  } catch (err: any) {
    console.error('[travel/search] getHotels error:', err?.message)
    return NextResponse.json({ error: 'Hotel search failed' }, { status: 502 })
  }

  if (hotelIds.length === 0) {
    return NextResponse.json({ hotels: [], total: 0 })
  }

  // Step 2: Get rates for those hotel IDs
  // Client sends: [{adults: 2, children: 0, childAges: []}]
  // LiteAPI expects: [{adults: 2, children: [age1, age2]}]
  const occupancies = (Array.isArray(guests) ? guests : [{ adults: 2 }]).map((g: any) => ({
    adults: g.adults ?? 2,
    children: Array.isArray(g.childAges) ? g.childAges : [],
  }))

  let ratesResult: any
  try {
    ratesResult = await liteapi.getFullRates({
      hotelIds: hotelIds.slice(0, 50),
      checkin,
      checkout,
      occupancies,
      currency,
      guestNationality: 'SG',
      timeout: 20,
    })
  } catch (err: any) {
    console.error('[travel/search] getFullRates error:', err?.message)
    return NextResponse.json({ error: 'Hotel search failed' }, { status: 502 })
  }

  if (ratesResult?.status === 'failed') {
    console.error('[travel/search] LiteAPI rates failed:', ratesResult?.error)
    return NextResponse.json({ error: 'Hotel search failed' }, { status: 502 })
  }

  // Merge static hotel data with rates
  const ratesList: any[] = ratesResult?.data?.data ?? ratesResult?.data ?? []
  const hotels: any[] = ratesList.map((r: any) => {
    const id = r.hotelId ?? r.id
    const staticData = hotelStaticMap[id] ?? {}
    return {
      ...staticData,
      hotelId: id,
      rates: r.roomTypes ?? r.rates ?? [],
      // normalise location shape
      location: {
        latitude: staticData.latitude ?? staticData.location?.latitude,
        longitude: staticData.longitude ?? staticData.location?.longitude,
        city: destination,
        address: staticData.address ?? staticData.location?.address ?? '',
      },
    }
  }).filter((h: any) => h.rates?.length > 0)

  // Build locations for enrichment
  const locations: HotelLocation[] = hotels
    .filter((h: any) => h.location?.latitude && h.location?.longitude)
    .map((h: any) => ({
      hotelId: h.hotelId,
      latitude: parseFloat(h.location.latitude),
      longitude: parseFloat(h.location.longitude),
      facilities: h.hotelFacilities ?? h.facilities ?? [],
      boardCodes: (h.rates ?? []).map((r: any) => r.boardCode ?? ''),
    }))

  // Enrich with Muslim-friendly data (best-effort)
  let enrichments: Awaited<ReturnType<typeof enrichHotels>> = {}
  try {
    enrichments = await enrichHotels(locations)
  } catch {
    // enrichment is non-critical
  }

  // Log search for demand analytics (best-effort)
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ) as any
    await db.from('travel_search_log').insert({
      destination,
      check_in: checkin,
      check_out: checkout,
      guests,
      results_count: hotels.length,
    })
  } catch {
    // non-critical
  }

  // Merge enrichment into results
  const enrichedHotels = hotels.map((h: any) => ({
    ...h,
    muslimEnrichment: enrichments[h.hotelId] ?? null,
  }))

  return NextResponse.json({ hotels: enrichedHotels, total: enrichedHotels.length })
}

function getCountryFromDestination(destination: string): string {
  const lower = destination.toLowerCase()
  if (lower.includes('singapore') || lower.includes('sg')) return 'SG'
  if (lower.includes('malaysia') || lower.includes('kuala lumpur') || lower.includes('kl')) return 'MY'
  if (lower.includes('indonesia') || lower.includes('jakarta') || lower.includes('bali')) return 'ID'
  if (lower.includes('japan') || lower.includes('tokyo') || lower.includes('osaka')) return 'JP'
  if (lower.includes('dubai') || lower.includes('uae')) return 'AE'
  if (lower.includes('turkey') || lower.includes('istanbul')) return 'TR'
  if (lower.includes('uk') || lower.includes('london')) return 'GB'
  if (lower.includes('france') || lower.includes('paris')) return 'FR'
  if (lower.includes('thailand') || lower.includes('bangkok')) return 'TH'
  if (lower.includes('morocco') || lower.includes('marrakech')) return 'MA'
  return 'SG' // default
}
