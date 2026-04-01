export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, contentLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { verifyCaptcha } from '@/lib/security/captcha'
import { sanitiseHTML, sanitisePlainText } from '@/lib/security/sanitise'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function uniqueSlug(db: any, base: string): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const { data } = await db.from('events').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Rate limit: 3 events per hour per user
  const rl = await checkLimit(contentLimiter, getIdentifier(request, user.id))
  if (rl.limited) return rl.response

  const body = await request.json()
  const {
    title,
    description,
    category,
    organiser,
    event_format,
    starts_at,
    ends_at,
    venue,
    area,
    online_platform,
    online_link,
    is_ticketed,
    tickets,
    refund_policy,
    refund_policy_text,
    captchaToken,
  } = body

  // CAPTCHA verification
  if (!await verifyCaptcha(captchaToken)) {
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
  }

  if (!title || !description || !category || !starts_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Sanitise user content
  const cleanTitle = sanitisePlainText(title).trim().slice(0, 200)
  const cleanDescription = sanitiseHTML(description)
  const cleanOrganiser = organiser ? sanitisePlainText(organiser).trim().slice(0, 150) : null
  const cleanVenue = venue ? sanitisePlainText(venue).trim().slice(0, 300) : null
  const cleanOnlineLink = online_link ? sanitisePlainText(online_link).trim().slice(0, 500) : null

  const baseSlug = slugify(`${cleanTitle}-${new Date(starts_at).getFullYear()}`)
  const slug = await uniqueSlug(db, baseSlug)

  const isOnline = event_format === 'online' || event_format === 'hybrid'
  const isInPerson = event_format === 'in_person' || event_format === 'hybrid'
  const isHybrid = event_format === 'hybrid'

  const { data: event, error: eventError } = await db
    .from('events')
    .insert({
      slug,
      title: cleanTitle,
      description: cleanDescription,
      organiser: cleanOrganiser,
      venue: isInPerson ? cleanVenue : null,
      area: isInPerson ? area : null,
      is_online: isOnline,
      is_hybrid: isHybrid,
      online_platform: isOnline ? online_platform : null,
      online_link: isOnline ? cleanOnlineLink : null,
      starts_at,
      ends_at: ends_at || null,
      is_ticketed: !!is_ticketed,
      refund_policy: refund_policy || 'no_refund',
      refund_policy_text: refund_policy_text || null,
      status: 'pending',
      created_by: user.id,
    })
    .select('id, slug')
    .single()

  if (eventError || !event) {
    console.error('[POST /api/events]', eventError)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  if (is_ticketed && Array.isArray(tickets) && tickets.length > 0) {
    const ticketRows = tickets.map((t: any, i: number) => ({
      event_id: event.id,
      name: t.name,
      description: t.description || null,
      price: parseFloat(t.price) || 0,
      total_quantity: parseInt(t.quantity) || null,
      max_per_order: parseInt(t.max_per_order) || 10,
      sale_start: t.sale_start || null,
      sale_end: t.sale_end || null,
      sort_order: i,
    }))

    const { error: ticketError } = await db.from('event_tickets').insert(ticketRows)
    if (ticketError) {
      console.error('[POST /api/events] ticket insert error', ticketError)
    }
  }

  return NextResponse.json({ id: event.id, slug: event.slug }, { status: 201 })
}
