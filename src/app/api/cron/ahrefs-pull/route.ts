export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

// Ahrefs site-level overview pull. Runs weekly (Mon 6am SGT) so a handful of API
// credits is enough. Per-page pulls would require the Ahrefs Site Explorer tier.
const AHREFS_API = 'https://api.ahrefs.com/v3/site-explorer'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

type Overview = {
  domain_rating?: number
  url_rating?: number
  backlinks?: number
  refdomains?: number
  organic_keywords?: number
  organic_traffic?: number
}

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const token = process.env.AHREFS_API_TOKEN
  const target = process.env.AHREFS_TARGET ?? 'humblehalal.sg'

  if (!token) {
    console.warn('[ahrefs-pull] AHREFS_API_TOKEN not set — skipping')
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'AHREFS_API_TOKEN not configured',
    })
  }

  const db = getServiceClient() as any
  const now = new Date()

  try {
    // Overview v3 endpoint returns site-level metrics in one call.
    const params = new URLSearchParams({
      target,
      mode: 'domain',
      output: 'json',
    })

    const res = await fetch(`${AHREFS_API}/overview?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`ahrefs overview failed: ${res.status} ${await res.text()}`)
    }

    const body = (await res.json()) as { metrics?: Overview } | Overview
    const metrics: Overview = 'metrics' in body && body.metrics ? body.metrics : (body as Overview)

    await db.from('ai_activity_log').insert({
      activity_type: 'ahrefs_pull',
      activity_data: {
        pulled_at: now.toISOString(),
        target,
        metrics,
      },
      created_at: now.toISOString(),
    })

    return NextResponse.json({ ok: true, target, metrics })
  } catch (err) {
    console.error('[ahrefs-pull] error:', err)
    return NextResponse.json({ ok: false, error: 'Ahrefs pull failed' }, { status: 500 })
  }
}
