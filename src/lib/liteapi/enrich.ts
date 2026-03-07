// Muslim-friendly enrichment: PostGIS proximity queries against our mosques + listings tables
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface MuslimEnrichment {
  nearestMosqueName: string | null
  nearestMosqueDistanceM: number | null
  halalFoodCount: number
  hasPrayerRoom: boolean
  hasHalalBreakfast: boolean
  muslimFriendlyScore: number // 1–5 composite
  badges: MuslimBadge[]
}

export type MuslimBadge =
  | 'mosque_nearby'
  | 'halal_food_area'
  | 'prayer_room'
  | 'halal_breakfast'
  | 'muslim_friendly'

export interface HotelLocation {
  hotelId: string
  latitude: number
  longitude: number
  facilities?: string[]
  boardCodes?: string[]
}

// Enrich a batch of hotels with Muslim-friendly data
export async function enrichHotels(
  hotels: HotelLocation[]
): Promise<Record<string, MuslimEnrichment>> {
  if (!hotels.length) return {}

  const db = getServiceClient() as any
  const results: Record<string, MuslimEnrichment> = {}

  await Promise.all(
    hotels.map(async (hotel) => {
      results[hotel.hotelId] = await enrichSingleHotel(db, hotel)
    })
  )

  return results
}

async function enrichSingleHotel(
  db: any,
  hotel: HotelLocation
): Promise<MuslimEnrichment> {
  const { latitude, longitude, facilities = [], boardCodes = [] } = hotel

  // Run mosque + food queries in parallel
  const [mosqueResult, foodResult] = await Promise.all([
    // Nearest mosque within 2km
    db.rpc('nearest_mosque', {
      lat: latitude,
      lng: longitude,
      radius_m: 2000,
    }).single(),

    // Halal food count within 1km
    db.rpc('halal_food_nearby_count', {
      lat: latitude,
      lng: longitude,
      radius_m: 1000,
    }).single(),
  ])

  const nearestMosqueName: string | null = mosqueResult.data?.name ?? null
  const nearestMosqueDistanceM: number | null = mosqueResult.data?.distance_m ?? null
  const halalFoodCount: number = foodResult.data ?? 0

  // Check hotel facilities (case-insensitive)
  const facilitiesLower = facilities.map((f: string) => f.toLowerCase())
  const hasPrayerRoom = facilitiesLower.some(
    (f) => f.includes('prayer') || f.includes('mosque') || f.includes('musallah')
  )
  const hasHalalBreakfast =
    facilitiesLower.some((f) => f.includes('halal')) ||
    boardCodes.some((b) => b.toLowerCase().includes('halal'))

  // Composite Muslim-friendly score (1–5)
  let score = 1
  if (nearestMosqueDistanceM !== null && nearestMosqueDistanceM <= 500) score += 1.5
  else if (nearestMosqueDistanceM !== null && nearestMosqueDistanceM <= 1000) score += 1
  if (halalFoodCount >= 5) score += 1
  else if (halalFoodCount >= 2) score += 0.5
  if (hasPrayerRoom) score += 0.75
  if (hasHalalBreakfast) score += 0.75
  const muslimFriendlyScore = Math.min(5, Math.round(score))

  // Badges
  const badges: MuslimBadge[] = []
  if (nearestMosqueDistanceM !== null && nearestMosqueDistanceM <= 500) {
    badges.push('mosque_nearby')
  }
  if (halalFoodCount >= 5) badges.push('halal_food_area')
  if (hasPrayerRoom) badges.push('prayer_room')
  if (hasHalalBreakfast) badges.push('halal_breakfast')
  if (muslimFriendlyScore >= 4) badges.push('muslim_friendly')

  return {
    nearestMosqueName,
    nearestMosqueDistanceM,
    halalFoodCount,
    hasPrayerRoom,
    hasHalalBreakfast,
    muslimFriendlyScore,
    badges,
  }
}

// Format distance for display
export function formatDistance(metres: number | null): string {
  if (metres === null) return ''
  if (metres < 1000) return `${Math.round(metres)}m`
  return `${(metres / 1000).toFixed(1)}km`
}
