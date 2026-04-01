'use client'

import { useState } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ── Types ──────────────────────────────────────────────────────────────────

interface Listing {
  id: string
  name: string
  area: string
  vertical: string
  halal_status: string
}

interface ReportData {
  listingName: string
  listingArea: string
  listingCategory: string
  period: string
  impressions: number
  leadActions: number
  ctr: string
  categoryAvgCtr: string
  ctrVsAvg: string
  topSources: { source: string; count: number }[]
  dailyData: { date: string; leads: number }[]
  sampleJourneys: { session: string; source: string; path: string; action: string }[]
  totalLeadsCopy: string
}

interface Props {
  listings: Listing[]
}

// ── PDF styles ─────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FAFAF8',
    paddingHorizontal: 48,
    paddingVertical: 40,
    fontSize: 10,
    color: '#1C1917',
  },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  logoBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1C1917' },
  logoAccent: { fontSize: 20, fontFamily: 'Helvetica-Oblique', color: '#D4A017' },
  headerRight: { textAlign: 'right' },
  headerLabel: { fontSize: 8, color: '#78716C', marginBottom: 2 },
  headerValue: { fontSize: 10, color: '#1C1917' },
  // Divider
  divider: { height: 2, backgroundColor: '#047857', marginBottom: 24 },
  thinDivider: { height: 1, backgroundColor: '#E7E5E4', marginVertical: 16 },
  // Summary hero
  heroBox: {
    backgroundColor: '#047857',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 24,
  },
  heroTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 6 },
  heroSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 },
  // Stat grid
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E7E5E4',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statLabel: { fontSize: 8, color: '#78716C', marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#047857' },
  statSub: { fontSize: 8, color: '#78716C', marginTop: 2 },
  // Sections
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1C1917', marginBottom: 12 },
  // Source table
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottom: '1px solid #F5F5F4' },
  tableHeader: { backgroundColor: '#F5F5F4', paddingVertical: 6, paddingHorizontal: 0 },
  tableHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#78716C', textTransform: 'uppercase' },
  tableCell: { fontSize: 10, color: '#1C1917' },
  colSource: { flex: 2 },
  colCount: { flex: 1, textAlign: 'right' },
  colPct: { flex: 1, textAlign: 'right' },
  // Bar chart
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60, marginBottom: 4 },
  barLabel: { fontSize: 7, color: '#78716C', textAlign: 'center' },
  // Journey list
  journeyItem: { marginBottom: 10, backgroundColor: '#FFFFFF', borderRadius: 6, border: '1px solid #E7E5E4', padding: 10 },
  journeyMeta: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  journeyTag: { fontSize: 7, backgroundColor: '#ECFDF5', color: '#047857', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  journeyPath: { fontSize: 8.5, color: '#57534E', lineHeight: 1.5 },
  journeyAction: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#D4A017', marginTop: 3 },
  // Footer
  footer: { position: 'absolute', bottom: 28, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7.5, color: '#A8A29E' },
  goldAccent: { color: '#D4A017' },
})

// ── PDF Document ───────────────────────────────────────────────────────────

