export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLiteApiClient } from '@/lib/liteapi/client'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ places: [] })
  }

  let liteapi
  try {
    liteapi = getLiteApiClient()
  } catch {
    return NextResponse.json({ places: [] })
  }

  try {
    const result: any = await (liteapi as any).getPlaces({ textQuery: query })
    const places = (result?.data ?? []).map((p: any) => ({
      placeId: p.placeId ?? p.id,
      name: p.name ?? p.displayName,
      description: p.formattedAddress ?? p.description ?? '',
    }))
    return NextResponse.json({ places })
  } catch (err: any) {
    console.error('[travel/autocomplete] LiteAPI error:', err?.message)
    return NextResponse.json({ places: [] })
  }
}
