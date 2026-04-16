export const dynamic = 'force-dynamic'

import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

// Pull the last 3 days of Search Console data so late-indexed rows get backfilled.
const LOOKBACK_DAYS = 3
const ROW_LIMIT = 5000

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

type ServiceAccount = {
  client_email: string
  private_key: string
  token_uri?: string
}

function b64url(input: Buffer | string) {
  return (Buffer.isBuffer(input) ? input : Buffer.from(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: sa.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(unsigned)
  const signature = b64url(signer.sign(sa.private_key))
  const jwt = `${unsigned}.${signature}`

  const res = await fetch(sa.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    throw new Error(`token exchange failed: ${res.status} ${await res.text()}`)
  }
  const body = (await res.json()) as { access_token: string }
  return body.access_token
}

type GscRow = {
  keys: [string]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const siteUrl = process.env.GSC_SITE_URL
  const saJson = process.env.GSC_SERVICE_ACCOUNT_JSON

  if (!siteUrl || !saJson) {
    console.warn('[gsc-pull] GSC_SITE_URL or GSC_SERVICE_ACCOUNT_JSON not set — skipping')
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'GSC credentials not configured',
    })
  }

  let sa: ServiceAccount
  try {
    sa = JSON.parse(saJson)
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid GSC_SERVICE_ACCOUNT_JSON' }, { status: 500 })
  }

  const db = getServiceClient() as any
  const now = new Date()

  try {
    const accessToken = await getGoogleAccessToken(sa)

    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() - 2) // GSC data lags ~2 days
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - LOOKBACK_DAYS)

    const queryUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        dimensions: ['page'],
        rowLimit: ROW_LIMIT,
      }),
    })
    if (!res.ok) {
      throw new Error(`GSC query failed: ${res.status} ${await res.text()}`)
    }
    const body = (await res.json()) as { rows?: GscRow[] }
    const rows = body.rows ?? []

    let upserted = 0
    for (const row of rows) {
      const url = row.keys[0]
      const { error } = await db.from('ai_seo_audit').upsert(
        {
          url,
          impressions: Math.round(row.impressions),
          clicks: Math.round(row.clicks),
          position: Number(row.position.toFixed(2)),
          index_status: row.impressions > 0 ? 'indexed' : 'not_indexed',
          last_audited: now.toISOString(),
        },
        { onConflict: 'url' }
      )
      if (!error) upserted++
    }

    await db.from('ai_activity_log').insert({
      activity_type: 'gsc_pull',
      activity_data: {
        pulled_at: now.toISOString(),
        window_days: LOOKBACK_DAYS,
        rows_returned: rows.length,
        rows_upserted: upserted,
      },
      created_at: now.toISOString(),
    })

    return NextResponse.json({ ok: true, rows: rows.length, upserted })
  } catch (err) {
    console.error('[gsc-pull] error:', err)
    return NextResponse.json({ ok: false, error: 'GSC pull failed' }, { status: 500 })
  }
}
