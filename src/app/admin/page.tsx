import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Morning Briefing | HumbleHalal Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalListings },
    { count: activeListings },
    { count: pendingReviews },
    { count: totalMosques },
    { count: upcomingEvents },
    { count: todayPageViews },
    { count: todayLeadClicks },
    { count: todaySearches },
    { data: recentListings },
    { data: recentReviews },
  ] = (await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('mosques').select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString()),
    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .gte('timestamp', today.toISOString()),
    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .in('event_type', ['click_website', 'click_directions', 'click_phone', 'click_booking'])
      .gte('timestamp', today.toISOString()),
    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'search_query')
      .gte('timestamp', today.toISOString()),
    supabase
      .from('listings')
      .select('id, name, area, status, created_at, vertical')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('id, rating, body, created_at, listing_id')
      .order('created_at', { ascending: false })
      .limit(5),
  ])) as any[]

  const dateStr = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-white/40 text-sm">{dateStr}</p>
        <h1 className="text-2xl font-extrabold text-white mt-1">Morning Briefing</h1>
      </div>

      {/* ── Today's pulse ────────────────────────────────────────── */}
      <div>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Today&apos;s Pulse</h2>
        <div className="grid grid-cols-3 gap-4">
          <BriefCard icon="pageview" label="Page Views" value={todayPageViews ?? 0} />
          <BriefCard icon="touch_app" label="Lead Clicks" value={todayLeadClicks ?? 0} />
          <BriefCard icon="search" label="Searches" value={todaySearches ?? 0} />
        </div>
      </div>

      {/* ── Platform totals ───────────────────────────────────────── */}
      <div>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Platform</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Listings', value: totalListings ?? 0, icon: 'store', href: '/admin/listings' },
            { label: 'Active', value: activeListings ?? 0, icon: 'check_circle', href: '/admin/listings' },
            { label: 'Pending Reviews', value: pendingReviews ?? 0, icon: 'rate_review', href: '/admin/moderation', alert: (pendingReviews ?? 0) > 0 },
            { label: 'Mosques', value: totalMosques ?? 0, icon: 'mosque', href: '/mosque' },
            { label: 'Live Events', value: upcomingEvents ?? 0, icon: 'event', href: '/events' },
          ].map(({ label, value, icon, href, alert }) => (
            <Link
              key={label}
              href={href}
              className={`bg-white/5 border rounded-xl p-4 hover:bg-white/10 transition-colors ${alert ? 'border-accent/60' : 'border-white/10'}`}
            >
              <span className={`material-symbols-outlined text-xl ${alert ? 'text-accent' : 'text-primary'}`}>{icon}</span>
              <p className={`text-2xl font-extrabold mt-2 ${alert ? 'text-accent' : 'text-white'}`}>{value.toLocaleString()}</p>
              <p className="text-white/50 text-xs">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'View Analytics', icon: 'bar_chart', href: '/admin/analytics' },
            { label: 'Content Autopilot', icon: 'auto_awesome', href: '/admin/content' },
            { label: 'Moderation Queue', icon: 'shield_check', href: '/admin/moderation' },
            { label: 'SEO Engine', icon: 'search', href: '/admin/seo' },
            { label: 'Settings', icon: 'settings', href: '/admin/settings' },
          ].map(({ label, icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-primary">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent activity ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent listings */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">Recent Listings</h2>
            <Link href="/admin/listings" className="text-primary text-xs hover:underline">View all →</Link>
          </div>
          {!recentListings || recentListings.length === 0 ? (
            <p className="text-white/40 text-sm">No listings yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {(recentListings as any[]).map((l) => (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white/80 text-sm truncate">{l.name}</p>
                    <p className="text-white/40 text-xs capitalize">{l.vertical} · {l.area}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    l.status === 'active' ? 'bg-primary/20 text-primary' :
                    l.status === 'pending' ? 'bg-accent/20 text-accent' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent reviews */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">Recent Reviews</h2>
            <Link href="/admin/moderation" className="text-primary text-xs hover:underline">View all →</Link>
          </div>
          {!recentReviews || recentReviews.length === 0 ? (
            <p className="text-white/40 text-sm">No reviews yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {(recentReviews as any[]).map((r) => (
                <li key={r.id} className="py-2.5 flex items-start gap-3">
                  <div className="flex gap-0.5 shrink-0 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`material-symbols-outlined text-xs ${i < r.rating ? 'text-accent' : 'text-white/20'}`}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-white/60 text-xs line-clamp-2 flex-1">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function BriefCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
      <p className="text-3xl font-extrabold text-white mt-2 tabular-nums">{value.toLocaleString()}</p>
      <p className="text-white/50 text-sm">{label}</p>
    </div>
  )
}
