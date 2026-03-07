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

// Ahrefs backlink data pull — weekly Mon 6am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient()

  try {
    const ahrefsToken = process.env.AHREFS_API_TOKEN
    if (!ahrefsToken) {
      await db.from('ai_activity_log').insert({
        action: 'cron:ahrefs-pull',
        details: 'Skipped: AHREFS_API_TOKEN not configured',
      })
      return NextResponse.json({ ok: true, message: 'Ahrefs not configured — skipped' })
    }

    // Ahrefs API v3 — get top pages by backlinks
    const ahrefsRes = await fetch(
      `https://apiv2.ahrefs.com?token=${ahrefsToken}&from=pages&target=humblehalal.sg&mode=domain&limit=500&output=json&select=url,ahrefs_rank,backlinks,refdomains`,
      { method: 'GET' }
    )

    if (!ahrefsRes.ok) {
      const errorText = await ahrefsRes.text()
      console.error('[cron/ahrefs-pull] Ahrefs API error:', errorText)
      return NextResponse.json({ error: 'Ahrefs API error' }, { status: 500 })
    }

    const ahrefsData = await ahrefsRes.json()
    let updated = 0

    for (const page of ahrefsData.pages ?? []) {
      const pageUrl = new URL(page.url).pathname

      await db.from('ai_seo_audit').upsert(
        {
          url: pageUrl,
          index_status: 'indexed',
          last_audited: new Date().toISOString(),
        },
        { onConflict: 'url' }
      )
      updated++
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:ahrefs-pull',
      details: `Ahrefs data pulled: ${updated} pages`,
      metadata: { updated },
    })

    return NextResponse.json({ ok: true, updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ahrefs pull failed'
    console.error('[cron/ahrefs-pull]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
