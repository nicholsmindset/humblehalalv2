import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'
import { SITE_URL } from '@/config'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface AuditResult {
  url: string
  meta_status: 'pass' | 'warning' | 'fail'
  schema_status: 'pass' | 'warning' | 'fail'
  internal_links_count: number
}

async function auditPage(url: string): Promise<AuditResult | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HumbleHalal-SEO-Bot/1.0' },
    })

    if (!res.ok) return null

    const html = await res.text()

    // Check meta tags
    const hasTitle = /<title[^>]*>.+<\/title>/i.test(html)
    const hasDescription = /<meta[^>]*name=["']description["'][^>]*>/i.test(html)
    const hasOgTitle = /<meta[^>]*property=["']og:title["'][^>]*>/i.test(html)
    const metaScore = [hasTitle, hasDescription, hasOgTitle].filter(Boolean).length

    // Check JSON-LD schema
    const schemaMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi)
    const hasSchema = (schemaMatches?.length ?? 0) > 0

    // Count internal links
    const internalLinks = html.match(new RegExp(`href=["'](?:${SITE_URL}|/)[^"']*["']`, 'gi'))
    const internalLinksCount = internalLinks?.length ?? 0

    return {
      url: url.replace(SITE_URL, ''),
      meta_status: metaScore === 3 ? 'pass' : metaScore >= 2 ? 'warning' : 'fail',
      schema_status: hasSchema ? 'pass' : 'fail',
      internal_links_count: internalLinksCount,
    }
  } catch {
    return null
  }
}

// SEO audit of pSEO pages — daily 5am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient()
  let audited = 0
  let issues = 0

  try {
    const pagesToAudit: string[] = []

    // Static key pages
    const staticPages = [
      '/', '/halal-food', '/mosque', '/prayer-rooms',
      '/prayer-times/singapore', '/events', '/classifieds',
      '/community', '/blog', '/travel',
    ]
    for (const p of staticPages) {
      pagesToAudit.push(`${SITE_URL}${p}`)
    }

    // Dynamic pages from listings
    const { data: listings } = await db
      .from('listings')
      .select('slug, vertical')
      .eq('status', 'active')
      .limit(200)

    for (const listing of listings ?? []) {
      if (listing.vertical === 'food') {
        pagesToAudit.push(`${SITE_URL}/restaurant/${listing.slug}`)
      }
    }

    // Dynamic pages from events
    const { data: events } = await db
      .from('events')
      .select('slug')
      .eq('status', 'active')
      .limit(50)

    for (const event of events ?? []) {
      pagesToAudit.push(`${SITE_URL}/events/${event.slug}`)
    }

    // Audit max 500 pages per run, batches of 10
    const batch = pagesToAudit.slice(0, 500)
    const results: AuditResult[] = []

    for (let i = 0; i < batch.length; i += 10) {
      const chunk = batch.slice(i, i + 10)
      const chunkResults = await Promise.all(chunk.map(auditPage))
      for (const r of chunkResults) {
        if (r) {
          results.push(r)
          if (r.meta_status === 'fail' || r.schema_status === 'fail') issues++
        }
      }
    }

    audited = results.length

    for (const result of results) {
      await db.from('ai_seo_audit').upsert(
        {
          url: result.url,
          meta_status: result.meta_status,
          schema_status: result.schema_status,
          internal_links_count: result.internal_links_count,
          last_audited: new Date().toISOString(),
        },
        { onConflict: 'url' }
      )
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:seo-audit',
      details: `SEO audit: ${audited} pages, ${issues} with issues`,
      metadata: { audited, issues },
    })

    return NextResponse.json({ ok: true, audited, issues })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'SEO audit failed'
    console.error('[cron/seo-audit]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
