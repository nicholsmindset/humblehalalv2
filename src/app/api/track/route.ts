export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Service role client — bypasses RLS so anon users can insert events
function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Allowed event types (matches analytics_events migration exactly)
const VALID_EVENT_TYPES = new Set([
  'click_website', 'click_directions', 'click_phone',
  'click_booking', 'click_menu', 'click_affiliate',
  'search_query', 'browse_category', 'view_listing',
  'save_listing', 'submit_review', 'share_listing',
  'newsletter_click', 'set_notification', 'page_view',
])

// In-memory rate limit: session_id → [timestamp, count]
// Resets per Vercel function invocation — good enough for serverless
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 100   // events per session per hour
const WINDOW_MS  = 3600_000

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(sessionId)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(sessionId, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      event_type,
      session_id,
      page_url,
      referrer,
      listing_id,
      listing_name,
      listing_category,
      listing_area,
      brand_name,
      search_term,
      source_channel,
      device_type,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
    } = body

    // Validate required fields
    if (!event_type || !session_id) {
      return NextResponse.json(
        { error: 'event_type and session_id are required' },
        { status: 400 }
      )
    }

    if (!VALID_EVENT_TYPES.has(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }

    // Rate limit check
    if (!checkRateLimit(session_id)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = getServiceClient()

    const { error } = await supabase.from('analytics_events').insert({
      event_type,
      session_id,
      page_url: page_url ?? null,
      referrer: referrer ?? null,
      listing_id: listing_id ?? null,
      listing_name: listing_name ?? null,
      listing_category: listing_category ?? null,
      listing_area: listing_area ?? null,
      brand_name: brand_name ?? null,
      search_term: search_term ?? null,
      source_channel: source_channel ?? null,
      device_type: device_type ?? null,
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      utm_content: utm_content ?? null,
    })

    if (error) {
      console.error('[/api/track] Supabase insert error:', error.message)
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// Block all other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
