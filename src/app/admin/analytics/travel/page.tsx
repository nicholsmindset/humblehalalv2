import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Travel Analytics | HumbleHalal Admin',
}

export const dynamic = 'force-dynamic'

function fmt(amount: number, currency = 'SGD') {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
}

function fmtN(n: number) {
  return new Intl.NumberFormat('en-SG').format(n)
}

export default async function TravelAnalyticsPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any

  const now = new Date()
  const start30d = new Date(now); start30d.setDate(start30d.getDate() - 30)
  const startMo  = new Date(now.getFullYear(), now.getMonth(), 1)

  // Booking stats
  const [
    { data: allBookings },
    { data: monthBookings },
    { data: searchLog },
    { data: flightClicks },
  ] = await Promise.all([
    db.from('travel_bookings')
      .select('id, status, total_amount, currency, hotel_city, created_at')
      .order('created_at', { ascending: false }),
    db.from('travel_bookings')
      .select('id, status, total_amount, currency')
      .gte('created_at', startMo.toISOString()),
    db.from('travel_search_log')
      .select('destination, created_at')
      .gte('created_at', start30d.toISOString())
      .order('created_at', { ascending: false }),
    db.from('analytics_events')
      .select('id, search_term, timestamp')
      .eq('event_type', 'click_flight_affiliate')
      .gte('timestamp', start30d.toISOString()),
  ])

  const confirmed = (allBookings ?? []).filter((b: any) => b.status === 'confirmed')
  const cancelled = (allBookings ?? []).filter((b: any) => b.status === 'cancelled')

  const totalRevenue   = confirmed.reduce((s: number, b: any) => s + (b.total_amount ?? 0), 0)
  const monthRevenue   = (monthBookings ?? []).filter((b: any) => b.status === 'confirmed')
    .reduce((s: number, b: any) => s + (b.total_amount ?? 0), 0)
  const avgBookingVal  = confirmed.length > 0 ? totalRevenue / confirmed.length : 0

  // Commission estimate (12% margin on avg)
  const COMMISSION_RATE = 0.12
  const totalCommission = totalRevenue * COMMISSION_RATE
  const monthCommission = monthRevenue * COMMISSION_RATE

  // Top searched destinations (last 30d)
  const destCounts: Record<string, number> = {}
  for (const s of (searchLog ?? [])) {
    if (s.destination) destCounts[s.destination] = (destCounts[s.destination] ?? 0) + 1
  }
  const topDestinations = Object.entries(destCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  // Top booked cities
  const cityCounts: Record<string, number> = {}
  for (const b of confirmed) {
    if (b.hotel_city) cityCounts[b.hotel_city] = (cityCounts[b.hotel_city] ?? 0) + 1
  }
  const topCities = Object.entries(cityCounts).sort(([, a], [, b]) => b - a).slice(0, 8)

  // Recent bookings
  const recent = (allBookings ?? []).slice(0, 10)

  const STATUS_PILL: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700',
    pending:   'bg-amber-50 text-amber-700',
    cancelled: 'bg-red-50 text-red-500',
    completed: 'bg-gray-100 text-charcoal/50',
    failed:    'bg-red-50 text-red-400',
  }

  return (
    <div className="p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/analytics" className="text-xs text-charcoal/40 hover:text-primary flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Analytics
          </Link>
          <h1 className="text-2xl font-extrabold text-charcoal">Travel Commission Analytics</h1>
          <p className="text-charcoal/50 text-sm mt-0.5">LiteAPI hotel bookings · Skyscanner affiliate</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/travel/hotels"
            target="_blank"
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-charcoal/60 hover:text-primary hover:border-primary/40 transition-colors"
          >
            Hotel search ↗
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total commission (est.)',
            value: fmt(totalCommission),
            sub: `${COMMISSION_RATE * 100}% of ${fmt(totalRevenue)} GMV`,
            icon: 'payments',
            colour: 'text-primary',
          },
          {
            label: 'This month commission',
            value: fmt(monthCommission),
            sub: `from ${fmt(monthRevenue)} revenue`,
            icon: 'trending_up',
            colour: 'text-primary',
          },
          {
            label: 'Confirmed bookings',
            value: fmtN(confirmed.length),
            sub: `${cancelled.length} cancelled · avg ${fmt(avgBookingVal)}`,
            icon: 'hotel',
            colour: 'text-charcoal',
          },
          {
            label: 'Flight affiliate clicks',
            value: fmtN((flightClicks ?? []).length),
            sub: 'last 30 days',
            icon: 'flight',
            colour: 'text-charcoal',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wide">{stat.label}</p>
              <span className={`material-symbols-outlined text-lg ${stat.colour}`}>{stat.icon}</span>
            </div>
            <p className={`text-2xl font-extrabold ${stat.colour}`}>{stat.value}</p>
            <p className="text-xs text-charcoal/40 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top searched destinations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">travel_explore</span>
            Top searched destinations (30d)
          </h2>
          {topDestinations.length === 0 ? (
            <p className="text-sm text-charcoal/40 text-center py-6">No search data yet</p>
          ) : (
            <div className="space-y-2">
              {topDestinations.map(([dest, count], i) => {
                const max = topDestinations[0][1]
                const pct = Math.round((count / max) * 100)
                return (
                  <div key={dest}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-charcoal">{i + 1}. {dest}</span>
                      <span className="text-charcoal/50">{fmtN(count)} searches</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <Link
            href="/travel"
            className="block text-xs text-primary font-semibold mt-4 hover:underline"
          >
            View pSEO city pages →
          </Link>
        </div>

        {/* Top booked cities */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">hotel</span>
            Top booked cities
          </h2>
          {topCities.length === 0 ? (
            <p className="text-sm text-charcoal/40 text-center py-6">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {topCities.map(([city, count], i) => (
                <div key={city} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal">
                    <span className="text-charcoal/40 text-xs mr-2">{i + 1}.</span>
                    {city}
                  </span>
                  <span className="font-bold text-charcoal">{fmtN(count)} booking{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-charcoal">Recent bookings</h2>
          <span className="text-xs text-charcoal/40">{fmtN((allBookings ?? []).length)} total</span>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-charcoal/40 text-center py-10">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Date', 'Hotel', 'City', 'Amount', 'Commission (est.)', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-charcoal/50 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-charcoal/50 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate font-medium text-charcoal">
                      <Link href={`/travel/bookings/${b.id}`} className="hover:text-primary transition-colors">
                        {b.hotel_name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-charcoal/70 whitespace-nowrap">{b.hotel_city ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-charcoal whitespace-nowrap">
                      {b.status === 'confirmed' ? fmt(b.total_amount, b.currency) : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">
                      {b.status === 'confirmed' ? fmt(b.total_amount * COMMISSION_RATE, b.currency) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_PILL[b.status] ?? 'bg-gray-100 text-charcoal/50'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demand intelligence — unserved destinations */}
      {topDestinations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-bold text-charcoal mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">lightbulb</span>
            Content gap opportunities
          </h2>
          <p className="text-sm text-charcoal/60 mb-3">
            These destinations are frequently searched but may not have pSEO landing pages yet.
            Create travel guide content to capture organic traffic.
          </p>
          <div className="flex flex-wrap gap-2">
            {topDestinations.slice(0, 6).map(([dest, count]) => (
              <span key={dest} className="text-xs bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-charcoal font-semibold">
                {dest} ({fmtN(count)})
              </span>
            ))}
          </div>
          <Link
            href="/admin/content"
            className="inline-block mt-3 text-xs text-primary font-semibold hover:underline"
          >
            Go to Content Autopilot →
          </Link>
        </div>
      )}
    </div>
  )
}
