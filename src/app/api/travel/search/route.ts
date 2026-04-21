export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLiteApiClient } from '@/lib/liteapi/client'
import { enrichHotels, type HotelLocation } from '@/lib/liteapi/enrich'
import { createAdminClient } from '@/lib/supabase/server'
import { checkLimit, travelSearchLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { travelSearchSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const rl = await checkLimit(travelSearchLimiter, getIdentifier(request))
  if (rl.limited) return rl.response

  const body = await request.json()

  const parsedBody = travelSearchSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 })
  }

  const { destination, checkin, checkout, guests, currency = 'SGD', placeId } = parsedBody.data

  if (!destination || !checkin || !checkout || !guests) {
    return NextResponse.json({ error: 'Missing required search parameters' }, { status: 400 })
  }

  let liteapi: any
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ error: 'Travel search unavailable' }, { status: 503 })
  }

  // Country code from keyword mapping (comprehensive — no extra API call needed)
  const countryCode = getCountryFromDestination(destination)

  // Step 1: Get hotel list (static data — name, images, location, starRating)
  const hotelStaticMap: Record<string, any> = {}
  const hotelIds: string[] = []
  try {
    const hotelSearchParams: Record<string, any> = {
      limit: 50,
      offset: 0,
    }
    if (placeId) {
      hotelSearchParams.placeId = placeId
    } else {
      hotelSearchParams.countryCode = countryCode
      hotelSearchParams.cityName = destination
    }
    const hotelsResult = await liteapi.getHotels(hotelSearchParams)
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

  // Step 2: Get rates + enrichment in parallel
  const occupancies = (Array.isArray(guests) ? guests : [{ adults: 2 }]).map((g: any) => ({
    adults: g.adults ?? 2,
    children: Array.isArray(g.childAges) ? g.childAges : [],
  }))

  const ratesParams: Record<string, any> = {
    hotelIds,
    checkin,
    checkout,
    occupancies,
    currency,
    guestNationality: 'SG',
    timeout: 15,
  }
  if (placeId) ratesParams.placeId = placeId

  // Build enrichment locations from static data (no rates needed)
  const staticLocations: HotelLocation[] = hotelIds
    .filter((id) => hotelStaticMap[id]?.latitude && hotelStaticMap[id]?.longitude)
    .map((id) => {
      const h = hotelStaticMap[id]
      return {
        hotelId: id,
        latitude: parseFloat(h.latitude ?? h.location?.latitude),
        longitude: parseFloat(h.longitude ?? h.location?.longitude),
        facilities: (h.facilityIds ?? []).map((f: any) =>
          typeof f === 'object' ? (f.name ?? f.facilityId ?? '') : f
        ),
        boardCodes: [],
      }
    })

  // Run rates and enrichment concurrently
  const [ratesResult, enrichments] = await Promise.all([
    liteapi.getFullRates(ratesParams).catch((err: any) => {
      console.error('[travel/search] getFullRates error:', err?.message)
      return null
    }),
    enrichHotels(staticLocations).catch(() => ({}) as Record<string, any>),
  ])

  if (!ratesResult || ratesResult?.status === 'failed') {
    console.error('[travel/search] LiteAPI rates failed:', ratesResult?.error)
    return NextResponse.json({ error: 'Hotel search failed' }, { status: 502 })
  }

  // Merge static hotel data with rates
  const ratesList: any[] = ratesResult?.data?.data ?? ratesResult?.data ?? []
  const hotels: any[] = ratesList.map((r: any) => {
    const id = r.hotelId ?? r.id
    const staticData = hotelStaticMap[id] ?? {}
    return {
      hotelId: id,
      name: staticData.name ?? '',
      imageUrl: staticData.main_photo ?? staticData.thumbnail ?? null,
      starRating: staticData.stars ?? 0,
      guestRating: staticData.rating ?? null,
      reviewCount: staticData.reviewCount ?? 0,
      address: staticData.address ?? staticData.location?.address ?? '',
      city: destination,
      latitude: staticData.latitude ?? staticData.location?.latitude ?? null,
      longitude: staticData.longitude ?? staticData.location?.longitude ?? null,
      facilityIds: (staticData.facilityIds ?? []).map((f: any) =>
        typeof f === 'object' ? (f.facilityId ?? f.id ?? String(f)) : f
      ),
      country: staticData.country ?? null,
      rates: r.roomTypes ?? r.rates ?? [],
    }
  }).filter((h: any) => h.rates?.length > 0)

  // Fire analytics insert without awaiting (non-blocking)
  createAdminClient().then((db) =>
    db.from('travel_search_log').insert({
      destination,
      check_in: checkin,
      check_out: checkout,
      guests,
      results_count: hotels.length,
    })
  ).catch((err: any) => console.warn('[travel/search] analytics insert failed:', err?.message))

  // Merge enrichment into results
  const enrichedHotels = hotels.map((h: any) => ({
    ...h,
    muslimEnrichment: enrichments[h.hotelId] ?? null,
  }))

  return NextResponse.json({ hotels: enrichedHotels, total: enrichedHotels.length })
}

