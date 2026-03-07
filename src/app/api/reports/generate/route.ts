import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import React from 'react'

export const dynamic = 'force-dynamic'

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FAFAF8',
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // Cover band
  coverBand: {
    backgroundColor: '#047857',
    padding: 40,
    paddingBottom: 32,
  },
  coverSiteName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  coverTagline: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 4,
  },
  coverReportTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginTop: 28,
    lineHeight: 1.2,
  },
  coverMeta: {
    fontSize: 10,
    color: '#D4A017',
    marginTop: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  // Body
  body: {
    paddingHorizontal: 40,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1C1917',
    marginBottom: 10,
    marginTop: 24,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  // Metric cards row
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 8,
    color: '#6B7280',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#047857',
  },
  metricSub: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 4,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: '8 10',
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '7 10',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 9,
    color: '#1C1917',
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  confidentialBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    padding: '2 6',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  confidentialText: {
    fontSize: 8,
    color: '#92400E',
    fontFamily: 'Helvetica-Bold',
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysFromRange(range: string): number {
  const map: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, mtd: new Date().getDate() }
  return map[range] ?? 30
}

function rangeLabelHuman(range: string): string {
  const map: Record<string, string> = {
    '7d': 'Last 7 Days', '30d': 'Last 30 Days',
    '90d': 'Last 90 Days', mtd: 'Month to Date',
  }
  return map[range] ?? range
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-SG')
}

// ── PDF components ────────────────────────────────────────────────────────────

function CoverPage({ title, range, sponsorName }: { title: string; range: string; sponsorName: string }) {
  return React.createElement(
    Page,
    { size: 'A4', style: styles.page },
    React.createElement(
      View,
      { style: styles.coverBand },
      React.createElement(Text, { style: styles.coverSiteName }, 'HumbleHalal'),
      React.createElement(Text, { style: styles.coverTagline }, "Singapore's Halal Ecosystem"),
      React.createElement(Text, { style: styles.coverReportTitle }, title),
      sponsorName
        ? React.createElement(Text, { style: { ...styles.coverMeta, marginTop: 8 } }, `Prepared for: ${sponsorName}`)
        : null,
      React.createElement(Text, { style: styles.coverMeta }, `Period: ${rangeLabelHuman(range)}`),
      React.createElement(Text, { style: { ...styles.coverMeta, fontFamily: 'Helvetica', opacity: 0.7 } },
        `Generated: ${new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}`),
      React.createElement(
        View,
        { style: styles.confidentialBadge },
        React.createElement(Text, { style: styles.confidentialText }, 'CONFIDENTIAL')
      )
    ),
    React.createElement(
      View,
      { style: styles.footer },
      React.createElement(Text, { style: styles.footerText }, 'HumbleHalal.sg — Singapore\'s Halal Directory'),
      React.createElement(Text, { style: styles.footerText }, 'Page 1')
    )
  )
}

function MetricsSection({ data }: { data: Array<{ label: string; value: string; sub: string }> }) {
  const rows: Array<typeof data> = []
  for (let i = 0; i < data.length; i += 3) rows.push(data.slice(i, i + 3))

  return React.createElement(
    View,
    null,
    ...rows.map((row, ri) =>
      React.createElement(
        View,
        { key: ri, style: styles.metricsRow },
        ...row.map((m, mi) =>
          React.createElement(
            View,
            { key: mi, style: styles.metricCard },
            React.createElement(Text, { style: styles.metricLabel }, m.label),
            React.createElement(Text, { style: styles.metricValue }, m.value),
            React.createElement(Text, { style: styles.metricSub }, m.sub)
          )
        )
      )
    )
  )
}

function TableSection({
  headers,
  rows,
  widths,
}: {
  headers: string[]
  rows: string[][]
  widths: number[]
}) {
  return React.createElement(
    View,
    null,
    // Header row
    React.createElement(
      View,
      { style: styles.tableHeader },
      ...headers.map((h, i) =>
        React.createElement(Text, { key: i, style: { ...styles.tableCellHeader, flex: widths[i] } }, h)
      )
    ),
    // Data rows
    ...rows.map((row, ri) =>
      React.createElement(
        View,
        { key: ri, style: styles.tableRow },
        ...row.map((cell, ci) =>
          React.createElement(Text, { key: ci, style: { ...styles.tableCell, flex: widths[ci] } }, cell)
        )
      )
    )
  )
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { type = 'sponsor', dateRange = '30d', sponsorName = '' } = body as {
    type: string; dateRange: string; sponsorName: string
  }

  const days = daysFromRange(dateRange)
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString()

  // ── Fetch data ───────────────────────────────────────────────────────────────

  // Analytics events summary
  const { data: events } = await supabase
    .from('analytics_events')
    .select('event_type, listing_name, listing_area, search_term, source_channel, device_type')
    .gte('timestamp', since)
    .limit(5000)

  const eventsArr = events ?? []
  const totalEvents = eventsArr.length
  const pageViews = eventsArr.filter((e) => e.event_type === 'page_view').length
  const listingViews = eventsArr.filter((e) => e.event_type === 'view_listing').length
  const websiteClicks = eventsArr.filter((e) => e.event_type === 'click_website').length
  const searches = eventsArr.filter((e) => e.event_type === 'search_query').length
  const ctr = listingViews > 0 ? ((websiteClicks / listingViews) * 100).toFixed(1) : '0.0'

  // Top listings by view
  const listingViewCounts: Record<string, number> = {}
  eventsArr
    .filter((e) => e.event_type === 'view_listing' && e.listing_name)
    .forEach((e) => {
      listingViewCounts[e.listing_name!] = (listingViewCounts[e.listing_name!] ?? 0) + 1
    })
  const topListings = Object.entries(listingViewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // Top search terms
  const searchCounts: Record<string, number> = {}
  eventsArr
    .filter((e) => e.event_type === 'search_query' && e.search_term)
    .forEach((e) => {
      searchCounts[e.search_term!] = (searchCounts[e.search_term!] ?? 0) + 1
    })
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // Source breakdown
  const sourceCounts: Record<string, number> = {}
  eventsArr.forEach((e) => {
    const src = e.source_channel ?? 'direct'
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1
  })
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // Listings count for listings report
  const { count: totalListings } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  // ── Build PDF ────────────────────────────────────────────────────────────────

  const REPORT_TITLES: Record<string, string> = {
    sponsor: 'Sponsor Performance Report',
    listings: 'Listings Overview Report',
    analytics: 'Analytics Summary Report',
    seo: 'SEO Audit Report',
  }

  const title = REPORT_TITLES[type] ?? 'Performance Report'

  const metricsData = [
    { label: 'Total Events', value: fmtNum(totalEvents), sub: `in ${rangeLabelHuman(dateRange)}` },
    { label: 'Page Views', value: fmtNum(pageViews), sub: 'all pages' },
    { label: 'Listing Views', value: fmtNum(listingViews), sub: 'directory listings' },
    { label: 'Website Clicks', value: fmtNum(websiteClicks), sub: 'outbound to business sites' },
    { label: 'CTR (Views→Clicks)', value: `${ctr}%`, sub: 'listing view to click rate' },
    { label: 'Total Searches', value: fmtNum(searches), sub: 'search queries' },
  ]

  if (type === 'listings') {
    metricsData.push({ label: 'Active Listings', value: fmtNum(totalListings ?? 0), sub: 'all verticals' })
  }

  const dataPage = React.createElement(
    Page,
    { size: 'A4', style: styles.page },
    React.createElement(
      View,
      { style: styles.body },
      // Key metrics
      React.createElement(Text, { style: styles.sectionTitle }, 'Key Metrics'),
      React.createElement(MetricsSection, { data: metricsData }),

      // Top listings
      topListings.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, 'Top Listings by Views'),
            React.createElement(TableSection, {
              headers: ['Listing Name', 'Views'],
              widths: [4, 1],
              rows: topListings.map(([name, count]) => [name, fmtNum(count)]),
            })
          )
        : null,

      // Top search terms
      topSearches.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, 'Top Search Terms'),
            React.createElement(TableSection, {
              headers: ['Search Term', 'Count'],
              widths: [4, 1],
              rows: topSearches.map(([term, count]) => [term, fmtNum(count)]),
            })
          )
        : null,

      // Traffic sources
      topSources.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, 'Traffic by Source'),
            React.createElement(TableSection, {
              headers: ['Source Channel', 'Events'],
              widths: [4, 1],
              rows: topSources.map(([src, count]) => [src, fmtNum(count)]),
            })
          )
        : null
    ),
    React.createElement(
      View,
      { style: styles.footer },
      React.createElement(Text, { style: styles.footerText }, 'HumbleHalal.sg — Confidential'),
      React.createElement(Text, { style: styles.footerText }, 'Page 2')
    )
  )

  const doc = React.createElement(
    Document,
    { title, author: 'HumbleHalal', creator: 'HumbleHalal AI Command Centre' },
    React.createElement(CoverPage, { title, range: dateRange, sponsorName }),
    dataPage
  )

  try {
    const buffer = await renderToBuffer(doc)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="humblehalal-${type}-report.pdf"`,
      },
    })
  } catch (err) {
    console.error('[reports/generate] PDF render error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
