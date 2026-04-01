import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LEAD_EVENTS = ['click_website', 'click_directions', 'click_phone', 'click_booking', 'click_menu', 'click_affiliate']

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Admin-only: verify user has admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listing_id')
  const since = searchParams.get('since')

  if (!listingId || !since) {
    return NextResponse.json({ error: 'listing_id and since are required' }, { status: 400 })
  }

  // Validate since is a valid ISO date
  const sinceDate = new Date(since)
  if (isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: 'Invalid since date' }, { status: 400 })
  }

  const [
    { data: impressionRows, count: impressionCount },
    { data: leadRows, count: leadCount },
    { data: allCategoryLeads },
    { data: allCategoryImpressions },
    { data: journeyRows },
  ] = await Promise.all([
    // Impressions for this listing
    supabase
      .from('analytics_events')
      .select('source_channel, referrer, timestamp', { count: 'exact' })
      .eq('listing_id', listingId)
      .eq('event_type', 'view_listing')
      .gte('timestamp', since)
      .limit(500),

    // Lead actions for this listing
    supabase
      .from('analytics_events')
      .select('event_type, timestamp', { count: 'exact' })
      .eq('listing_id', listingId)
      .in('event_type', LEAD_EVENTS)
      .gte('timestamp', since)
      .limit(1000),

    // Category average: lead actions for same vertical
    supabase
      .from('analytics_events')
      .select('listing_id')
      .in('event_type', LEAD_EVENTS)
      .gte('timestamp', since)
      .limit(2000),

    // Category average: impressions for same vertical
    supabase
      .from('analytics_events')
      .select('listing_id')
      .eq('event_type', 'view_listing')
      .gte('timestamp', since)
      .limit(2000),

    // Journey sessions: get sessions that interacted with this listing
    supabase
      .from('analytics_events')
      .select('session_id, source_channel, event_type, page_url')
      .eq('listing_id', listingId)
      .gte('timestamp', since)
      .order('timestamp', { ascending: true })
      .limit(200),
  ])

  // Calculate category average CTR
  // Group all events by listing_id to get per-listing counts
  const catLeadsByListing: Record<string, number> = {}
  const catImpsByListing: Record<string, number> = {}

  for (const r of allCategoryLeads ?? []) {
    const lid = (r as { listing_id: string | null }).listing_id
    if (lid) catLeadsByListing[lid] = (catLeadsByListing[lid] ?? 0) + 1
  }
  for (const r of allCategoryImpressions ?? []) {
    const lid = (r as { listing_id: string | null }).listing_id
    if (lid) catImpsByListing[lid] = (catImpsByListing[lid] ?? 0) + 1
  }

  const listingCtrs = Object.keys(catImpsByListing)
    .filter((lid) => catImpsByListing[lid] > 0)
    .map((lid) => ((catLeadsByListing[lid] ?? 0) / catImpsByListing[lid]) * 100)

  const categoryAvgCtr = listingCtrs.length > 0
    ? listingCtrs.reduce((sum, c) => sum + c, 0) / listingCtrs.length
    : 5 // fallback 5%

  // Build sample journeys from session data
  const sessionMap: Record<string, { source_channel: string | null; pages: string[]; action: string }> = {}
  for (const ev of journeyRows ?? []) {
    const row = ev as { session_id: string; source_channel: string | null; event_type: string; page_url: string | null }
    if (!sessionMap[row.session_id]) {
      sessionMap[row.session_id] = { source_channel: row.source_channel, pages: [], action: '' }
    }
    if (row.page_url) {
      const path = row.page_url.split('?')[0].replace('https://humblehalal.sg', '')
      if (!sessionMap[row.session_id].pages.includes(path)) {
        sessionMap[row.session_id].pages.push(path)
      }
    }
    if (LEAD_EVENTS.includes(row.event_type)) {
      sessionMap[row.session_id].action = row.event_type.replace('click_', 'Clicked ').replace('_', ' ')
    }
  }

  const journeys = Object.entries(sessionMap)
    .filter(([, v]) => v.action)
    .slice(0, 3)
    .map(([session_id, v]) => ({ session_id, ...v }))

  return NextResponse.json({
    impressions: impressionRows ?? [],
    impressionCount: impressionCount ?? 0,
    leadEvents: leadRows ?? [],
    leadCount: leadCount ?? 0,
    categoryAvgCtr: Math.round(categoryAvgCtr * 10) / 10,
    journeys,
  })
}
