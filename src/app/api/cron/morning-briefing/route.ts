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

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient() as ReturnType<typeof createClient>
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const isoYesterday = yesterday.toISOString()

  try {
    // Gather all morning briefing data in parallel
    const [
      { count: pageViews },
      { count: searches },
      { count: leadClicks },
      { count: totalListings },
      { count: pendingReviews },
      { count: liveEvents },
      { data: recentListings },
      { data: recentReviews },
      { count: newUsers },
    ] = await Promise.all([
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view').gte('timestamp', isoYesterday),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('event_type', 'search_query').gte('timestamp', isoYesterday),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .in('event_type', ['click_website', 'click_directions', 'click_phone', 'click_booking'])
        .gte('timestamp', isoYesterday),
      db.from('listings').select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      db.from('reviews').select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      db.from('events').select('*', { count: 'exact', head: true })
        .eq('status', 'active').gte('start_datetime', now.toISOString()),
      db.from('listings').select('id, name, vertical, area, created_at')
        .order('created_at', { ascending: false }).limit(5),
      db.from('reviews').select('id, title, rating, created_at')
        .order('created_at', { ascending: false }).limit(5),
      db.from('user_profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', isoYesterday),
    ])

    // Store briefing summary in ai_activity_log
    const briefing = {
      date: now.toISOString().slice(0, 10),
      metrics: {
        page_views_24h: pageViews ?? 0,
        searches_24h: searches ?? 0,
        lead_clicks_24h: leadClicks ?? 0,
        total_listings: totalListings ?? 0,
        pending_reviews: pendingReviews ?? 0,
        live_events: liveEvents ?? 0,
        new_users_24h: newUsers ?? 0,
      },
      recent_listings: recentListings ?? [],
      recent_reviews: recentReviews ?? [],
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:morning-briefing',
      details: `Morning briefing for ${briefing.date}: ${pageViews ?? 0} views, ${searches ?? 0} searches, ${leadClicks ?? 0} leads`,
      metadata: briefing,
    })

    return NextResponse.json({ ok: true, briefing })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Morning briefing failed'
    console.error('[cron/morning-briefing]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
