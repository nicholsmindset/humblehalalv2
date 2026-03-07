import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { SponsorReport, type SponsorReportData } from '@/lib/pdf/sponsor-report'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const sponsorId = formData.get('sponsor_id') as string
  const periodStart = formData.get('period_start') as string
  const periodEnd = formData.get('period_end') as string

  if (!sponsorId || !periodStart || !periodEnd) {
    return NextResponse.json(
      { error: 'sponsor_id, period_start, and period_end are required' },
      { status: 400 }
    )
  }

  const db = getServiceClient()

  try {
    // Fetch sponsor listing
    const { data: sponsor, error: sponsorErr } = await db
      .from('listings')
      .select('id, name, area, vertical')
      .eq('id', sponsorId)
      .single()

    if (sponsorErr || !sponsor) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
    }

    const sinceIso = new Date(periodStart).toISOString()
    const untilIso = new Date(periodEnd + 'T23:59:59').toISOString()

    // Gather all analytics data in parallel
    const [
      { count: pageViews },
      { data: sessions },
      { count: websiteClicks },
      { count: directionClicks },
      { count: phoneClicks },
      { count: bookingClicks },
      { count: reviewsCount },
      { data: reviewRatings },
      { count: searchAppearances },
      { data: referrerData },
      { data: searchTermData },
    ] = await Promise.all([
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('listing_id', sponsorId).eq('event_type', 'view_listing')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('session_id')
        .eq('listing_id', sponsorId)
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('listing_id', sponsorId).eq('event_type', 'click_website')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('listing_id', sponsorId).eq('event_type', 'click_directions')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('listing_id', sponsorId).eq('event_type', 'click_phone')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('listing_id', sponsorId).eq('event_type', 'click_booking')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('reviews').select('*', { count: 'exact', head: true })
        .eq('listing_id', sponsorId)
        .gte('created_at', sinceIso).lte('created_at', untilIso),
      db.from('reviews').select('rating')
        .eq('listing_id', sponsorId)
        .gte('created_at', sinceIso).lte('created_at', untilIso),
      db.from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('listing_id', sponsorId).eq('event_type', 'search_query')
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('referrer')
        .eq('listing_id', sponsorId).not('referrer', 'is', null)
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
      db.from('analytics_events').select('search_term')
        .eq('listing_id', sponsorId).not('search_term', 'is', null)
        .gte('timestamp', sinceIso).lte('timestamp', untilIso),
    ])

    // Unique visitors
    const uniqueVisitors = new Set(sessions?.map((s) => s.session_id)).size

    // Average rating
    const ratings = reviewRatings?.map((r) => r.rating).filter(Boolean) ?? []
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0

    // Top referrers
    const refCounts = new Map<string, number>()
    for (const row of referrerData ?? []) {
      if (row.referrer) {
        try {
          const host = new URL(row.referrer).hostname
          refCounts.set(host, (refCounts.get(host) ?? 0) + 1)
        } catch {
          refCounts.set(row.referrer, (refCounts.get(row.referrer) ?? 0) + 1)
        }
      }
    }
    const topReferrers = [...refCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, visits]) => ({ source, visits }))

    // Top search terms
    const termCounts = new Map<string, number>()
    for (const row of searchTermData ?? []) {
      if (row.search_term) {
        const term = row.search_term.toLowerCase()
        termCounts.set(term, (termCounts.get(term) ?? 0) + 1)
      }
    }
    const topSearchTerms = [...termCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count }))

    const reportData: SponsorReportData = {
      sponsorName: sponsor.name,
      sponsorArea: sponsor.area ?? '',
      sponsorVertical: sponsor.vertical ?? '',
      periodStart,
      periodEnd,
      metrics: {
        pageViews: pageViews ?? 0,
        uniqueVisitors,
        websiteClicks: websiteClicks ?? 0,
        directionClicks: directionClicks ?? 0,
        phoneClicks: phoneClicks ?? 0,
        bookingClicks: bookingClicks ?? 0,
        reviewsReceived: reviewsCount ?? 0,
        averageRating,
        searchAppearances: searchAppearances ?? 0,
      },
      topReferrers,
      topSearchTerms,
      weeklyTrend: [],
    }

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(SponsorReport, { data: reportData })
    )

    // Log report generation
    await db.from('ai_activity_log').insert({
      action: 'report:sponsor-generated',
      details: `Generated sponsor report for ${sponsor.name} (${periodStart} - ${periodEnd})`,
      metadata: {
        sponsor_id: sponsorId,
        sponsor_name: sponsor.name,
        period_start: periodStart,
        period_end: periodEnd,
        total_views: pageViews ?? 0,
        total_leads:
          (websiteClicks ?? 0) +
          (directionClicks ?? 0) +
          (phoneClicks ?? 0) +
          (bookingClicks ?? 0),
      },
    })

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sponsor.name.replace(/[^a-zA-Z0-9]/g, '-')}-report-${periodStart}-to-${periodEnd}.pdf"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Report generation failed'
    console.error('[api/admin/reports/generate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
