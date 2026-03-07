import { NextRequest, NextResponse } from 'next/server'
import { getLiteApiClient } from '@/lib/liteapi/client'
import { enrichHotels, type HotelLocation } from '@/lib/liteapi/enrich'
import { createClient } from '@supabase/supabase-js'

const MARGIN = 12 // 12% commission margin — adjust in production

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { destination, checkin, checkout, guests, currency = 'SGD' } = body

  if (!destination || !checkin || !checkout || !guests) {
    return NextResponse.json({ error: 'Missing required search parameters' }, { status: 400 })
  }

  let liteapi
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ error: 'Travel search unavailable' }, { status: 503 })
  }

  // Search rates from LiteAPI
  let searchResult: any
  try {
    searchResult = await (liteapi as any).getHotelsRates({
      hotelIds: [],        // empty = destination-based search
      checkin,
      checkout,
      occupancies: guests, // [{adults: 2, children: 0, childAges: []}]
      currency,
      guestNationality: 'SG',
      countryCode: getCountryFromDestination(destination),
      cityName: destination,
      limit: 30,
      offset: 0,
      margin: MARGIN,
    })
  } catch (err: any) {
    console.error('[travel/search] LiteAPI error:', err?.message)
    return NextResponse.json({ error: 'Hotel search failed' }, { status: 502 })
  }

  const hotels: any[] = searchResult?.data ?? []

  // Build locations for enrichment
  const locations: HotelLocation[] = hotels
    .filter((h: any) => h.latitude && h.longitude)
    .map((h: any) => ({
      hotelId: h.hotelId ?? h.id,
      latitude: parseFloat(h.latitude),
      longitude: parseFloat(h.longitude),
      facilities: h.facilities ?? [],
      boardCodes: (h.rates ?? []).map((r: any) => r.boardCode ?? ''),
    }))

  // Enrich with Muslim-friendly data (best-effort, don't fail search if enrichment fails)
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
  const enrichedHotels = hotels.map((h: any) => {
    const id = h.hotelId ?? h.id
    return {
      ...h,
      muslimEnrichment: enrichments[id] ?? null,
    }
  })

  return NextResponse.json({ hotels: enrichedHotels, total: hotels.length })
}

// Simple country code lookup — expand as needed
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
