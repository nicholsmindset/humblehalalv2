import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, contentLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { verifyCaptcha } from '@/lib/security/captcha'
import { sanitiseHTML, sanitisePlainText } from '@/lib/security/sanitise'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Rate limit: 5 reviews per hour per user
  const rl = await checkLimit(contentLimiter, getIdentifier(request, user.id))
  if (rl.limited) return rl.response

  const body = await request.json()
  const { listing_id, rating, title, body: reviewBody, captchaToken } = body

  // CAPTCHA verification (skipped in dev if TURNSTILE_SECRET_KEY not set)
  if (!await verifyCaptcha(captchaToken)) {
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
  }

  if (!listing_id || !rating || !reviewBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  // Sanitise user content
  const cleanTitle = title ? sanitisePlainText(title).slice(0, 120) : null
  const cleanBody = sanitiseHTML(reviewBody).slice(0, 2000)

  // Check the listing exists and is active
  const { data: listing } = await supabase
    .from('listings')
    .select('id, name, slug, email')
    .eq('id', listing_id)
    .eq('status', 'active')
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Check user hasn't already reviewed this listing
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('listing_id', listing_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 409 })
  }

  const { data: review, error } = (await supabase
    .from('reviews')
    .insert({
      listing_id,
      user_id: user.id,
      rating,
      title: cleanTitle,
      body: cleanBody,
      status: 'pending' as const,
    } as any)
    .select('id')
    .single()) as any

  if (error) {
    console.error('[reviews] insert error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }

  // Notify listing owner (non-blocking)
  notifyListingOwner(listing, cleanBody, rating).catch(() => {})

  return NextResponse.json({ id: review?.id }, { status: 201 })
}

async function notifyListingOwner(
  listing: { name: string; slug: string; email: string | null } | null,
  reviewBody: string,
  rating: number,
) {
  if (!process.env.RESEND_API_KEY) return
  if (!listing?.email) return
  try {
    const { getResend, FROM_ADDRESS } = await import('@/lib/resend/index')
    const resend = getResend()
    const stars = '⭐'.repeat(Math.min(rating, 5))
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: listing.email,
      subject: `New ${rating}-star review for ${listing.name}`,
      html: `<p>Your listing <strong>${listing.name}</strong> received a new ${rating}-star review:</p><blockquote>${reviewBody.slice(0, 300)}</blockquote><p>${stars}</p><p><a href="https://humblehalal.sg/restaurant/${listing.slug}">View listing →</a></p>`,
      text: `New ${rating}-star review for ${listing.name}:\n\n${reviewBody.slice(0, 300)}\n\n${stars}`,
    })
  } catch {
    // Non-critical — don't fail the review submission
  }
}
