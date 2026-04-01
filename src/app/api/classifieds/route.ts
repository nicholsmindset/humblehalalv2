export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, contentLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { verifyCaptcha } from '@/lib/security/captcha'
import { sanitiseHTML, sanitisePlainText } from '@/lib/security/sanitise'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const db = supabase as any

  // Get user before rate limiting so we can use userId as identifier if available
  const { data: { user } } = await supabase.auth.getUser()

  const rl = await checkLimit(contentLimiter, getIdentifier(request, user?.id))
  if (rl.limited) return rl.response

  const body = await request.json()
  const { category, title, description, price, condition, area, contact_method, contact_value, captchaToken } = body

  if (!await verifyCaptcha(captchaToken)) {
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
  }

  if (!category || !title?.trim() || !description?.trim() || !area || !contact_method || !contact_value?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (price !== null && price !== undefined && (isNaN(price) || price < 0)) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const cleanTitle = sanitisePlainText(title).trim().slice(0, 150)
  const cleanDescription = sanitiseHTML(description)
  const cleanContactValue = sanitisePlainText(contact_value).trim()

  // Generate unique slug
  const baseSlug = slugify(cleanTitle)
  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = (await db.from('classifieds').select('id').eq('slug', slug).maybeSingle()) as any
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
  }

  // Expiry: 30 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { error } = await db.from('classifieds').insert({
    slug,
    category,
    title: cleanTitle,
    description: cleanDescription,
    price: price ?? null,
    currency: 'SGD',
    condition: condition ?? null,
    area,
    contact_method,
    contact_value: cleanContactValue,
    status: 'pending',
    expires_at: expiresAt.toISOString().slice(0, 10),
    user_id: user?.id ?? null,
  })

  if (error) {
    console.error('[POST /api/classifieds]', error)
    return NextResponse.json({ error: 'Failed to submit listing' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