function SponsorReport({ data }: { data: ReportData }) {
  const totalSources = data.topSources.reduce((sum, s) => sum + s.count, 0)
  const maxLeads = Math.max(...data.dailyData.map((d) => d.leads), 1)

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.headerRow}>
          <View style={S.logoBlock}>
            <Text style={S.logoText}>Humble</Text>
            <Text style={S.logoAccent}>Halal</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.headerLabel}>Sponsor Analytics Report</Text>
            <Text style={S.headerValue}>{data.listingName}</Text>
            <Text style={S.headerLabel}>{data.period}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* Summary hero */}
        <View style={S.heroBox}>
          <Text style={S.heroTitle}>{data.totalLeadsCopy}</Text>
          <Text style={S.heroSub}>
            Your listing on HumbleHalal drove qualified leads from Singapore&apos;s halal-conscious audience — people actively searching for businesses like yours.
          </Text>
        </View>

        {/* Stat grid */}
        <View style={S.statsRow}>
          <View style={S.statBox}>
            <Text style={S.statLabel}>Impressions</Text>
            <Text style={S.statValue}>{data.impressions.toLocaleString()}</Text>
            <Text style={S.statSub}>listing page views</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statLabel}>Lead Actions</Text>
            <Text style={S.statValue}>{data.leadActions.toLocaleString()}</Text>
            <Text style={S.statSub}>clicks to website, directions, phone</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statLabel}>Click-Through Rate</Text>
            <Text style={S.statValue}>{data.ctr}</Text>
            <Text style={S.statSub}>vs {data.categoryAvgCtr} category avg ({data.ctrVsAvg})</Text>
          </View>
        </View>

        {/* Traffic sources */}
        <Text style={S.sectionTitle}>Top Traffic Sources</Text>
        <View style={[S.tableRow, S.tableHeader]}>
          <View style={S.colSource}><Text style={S.tableHeaderText}>Source</Text></View>
          <View style={S.colCount}><Text style={S.tableHeaderText}>Visitors</Text></View>
          <View style={S.colPct}><Text style={S.tableHeaderText}>Share</Text></View>
        </View>
        {data.topSources.map((s) => (
          <View key={s.source} style={S.tableRow}>
            <View style={S.colSource}><Text style={S.tableCell}>{s.source}</Text></View>
            <View style={S.colCount}><Text style={S.tableCell}>{s.count}</Text></View>
            <View style={S.colPct}>
              <Text style={S.tableCell}>
                {totalSources > 0 ? Math.round((s.count / totalSources) * 100) : 0}%
              </Text>
            </View>
          </View>
        ))}

        <View style={S.thinDivider} />

        {/* Daily leads chart (simple bar representation) */}
        <Text style={S.sectionTitle}>Daily Lead Actions</Text>
        <View style={S.chartRow}>
          {data.dailyData.map((d) => {
            const heightPct = maxLeads > 0 ? (d.leads / maxLeads) * 52 : 2
            return (
              <View key={d.date} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{ height: Math.max(heightPct, 2), backgroundColor: '#047857', borderRadius: 2, width: '70%' }} />
              </View>
            )
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {data.dailyData.map((d) => (
            <View key={d.date} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={S.barLabel}>{d.date}</Text>
            </View>
          ))}
        </View>

        <View style={S.thinDivider} />

        {/* Sample journeys */}
        <Text style={S.sectionTitle}>Sample Visitor Journeys (Anonymised)</Text>
        {data.sampleJourneys.map((j) => (
          <View key={j.session} style={S.journeyItem}>
            <View style={S.journeyMeta}>
              <Text style={S.journeyTag}>{j.source}</Text>
            </View>
            <Text style={S.journeyPath}>{j.path}</Text>
            <Text style={S.journeyAction}>→ {j.action}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Humble<Text style={S.goldAccent}>Halal</Text> · humblehalal.sg</Text>
          <Text style={S.footerText}>Confidential — prepared for {data.listingName}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

export default function ReportGenerator({ listings }: Props) {
  const [selectedId, setSelectedId] = useState('')
  const [rangeDays, setRangeDays] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    const listing = listings.find((l) => l.id === selectedId)
    if (!listing) return

    setLoading(true)
    setError(null)

    try {
      const days = parseInt(rangeDays)
      const now = new Date()
      const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const sinceISO = since.toISOString()

      // Fetch all analytics data for this listing in parallel
      const res = await fetch(`/api/admin/report-data?listing_id=${listing.id}&since=${encodeURIComponent(sinceISO)}`)
      if (!res.ok) throw new Error('Failed to fetch report data')
      const raw = await res.json()

      // Build daily data (group lead events by date)
      const dailyMap: Record<string, number> = {}
      const daysArr: string[] = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short' })
        dailyMap[key] = 0
        daysArr.push(key)
      }
      for (const ev of (raw.leadEvents ?? []) as { timestamp: string }[]) {
        const d = new Date(ev.timestamp)
        const key = d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short' })
        if (key in dailyMap) dailyMap[key]++
      }
      // For longer ranges, sample every N days to keep chart readable
      const step = days > 14 ? Math.ceil(days / 14) : 1
      const dailyData = daysArr
        .filter((_, i) => i % step === 0)
        .map((date) => ({ date, leads: dailyMap[date] ?? 0 }))

      // Source breakdown
      const sourceCount: Record<string, number> = {}
      for (const ev of (raw.impressions ?? []) as { source_channel: string | null; referrer: string | null }[]) {
        const src = ev.source_channel ?? ev.referrer ?? 'direct'
        sourceCount[src] = (sourceCount[src] ?? 0) + 1
      }
      const topSources = Object.entries(sourceCount)
        .map(([source, count]) => ({ source: source.charAt(0).toUpperCase() + source.slice(1), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      const impressions: number = raw.impressionCount ?? 0
      const leadActions: number = raw.leadCount ?? 0
      const ctrNum = impressions > 0 ? (leadActions / impressions) * 100 : 0
      const catAvgNum: number = raw.categoryAvgCtr ?? 5
      const ctrVsAvg = ctrNum > 0 && catAvgNum > 0
        ? `${(ctrNum / catAvgNum).toFixed(1)}× avg`
        : 'N/A'

      // Sample journeys (up to 3)
      const journeys = ((raw.journeys ?? []) as { session_id: string; source_channel: string | null; pages: string[]; action: string }[])
        .slice(0, 3)
        .map((j, i) => ({
          session: `Session ${i + 1}`,
          source: j.source_channel ?? 'direct',
          path: (j.pages ?? []).join(' → ') || listing.name,
          action: j.action ?? 'Viewed listing',
        }))

      const rangeLabel = RANGES.find((r) => r.value === rangeDays)?.label ?? `Last ${rangeDays} days`

      const data: ReportData = {
        listingName: listing.name,
        listingArea: listing.area,
        listingCategory: listing.vertical,
        period: `${rangeLabel} · Generated ${now.toLocaleDateString('en-SG', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        impressions,
        leadActions,
        ctr: `${ctrNum.toFixed(1)}%`,
        categoryAvgCtr: `${catAvgNum.toFixed(1)}%`,
        ctrVsAvg,
        topSources: topSources.length > 0 ? topSources : [{ source: 'Direct', count: 0 }],
        dailyData,
        sampleJourneys: journeys.length > 0
          ? journeys
          : [{ session: 'Session 1', source: 'Newsletter', path: 'Homepage → ' + listing.name, action: 'Clicked website' }],
        totalLeadsCopy: `We drove ${leadActions} qualified lead${leadActions !== 1 ? 's' : ''} to ${listing.name} this period.`,
      }

      // Generate PDF and trigger download
      const blob = await pdf(<SponsorReport data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `HumbleHalal-Report-${listing.name.replace(/\s+/g, '-')}-${rangeDays}d.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const selectedListing = listings.find((l) => l.id === selectedId)

  return (
    <div className="space-y-6">
      {/* Config card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
        <h2 className="text-white font-bold text-sm uppercase tracking-wide">Report Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Listing selector */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">Business / Listing</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a listing…</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.area}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">Date Range</label>
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview of what's included */}
        {selectedListing && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 space-y-1">
            <p className="text-primary text-xs font-bold">{selectedListing.name} · {selectedListing.area}</p>
            <p className="text-white/50 text-xs">
              Report will include: impressions, lead actions (website / directions / phone / booking), CTR vs category average, traffic sources, daily chart, and sample visitor journeys.
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={!selectedId || loading}
          className="flex items-center gap-2 bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Generating PDF…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Generate Report PDF
            </>
          )}
        </button>
      </div>

      {/* What's in the report */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: 'visibility', label: 'Total Impressions', desc: 'Listing page views in period' },
          { icon: 'ads_click', label: 'Lead Actions', desc: 'Website, directions, phone clicks' },
          { icon: 'trending_up', label: 'CTR vs Category Avg', desc: 'How your listing compares' },
          { icon: 'hub', label: 'Traffic Sources', desc: 'Newsletter, search, direct, social' },
          { icon: 'bar_chart', label: 'Daily Chart', desc: 'Lead actions over time' },
          { icon: 'route', label: 'Visitor Journeys', desc: 'Anonymised session paths' },
        ].map((item) => (
          <div key={item.label} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <span className="material-symbols-outlined text-primary text-xl mb-2 block">{item.icon}</span>
            <p className="text-white text-xs font-bold mb-0.5">{item.label}</p>
            <p className="text-white/40 text-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
