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

// Google Search Console data pull — daily 6am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient()

  try {
    // GSC API requires OAuth2 credentials — check if configured
    const gscToken = process.env.GSC_ACCESS_TOKEN
    if (!gscToken) {
      await db.from('ai_activity_log').insert({
        action: 'cron:gsc-pull',
        details: 'Skipped: GSC_ACCESS_TOKEN not configured',
      })
      return NextResponse.json({ ok: true, message: 'GSC not configured — skipped' })
    }

    const siteUrl = 'sc-domain:humblehalal.sg'
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const gscRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gscToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
          dimensions: ['page'],
          rowLimit: 500,
        }),
      }
    )

    if (!gscRes.ok) {
      const errorText = await gscRes.text()
      console.error('[cron/gsc-pull] GSC API error:', errorText)
      return NextResponse.json({ error: 'GSC API error' }, { status: 500 })
    }

    const gscData = await gscRes.json()
    let updated = 0

    for (const row of gscData.rows ?? []) {
      const pageUrl = new URL(row.keys[0]).pathname

      await db.from('ai_seo_audit').upsert(
        {
          url: pageUrl,
          clicks: Math.round(row.clicks ?? 0),
          impressions: Math.round(row.impressions ?? 0),
          position: Math.round((row.position ?? 0) * 10) / 10,
          last_audited: new Date().toISOString(),
        },
        { onConflict: 'url' }
      )
      updated++
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:gsc-pull',
      details: `GSC data pulled: ${updated} pages updated`,
      metadata: { updated, period: `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}` },
    })

    return NextResponse.json({ ok: true, updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'GSC pull failed'
    console.error('[cron/gsc-pull]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