function getCountryFromDestination(destination: string): string {
  const lower = destination.toLowerCase()
  // Southeast Asia
  if (lower.includes('singapore')) return 'SG'
  if (lower.includes('malaysia') || lower.includes('kuala lumpur') || lower.includes(' kl') || lower.includes('penang') || lower.includes('johor') || lower.includes('langkawi') || lower.includes('kota kinabalu')) return 'MY'
  if (lower.includes('indonesia') || lower.includes('jakarta') || lower.includes('bali') || lower.includes('yogyakarta') || lower.includes('surabaya') || lower.includes('lombok')) return 'ID'
  if (lower.includes('thailand') || lower.includes('bangkok') || lower.includes('phuket') || lower.includes('chiang mai') || lower.includes('pattaya')) return 'TH'
  if (lower.includes('vietnam') || lower.includes('ho chi minh') || lower.includes('hanoi') || lower.includes('da nang') || lower.includes('hoi an')) return 'VN'
  if (lower.includes('philippines') || lower.includes('manila') || lower.includes('cebu') || lower.includes('boracay')) return 'PH'
  if (lower.includes('cambodia') || lower.includes('phnom penh') || lower.includes('siem reap')) return 'KH'
  if (lower.includes('myanmar') || lower.includes('yangon') || lower.includes('mandalay')) return 'MM'
  if (lower.includes('brunei')) return 'BN'
  // Middle East
  if (lower.includes('dubai') || lower.includes('abu dhabi') || lower.includes('uae') || lower.includes('sharjah') || lower.includes('emirates')) return 'AE'
  if (lower.includes('saudi') || lower.includes('riyadh') || lower.includes('jeddah') || lower.includes('mecca') || lower.includes('medina') || lower.includes('makkah')) return 'SA'
  if (lower.includes('qatar') || lower.includes('doha')) return 'QA'
  if (lower.includes('kuwait')) return 'KW'
  if (lower.includes('bahrain') || lower.includes('manama')) return 'BH'
  if (lower.includes('oman') || lower.includes('muscat')) return 'OM'
  if (lower.includes('jordan') || lower.includes('amman') || lower.includes('petra')) return 'JO'
  if (lower.includes('egypt') || lower.includes('cairo') || lower.includes('luxor') || lower.includes('hurghada') || lower.includes('sharm')) return 'EG'
  if (lower.includes('israel') || lower.includes('tel aviv') || lower.includes('jerusalem')) return 'IL'
  if (lower.includes('lebanon') || lower.includes('beirut')) return 'LB'
  // South Asia
  if (lower.includes('india') || lower.includes('mumbai') || lower.includes('delhi') || lower.includes('bangalore') || lower.includes('chennai') || lower.includes('kolkata') || lower.includes('goa') || lower.includes('hyderabad')) return 'IN'
  if (lower.includes('pakistan') || lower.includes('karachi') || lower.includes('lahore') || lower.includes('islamabad')) return 'PK'
  if (lower.includes('bangladesh') || lower.includes('dhaka')) return 'BD'
  if (lower.includes('sri lanka') || lower.includes('colombo')) return 'LK'
  if (lower.includes('maldives') || lower.includes('male')) return 'MV'
  if (lower.includes('nepal') || lower.includes('kathmandu')) return 'NP'
  // East Asia
  if (lower.includes('japan') || lower.includes('tokyo') || lower.includes('osaka') || lower.includes('kyoto') || lower.includes('hiroshima') || lower.includes('sapporo')) return 'JP'
  if (lower.includes('south korea') || lower.includes('korea') || lower.includes('seoul') || lower.includes('busan')) return 'KR'
  if (lower.includes('china') || lower.includes('beijing') || lower.includes('shanghai') || lower.includes('guangzhou') || lower.includes('shenzhen') || lower.includes('chengdu') || lower.includes('xi\'an')) return 'CN'
  if (lower.includes('hong kong')) return 'HK'
  if (lower.includes('taiwan') || lower.includes('taipei')) return 'TW'
  if (lower.includes('macau')) return 'MO'
  // Europe
  if (lower.includes('turkey') || lower.includes('istanbul') || lower.includes('ankara') || lower.includes('cappadocia') || lower.includes('antalya') || lower.includes('bodrum')) return 'TR'
  if (lower.includes('uk') || lower.includes('united kingdom') || lower.includes('london') || lower.includes('manchester') || lower.includes('edinburgh') || lower.includes('birmingham')) return 'GB'
  if (lower.includes('france') || lower.includes('paris') || lower.includes('nice') || lower.includes('lyon') || lower.includes('marseille')) return 'FR'
  if (lower.includes('germany') || lower.includes('berlin') || lower.includes('munich') || lower.includes('frankfurt') || lower.includes('hamburg')) return 'DE'
  if (lower.includes('spain') || lower.includes('madrid') || lower.includes('barcelona') || lower.includes('seville') || lower.includes('granada')) return 'ES'
  if (lower.includes('italy') || lower.includes('rome') || lower.includes('milan') || lower.includes('venice') || lower.includes('florence') || lower.includes('naples')) return 'IT'
  if (lower.includes('netherlands') || lower.includes('amsterdam') || lower.includes('rotterdam')) return 'NL'
  if (lower.includes('switzerland') || lower.includes('zurich') || lower.includes('geneva') || lower.includes('bern')) return 'CH'
  if (lower.includes('austria') || lower.includes('vienna') || lower.includes('salzburg')) return 'AT'
  if (lower.includes('greece') || lower.includes('athens') || lower.includes('santorini') || lower.includes('mykonos')) return 'GR'
  if (lower.includes('portugal') || lower.includes('lisbon') || lower.includes('porto') || lower.includes('algarve')) return 'PT'
  if (lower.includes('czech') || lower.includes('prague')) return 'CZ'
  if (lower.includes('hungary') || lower.includes('budapest')) return 'HU'
  if (lower.includes('poland') || lower.includes('warsaw') || lower.includes('krakow')) return 'PL'
  if (lower.includes('russia') || lower.includes('moscow') || lower.includes('st petersburg')) return 'RU'
  if (lower.includes('scandinavia') || lower.includes('norway') || lower.includes('oslo') || lower.includes('bergen')) return 'NO'
  if (lower.includes('sweden') || lower.includes('stockholm')) return 'SE'
  if (lower.includes('denmark') || lower.includes('copenhagen')) return 'DK'
  if (lower.includes('finland') || lower.includes('helsinki')) return 'FI'
  if (lower.includes('albania') || lower.includes('tirana')) return 'AL'
  if (lower.includes('bosnia') || lower.includes('sarajevo') || lower.includes('mostar')) return 'BA'
  // Africa
  if (lower.includes('morocco') || lower.includes('marrakech') || lower.includes('casablanca') || lower.includes('fez') || lower.includes('rabat') || lower.includes('tangier')) return 'MA'
  if (lower.includes('tunisia') || lower.includes('tunis') || lower.includes('djerba')) return 'TN'
  if (lower.includes('south africa') || lower.includes('cape town') || lower.includes('johannesburg') || lower.includes('durban')) return 'ZA'
  if (lower.includes('kenya') || lower.includes('nairobi') || lower.includes('mombasa')) return 'KE'
  if (lower.includes('tanzania') || lower.includes('zanzibar') || lower.includes('dar es salaam')) return 'TZ'
  if (lower.includes('ethiopia') || lower.includes('addis ababa')) return 'ET'
  if (lower.includes('senegal') || lower.includes('dakar')) return 'SN'
  // Americas
  if (lower.includes('usa') || lower.includes('united states') || lower.includes('new york') || lower.includes('los angeles') || lower.includes('chicago') || lower.includes('miami') || lower.includes('las vegas') || lower.includes('san francisco') || lower.includes('washington')) return 'US'
  if (lower.includes('canada') || lower.includes('toronto') || lower.includes('vancouver') || lower.includes('montreal')) return 'CA'
  if (lower.includes('brazil') || lower.includes('rio de janeiro') || lower.includes('sao paulo')) return 'BR'
  if (lower.includes('mexico') || lower.includes('cancun') || lower.includes('mexico city')) return 'MX'
  // Oceania
  if (lower.includes('australia') || lower.includes('sydney') || lower.includes('melbourne') || lower.includes('brisbane') || lower.includes('perth')) return 'AU'
  if (lower.includes('new zealand') || lower.includes('auckland') || lower.includes('queenstown')) return 'NZ'
  return 'SG' // default
}
