import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Daily analytics rollup — 1am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient()

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dayStart = new Date(yesterday)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(yesterday)
    dayEnd.setHours(23, 59, 59, 999)

    const sinceIso = dayStart.toISOString()
    const untilIso = dayEnd.toISOString()
    const dateKey = dayStart.toISOString().slice(0, 10)

    const [
      { count: pageViews },
      { count: searches },
      { count: leadClicks },
      { data: sessions },
      { data: topAreas },
      { data: topCategories },
      { data: deviceBreakdown },
    ] = await Promise.all([
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view').gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('event_type', 'search_query').gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .in('event_type', ['click_website', 'click_directions', 'click_phone', 'click_booking'])
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('session_id')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('listing_area')
        .not('listing_area', 'is', null)
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('listing_category')
        .not('listing_category', 'is', null)
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('device_type')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
    ])

    const uniqueSessions = new Set(sessions?.map((s) => s.session_id)).size

    // Area frequencies
    const areaCounts = new Map<string, number>()
    for (const row of topAreas ?? []) {
      if (row.listing_area) {
        areaCounts.set(row.listing_area, (areaCounts.get(row.listing_area) ?? 0) + 1)
      }
    }
    const topAreaList = [...areaCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }))

    // Category frequencies
    const catCounts = new Map<string, number>()
    for (const row of topCategories ?? []) {
      if (row.listing_category) {
        catCounts.set(row.listing_category, (catCounts.get(row.listing_category) ?? 0) + 1)
      }
    }
    const topCategoryList = [...catCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }))

    // Device split
    let mobile = 0
    let desktop = 0
    for (const row of deviceBreakdown ?? []) {
      if (row.device_type === 'mobile') mobile++
      else desktop++
    }

    const rollup = {
      date: dateKey,
      page_views: pageViews ?? 0,
      searches: searches ?? 0,
      lead_clicks: leadClicks ?? 0,
      unique_sessions: uniqueSessions,
      top_areas: topAreaList,
      top_categories: topCategoryList,
      device_split: { mobile, desktop },
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:analytics-rollup',
      details: `Analytics rollup for ${dateKey}: ${pageViews ?? 0} views, ${uniqueSessions} sessions`,
      metadata: rollup,
    })

    return NextResponse.json({ ok: true, rollup })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analytics rollup failed'
    console.error('[cron/analytics-rollup]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
