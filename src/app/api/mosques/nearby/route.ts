export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/mosques/nearby?lat=1.35&lng=103.82&radius=3000
 * Returns nearby mosques + prayer rooms sorted by distance using PostGIS RPCs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radius = parseInt(searchParams.get('radius') ?? '3000', 10)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const db = supabase as any

  const [{ data: mosques, error: mosqueErr }, { data: prayerRooms, error: prayerRoomErr }] =
    await Promise.all([
      db.rpc('nearby_mosques', {
        lat,
        lng,
        radius_m: radius,
        lim: 10,
      }),
      db.rpc('nearby_prayer_rooms', {
        lat,
        lng,
        radius_m: Math.min(radius, 2000),
        lim: 10,
      }),
    ])

  if (mosqueErr) console.error('[nearby] mosque RPC error:', mosqueErr)
  if (prayerRoomErr) console.error('[nearby] prayer room RPC error:', prayerRoomErr)

  return NextResponse.json({
    mosques: mosques ?? [],
    prayerRooms: prayerRooms ?? [],
  })
}
