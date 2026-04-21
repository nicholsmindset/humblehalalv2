export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLiteApiClient } from '@/lib/liteapi/client'
import { checkLimit, travelSearchLimiter, getIdentifier } from '@/lib/security/rate-limit'

export async function GET(request: NextRequest) {
  const rl = await checkLimit(travelSearchLimiter, getIdentifier(request))
  if (rl.limited) return rl.response

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ places: [] })

  try {
    const liteapi = getLiteApiClient()
    const result: any = await (liteapi as any).getPlaces(q)
    const rawPlaces: any[] = result?.data ?? []

    const places = rawPlaces.slice(0, 8).map((p: any) => ({
      placeId: p.placeId ?? p.id ?? '',
      name: p.displayName ?? p.name ?? '',
      description: p.formattedAddress ?? p.description ?? '',
      type: p.type ?? p.placeType ?? 'location',
    })).filter((p) => p.name && p.placeId)

    return NextResponse.json({ places })
  } catch (err: any) {
    console.error('[autocomplete] error:', err?.message)
    return NextResponse.json({ places: [] })
  }
}
