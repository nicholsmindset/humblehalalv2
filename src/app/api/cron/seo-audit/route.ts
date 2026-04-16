export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'
import { callClaude, CLAUDE_SONNET } from '@/lib/anthropic/client'
import { SYSTEM_HUMBLEHALAL, buildSeoAuditPrompt } from '@/lib/anthropic/prompts'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Audit up to 20 pages per daily run (500 pages / 25 days = 20/day)
// Pages not audited in 7+ days are prioritised
const BATCH_SIZE = 20
const AUDIT_INTERVAL_DAYS = 7
const SITE_BASE = 'https://humblehalal.sg'

// pSEO page types to audit with their route patterns
const PAGE_TYPES: Array<{ vertical: string; urlPattern: (slug: string, area?: string) => string }> = [
  { vertical: 'food', urlPattern: (slug) => `/restaurant/${slug}` },
  { vertical: 'mosque', urlPattern: (slug) => `/mosque/${slug}` },
  { vertical: 'event', urlPattern: (slug) => `/events/${slug}` },
  { vertical: 'blog', urlPattern: (slug) => `/blog/${slug}` },
]

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[seo-audit] ANTHROPIC_API_KEY not set — skipping')
    return NextResponse.json({ ok: true, skipped: true, reason: 'ANTHROPIC_API_KEY not configured' })
  }

  const db = getServiceClient() as any

  const now = new Date()
  const auditCutoff = new Date(now)
  auditCutoff.setDate(auditCutoff.getDate() - AUDIT_INTERVAL_DAYS)

  try {
    // Find pages in ai_seo_audit that haven't been audited recently
    const { data: staleAudits } = await db
      .from('ai_seo_audit')
      .select('url, meta_status, schema_status, last_audited')
      .or(`last_audited.is.null,last_audited.lt.${auditCutoff.toISOString()}`)
      .order('last_audited', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE)

    // Also seed with fresh listings that have never been audited
    const { data: newListings } = await db
      .from('listings')
      .select('slug, vertical, name, area, meta_title, meta_description')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(BATCH_SIZE)

    // Build list of URLs to audit: prioritise stale existing audits, then new listings
    const urlsToAudit: Array<{
      url: string
      title?: string
      metaDescription?: string
      keyword?: string
      hasSchema: boolean
      hasInternalLinks: boolean
    }> = []

    // Add stale audit URLs
    for (const audit of (staleAudits ?? [])) {
      if (urlsToAudit.length >= BATCH_SIZE) break
      urlsToAudit.push({
        url: audit.url,
        hasSchema: audit.schema_status === 'present',
        hasInternalLinks: true, // assume true for existing pages
      })
    }

    // Fill remaining slots with new listing URLs not yet audited
    for (const listing of (newListings ?? [])) {
      if (urlsToAudit.length >= BATCH_SIZE) break

      const pageType = PAGE_TYPES.find((p) => p.vertical === listing.vertical)
      if (!pageType) continue

      const pageUrl = `${SITE_BASE}${pageType.urlPattern(listing.slug)}`

      // Skip if already in the list
      if (urlsToAudit.some((u) => u.url === pageUrl)) continue

      // Check if this URL already has a recent audit
      const { data: existingAudit } = await db
        .from('ai_seo_audit')
        .select('last_audited')
        .eq('url', pageUrl)
        .single()

      if (existingAudit?.last_audited && new Date(existingAudit.last_audited) > auditCutoff) {
        continue // recently audited
      }

      urlsToAudit.push({
        url: pageUrl,
        title: listing.meta_title,
        metaDescription: listing.meta_description,
        keyword: listing.area
          ? `halal ${listing.vertical === 'food' ? 'restaurant' : listing.vertical} ${listing.area}`
          : undefined,
        hasSchema: true, // all pSEO pages have schema per architecture
        hasInternalLinks: true,
      })
    }

    if (urlsToAudit.length === 0) {
      return NextResponse.json({ ok: true, audited: 0, message: 'All pages recently audited' })
    }

    let audited = 0
    let failed = 0

    for (const page of urlsToAudit) {
      try {
        const result = await callClaude(
          buildSeoAuditPrompt({
            url: page.url,
            title: page.title,
            metaDescription: page.metaDescription,
            hasSchema: page.hasSchema,
            hasInternalLinks: page.hasInternalLinks,
            keyword: page.keyword,
          }),
          SYSTEM_HUMBLEHALAL,
          { model: CLAUDE_SONNET, maxTokens: 400, taskType: 'seo_audit' }
        )

        let audit: {
          score: number
          issues: string[]
          meta_status: string
          schema_status: string
          recommendation: string
        }

        try {
          const clean = result.text.replace(/```(?:json)?\n?/g, '').trim()
          audit = JSON.parse(clean)
        } catch {
          console.warn(`[seo-audit] parse error for ${page.url}:`, result.text.slice(0, 100))
          failed++
          continue
        }

        await db
          .from('ai_seo_audit')
          .upsert(
            {
              url: page.url,
              meta_status: audit.meta_status,
              schema_status: audit.schema_status,
              last_audited: now.toISOString(),
            },
            { onConflict: 'url' }
          )

        audited++

        // Throttle Claude calls: ~150ms between requests
        await new Promise((resolve) => setTimeout(resolve, 150))
      } catch (pageErr) {
        console.error(`[seo-audit] error auditing ${page.url}:`, pageErr)
        failed++
      }
    }

    // Activity log
    await db.from('ai_activity_log').insert({
      activity_type: 'seo_audit',
      activity_data: {
        audited_at: now.toISOString(),
        pages_audited: audited,
        pages_failed: failed,
        total_queued: urlsToAudit.length,
      },
      created_at: now.toISOString(),
    })

    return NextResponse.json({ ok: true, audited, failed, total: urlsToAudit.length })
  } catch (err: unknown) {
    console.error('[seo-audit] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
