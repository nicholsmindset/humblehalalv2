import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { CsvExportButton } from '@/components/admin/CsvExportButton'

type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']
type LiveFeedEvent = Pick<AnalyticsEvent, 'id' | 'event_type' | 'timestamp' | 'listing_name' | 'listing_area' | 'search_term' | 'page_url' | 'device_type' | 'source_channel'>

export const metadata: Metadata = {
  title: 'Analytics | HumbleHalal Admin',
}

// No ISR — always fresh for admin
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ range?: string }>
}

const RANGES = {
  today: { label: 'Today', days: 1 },
  '7d': { label: '7 Days', days: 7 },
  '30d': { label: '30 Days', days: 30 },
} as const

type RangeKey = keyof typeof RANGES

const EVENT_ICONS: Record<string, string> = {
  page_view: 'pageview',
  view_listing: 'store',
  click_website: 'open_in_new',
  click_directions: 'directions',
  click_phone: 'call',
  click_menu: 'menu_book',
  click_booking: 'calendar_month',
  click_affiliate: 'link',
  search_query: 'search',
  browse_category: 'category',
  save_listing: 'bookmark',
  submit_review: 'rate_review',
  share_listing: 'share',
  newsletter_click: 'mail',
  set_notification: 'notifications',
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const { range: rangeParam } = await searchParams
  const range: RangeKey = (rangeParam as RangeKey) in RANGES ? (rangeParam as RangeKey) : 'today'
  const { days } = RANGES[range]

  const supabase = await createClient()

  const now = new Date()
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000)

  // ── Parallel queries ───────────────────────────────────────────────────────

  const [
    { count: totalPageViews },
    { count: prevPageViews },
    { count: totalSearches },
    { count: prevSearches },
    { count: totalClicks },
    { count: prevClicks },
    { count: uniqueSessions },
    { data: topSearches },
    { data: topAreas },
    { data: topCategories },
    { data: topEventTypes },
    { data: liveFeed },
    { data: deviceSplit },
    { count: newsletterClicks },
    { data: leadListingRows },
    { data: unmatchedSearchData },
    { data: journeyData },
  ] = (await Promise.all([
    // Current period counts
    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .gte('timestamp', since.toISOString()),

    // Previous period page views (for delta)
    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .gte('timestamp', prevSince.toISOString())
      .lt('timestamp', since.toISOString()),

    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'search_query')
      .gte('timestamp', since.toISOString()),

    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'search_query')
      .gte('timestamp', prevSince.toISOString())
      .lt('timestamp', since.toISOString()),

    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .in('event_type', ['click_website', 'click_directions', 'click_phone', 'click_booking', 'click_menu'])
      .gte('timestamp', since.toISOString()),

    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .in('event_type', ['click_website', 'click_directions', 'click_phone', 'click_booking', 'click_menu'])
      .gte('timestamp', prevSince.toISOString())
      .lt('timestamp', since.toISOString()),

    // Unique sessions (approximate via count distinct workaround)
    supabase
      .from('analytics_events')
      .select('session_id', { count: 'exact', head: true })
      .gte('timestamp', since.toISOString()),

    // Top search terms
    supabase
      .from('analytics_events')
      .select('search_term')
      .eq('event_type', 'search_query')
      .gte('timestamp', since.toISOString())
      .not('search_term', 'is', null)
      .limit(200),

    // Top areas
    supabase
      .from('analytics_events')
      .select('listing_area')
      .gte('timestamp', since.toISOString())
      .not('listing_area', 'is', null)
      .limit(500),

    // Top categories
    supabase
      .from('analytics_events')
      .select('listing_category')
      .gte('timestamp', since.toISOString())
      .not('listing_category', 'is', null)
      .limit(500),

    // Event type breakdown
    supabase
      .from('analytics_events')
      .select('event_type')
      .gte('timestamp', since.toISOString())
      .limit(1000),

    // Live activity feed
    supabase
      .from('analytics_events')
      .select('id, event_type, timestamp, listing_name, listing_area, search_term, page_url, device_type, source_channel')
      .order('timestamp', { ascending: false })
      .limit(50),

    // Device split
    supabase
      .from('analytics_events')
      .select('device_type')
      .gte('timestamp', since.toISOString())
      .limit(1000),

    // Newsletter click-throughs
    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'newsletter_click')
      .gte('timestamp', since.toISOString()),

    // Top listing by lead actions
    supabase
      .from('analytics_events')
      .select('listing_id, listing_name, listing_area')
      .in('event_type', ['click_website', 'click_directions', 'click_phone', 'click_booking', 'click_menu'])
      .gte('timestamp', since.toISOString())
      .not('listing_id', 'is', null)
      .limit(1000),

    // Unmatched searches (search queries with no subsequent listing view in same session)
    supabase
      .from('analytics_events')
      .select('search_term, session_id, event_type')
      .in('event_type', ['search_query', 'view_listing'])
      .gte('timestamp', since.toISOString())
      .limit(2000),

    // Journey explorer (session paths)
    supabase
      .from('analytics_events')
      .select('session_id, event_type, page_url, listing_name, timestamp')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: true })
      .limit(3000),
  ])) as any[]

  // ── Aggregate client-side ──────────────────────────────────────────────────

  function countBy<T>(items: T[] | null, key: keyof T): { value: string; count: number }[] {
    const map: Record<string, number> = {}
    for (const item of items ?? []) {
      const val = String(item[key] ?? '')
      if (val) map[val] = (map[val] ?? 0) + 1
    }
    return Object.entries(map)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  function delta(current: number | null, previous: number | null): { pct: number; up: boolean } {
    const c = current ?? 0
    const p = previous ?? 0
    if (p === 0) return { pct: 0, up: true }
    const pct = Math.round(((c - p) / p) * 100)
    return { pct: Math.abs(pct), up: pct >= 0 }
  }

  const searchCounts = countBy(topSearches as AnalyticsEvent[] | null, 'search_term')
  const areaCounts = countBy(topAreas as AnalyticsEvent[] | null, 'listing_area')
  const categoryCounts = countBy(topCategories as AnalyticsEvent[] | null, 'listing_category')
  const eventTypeCounts = countBy(topEventTypes as AnalyticsEvent[] | null, 'event_type')
  const deviceCounts = countBy(deviceSplit as AnalyticsEvent[] | null, 'device_type')
  const typedLiveFeed = (liveFeed ?? []) as LiveFeedEvent[]

  const pvDelta = delta(totalPageViews, prevPageViews)
  const searchDelta = delta(totalSearches, prevSearches)
  const clickDelta = delta(totalClicks, prevClicks)

  // Conversion rate (lead clicks / page views)
  const convRate =
    (totalPageViews ?? 0) > 0
      ? (((totalClicks ?? 0) / (totalPageViews ?? 1)) * 100).toFixed(1)
      : '0.0'

  // Top performing listing by lead actions
  type LeadRow = { listing_id: string; listing_name: string | null; listing_area: string | null }
  const listingLeadCount: Record<string, { name: string; area: string; count: number }> = {}
  for (const row of (leadListingRows ?? []) as LeadRow[]) {
    if (!row.listing_id) continue
    if (!listingLeadCount[row.listing_id]) {
      listingLeadCount[row.listing_id] = {
        name: row.listing_name ?? 'Unknown',
        area: row.listing_area ?? '',
        count: 0,
      }
    }
    listingLeadCount[row.listing_id].count++
  }
  const topListing = Object.values(listingLeadCount).sort((a, b) => b.count - a.count)[0] ?? null

  // Unmatched searches: search_query events where the same session never had a view_listing
  type SearchRow = { search_term: string | null; session_id: string | null; event_type: string }
  const searchRows = (unmatchedSearchData ?? []) as SearchRow[]
  const sessionsWithViews = new Set(
    searchRows.filter((r) => r.event_type === 'view_listing').map((r) => r.session_id)
  )
  const unmatchedMap: Record<string, number> = {}
  for (const r of searchRows) {
    if (r.event_type === 'search_query' && r.search_term && r.session_id && !sessionsWithViews.has(r.session_id)) {
      const term = r.search_term.toLowerCase().trim()
      unmatchedMap[term] = (unmatchedMap[term] ?? 0) + 1
    }
  }
  const unmatchedSearches = Object.entries(unmatchedMap)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Journey explorer: group events by session, show top 10 longest sessions
  type JourneyRow = { session_id: string | null; event_type: string; page_url: string | null; listing_name: string | null; timestamp: string }
  const journeyRows = (journeyData ?? []) as JourneyRow[]
  const sessionMap: Record<string, { steps: { event: string; page: string; listing: string | null; time: string }[] }> = {}
  for (const r of journeyRows) {
    if (!r.session_id) continue
    if (!sessionMap[r.session_id]) sessionMap[r.session_id] = { steps: [] }
    sessionMap[r.session_id].steps.push({
      event: r.event_type,
      page: (r.page_url ?? '').replace('https://humblehalal.sg', ''),
      listing: r.listing_name,
      time: new Date(r.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }),
    })
  }
  const journeys = Object.entries(sessionMap)
    .filter(([, v]) => v.steps.length >= 3)
    .sort(([, a], [, b]) => b.steps.length - a.steps.length)
    .slice(0, 10)
    .map(([id, v]) => ({ sessionId: id.slice(0, 8), steps: v.steps }))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Engagement & demand intelligence</p>
        </div>

        {/* Date range tabs */}
        <div className="flex gap-1 bg-white/10 rounded-lg p-1 self-start sm:self-auto">
          {(Object.entries(RANGES) as [RangeKey, typeof RANGES[RangeKey]][]).map(([key, { label }]) => (
            <a
              key={key}
              href={`/admin/analytics?range=${key}`}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === key
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Overview stats ─────────────────────────────────────────────────── */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"><div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-w-[320px]">
        <StatCard
          icon="pageview"
          label="Page Views"
          value={totalPageViews ?? 0}
          delta={pvDelta}
          range={range}
        />
        <StatCard
          icon="search"
          label="Searches"
          value={totalSearches ?? 0}
          delta={searchDelta}
          range={range}
        />
        <StatCard
          icon="touch_app"
          label="Lead Clicks"
          value={totalClicks ?? 0}
          delta={clickDelta}
          range={range}
        />
        <StatCard
          icon="group"
          label="Sessions"
          value={uniqueSessions ?? 0}
          range={range}
        />
        <StatCard
          icon="mail"
          label="Newsletter CTR"
          value={newsletterClicks ?? 0}
          range={range}
        />
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-primary text-xl">percent</span>
          </div>
          <p className="text-3xl font-extrabold text-white tabular-nums">{convRate}%</p>
          <p className="text-white/50 text-sm mt-1">Conversion Rate</p>
          <p className="text-white/30 text-xs mt-0.5">lead clicks / page views</p>
        </div>
      </div></div>

      {/* ── Top Performing Listing ─────────────────────────────────────────── */}
      {topListing && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <span className="material-symbols-outlined text-accent text-3xl shrink-0">emoji_events</span>
          <div className="flex-1">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-0.5">Top Performing Listing</p>
            <p className="text-white font-bold">{topListing.name}</p>
            <p className="text-white/50 text-sm capitalize">{topListing.area}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-accent tabular-nums">{topListing.count}</p>
            <p className="text-white/40 text-xs">lead actions</p>
          </div>
        </div>
      )}

      {/* ── Demand Intelligence ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RankCard title="Top Searches" icon="search" items={searchCounts} emptyText="No search data yet"
          csvData={searchCounts.map((s) => ({ search_term: s.value, count: s.count }))} csvFilename="top-searches" />
        <RankCard title="Top Areas" icon="location_on" items={areaCounts} emptyText="No area data yet" capitalize
          csvData={areaCounts.map((s) => ({ area: s.value, count: s.count }))} csvFilename="top-areas" />
        <RankCard title="Top Categories" icon="category" items={categoryCounts} emptyText="No category data yet" capitalize
          csvData={categoryCounts.map((s) => ({ category: s.value, count: s.count }))} csvFilename="top-categories" />
      </div>

      {/* ── Event & Device breakdown ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
            Event Breakdown
          </h2>
          {eventTypeCounts.length === 0 ? (
            <p className="text-white/40 text-sm">No events yet</p>
          ) : (
            <div className="space-y-2">
              {eventTypeCounts.map(({ value, count }) => {
                const total = eventTypeCounts.reduce((s, e) => s + e.count, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={value}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white/70 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">
                          {EVENT_ICONS[value] ?? 'radio_button_checked'}
                        </span>
                        {value.replace(/_/g, ' ')}
                      </span>
                      <span className="text-white/60 tabular-nums">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">devices</span>
            Devices
          </h2>
          {deviceCounts.length === 0 ? (
            <p className="text-white/40 text-sm">No device data yet</p>
          ) : (
            <div className="space-y-4">
              {deviceCounts.map(({ value, count }) => {
                const total = deviceCounts.reduce((s, e) => s + e.count, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={value} className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-accent text-2xl">
                      {value === 'mobile' ? 'smartphone' : 'computer'}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white capitalize">{value}</span>
                        <span className="text-white/60">{pct}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-white/50 text-sm tabular-nums w-12 text-right">{count.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Brand / Sponsor Deep Dive ─────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">storefront</span>
          Brand / Sponsor Deep Dive
        </h2>
        <p className="text-white/50 text-sm mb-5">
          Generate a per-brand analytics report showing impressions, lead actions, CTR vs category average, traffic sources, and visitor journeys — ready to email to sponsors as proof of ROI.
        </p>
        <a
          href="/admin/reports"
          className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
          Generate Sponsor Report
        </a>
      </div>

      {/* ── Unmatched Searches ──────────────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">search_off</span>
          Unmatched Searches
          <span className="ml-auto flex items-center gap-2">
            <span className="text-white/40 text-xs font-normal">Searches with 0 results viewed</span>
            <CsvExportButton
              data={unmatchedSearches.map((s) => ({ search_term: s.term, count: s.count }))}
              filename="unmatched-searches"
            />
          </span>
        </h2>
        <p className="text-white/40 text-sm mb-4">
          These search terms led to no listing views — potential content gaps or new business opportunities.
        </p>
        {unmatchedSearches.length === 0 ? (
          <p className="text-white/30 text-sm">No unmatched searches in this period.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unmatchedSearches.map(({ term, count }) => (
              <div
                key={term}
                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-white/70 text-sm truncate">&ldquo;{term}&rdquo;</span>
                <span className="text-accent text-xs font-bold tabular-nums shrink-0 ml-2">{count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Journey Explorer ─────────────────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">route</span>
          Journey Explorer
          <span className="ml-auto text-white/40 text-xs font-normal">Top 10 longest sessions</span>
        </h2>
        <p className="text-white/40 text-sm mb-4">
          Full navigation paths showing how visitors discover and interact with listings.
        </p>
        {journeys.length === 0 ? (
          <p className="text-white/30 text-sm">No multi-step sessions in this period.</p>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {journeys.map(({ sessionId, steps }) => (
              <div key={sessionId} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-sm text-white/40">person</span>
                  <span className="text-white/50 text-xs font-mono">{sessionId}…</span>
                  <span className="text-white/30 text-xs">{steps.length} steps</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-white/20 text-xs">→</span>}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          step.event.startsWith('click_')
                            ? 'bg-accent/20 text-accent'
                            : step.event === 'search_query'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-white/10 text-white/60'
                        }`}
                        title={step.page || step.event}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {EVENT_ICONS[step.event] ?? 'radio_button_checked'}
                        </span>
                        {step.listing ?? step.page.split('/').pop() ?? step.event.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Live Activity Feed ─────────────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">sensors</span>
          Live Activity
          <span className="ml-auto text-white/40 text-xs font-normal">Last 50 events</span>
        </h2>

        {typedLiveFeed.length === 0 ? (
          <p className="text-white/40 text-sm">No events recorded yet.</p>
        ) : (
          <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
            {typedLiveFeed.map((evt) => {
              const ts = new Date(evt.timestamp)
              const timeStr = ts.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              const dateStr = ts.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })
              const now2 = new Date()
              const isToday = ts.toDateString() === now2.toDateString()

              return (
                <div key={evt.id} className="flex items-start gap-3 py-3">
                  <span className="material-symbols-outlined text-base text-primary mt-0.5 shrink-0">
                    {EVENT_ICONS[evt.event_type] ?? 'radio_button_checked'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium">
                      {evt.event_type.replace(/_/g, ' ')}
                      {evt.listing_name && (
                        <span className="text-white/50 font-normal"> · {evt.listing_name}</span>
                      )}
                      {evt.search_term && (
                        <span className="text-accent font-normal"> &ldquo;{evt.search_term}&rdquo;</span>
                      )}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {evt.listing_area && <span className="capitalize">{evt.listing_area} · </span>}
                      {evt.source_channel && <span>{evt.source_channel} · </span>}
                      {evt.device_type && <span>{evt.device_type} · </span>}
                      {evt.page_url && (
                        <span className="truncate">{evt.page_url.replace('https://humblehalal.sg', '')}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white/50 text-xs tabular-nums">{timeStr}</p>
                    {!isToday && <p className="text-white/30 text-xs">{dateStr}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  delta,
  range,
}: {
  icon: string
  label: string
  value: number
  delta?: { pct: number; up: boolean }
  range: RangeKey
}) {
  const { label: rangeLabel } = RANGES[range]
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        {delta && delta.pct > 0 && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              delta.up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {delta.up ? '↑' : '↓'} {delta.pct}%
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-white tabular-nums">{value.toLocaleString()}</p>
      <p className="text-white/50 text-sm mt-1">{label}</p>
      <p className="text-white/30 text-xs mt-0.5">vs prev {rangeLabel.toLowerCase()}</p>
    </div>
  )
}

function RankCard({
  title,
  icon,
  items,
  emptyText,
  capitalize,
  csvData,
  csvFilename,
}: {
  title: string
  icon: string
  items: { value: string; count: number }[]
  emptyText: string
  capitalize?: boolean
  csvData?: Record<string, string | number>[]
  csvFilename?: string
}) {
  const max = items[0]?.count ?? 1
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        {title}
        {csvData && csvFilename && (
          <span className="ml-auto">
            <CsvExportButton data={csvData} filename={csvFilename} />
          </span>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="text-white/40 text-sm">{emptyText}</p>
      ) : (
        <ol className="space-y-2">
          {items.map(({ value, count }, i) => (
            <li key={value} className="flex items-center gap-3">
              <span className="text-white/30 text-xs w-4 text-right tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm mb-0.5">
                  <span className={`text-white/80 truncate ${capitalize ? 'capitalize' : ''}`}>
                    {value.replace(/-/g, ' ')}
                  </span>
                  <span className="text-white/50 tabular-nums shrink-0 ml-2">{count}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full"
                    style={{ width: `${Math.round((count / max) * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
