export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, contentLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { sanitisePlainText } from '@/lib/security/sanitise'

// ── POST /api/listings/claim ──────────────────────────────────────────────
// Authenticated: submit a business ownership claim for an unclaimed listing

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Rate limit: reuse content limiter (5 submissions per hour per user)
  const rl = await checkLimit(contentLimiter, getIdentifier(request, user.id))
  if (rl.limited) return rl.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { listing_id, business_name, contact_phone, message } = body as Record<string, string | undefined>

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
  }

  // Sanitise optional user-supplied fields
  const cleanBusinessName = business_name ? sanitisePlainText(business_name).trim().slice(0, 150) : null
  const cleanPhone = contact_phone
    ? sanitisePlainText(contact_phone).trim().replace(/[^\d\s+\-().]/g, '').slice(0, 30)
    : null
  const cleanMessage = message ? sanitisePlainText(message).trim().slice(0, 1000) : null

  // Verify listing exists and is not already claimed
  const { data: listing, error: listingErr } = await (supabase as any)
    .from('listings')
    .select('id, name, claimed')
    .eq('id', listing_id)
    .single()

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  if ((listing as { claimed: boolean }).claimed) {
    return NextResponse.json({ error: 'Listing already claimed' }, { status: 409 })
  }

  // Insert claim record
  const { data: claim, error: claimErr } = await (supabase as any)
    .from('listing_claims')
    .insert({
      listing_id,
      user_id: user.id,
      business_name: cleanBusinessName,
      contact_phone: cleanPhone,
      message: cleanMessage,
    })
    .select('id')
    .single()

  if (claimErr) {
    // Unique constraint violation — user already has a pending claim for this listing
    if (claimErr.code === '23505') {
      return NextResponse.json(
        { error: 'You have already submitted a claim for this listing' },
        { status: 409 }
      )
    }
    console.error('[claim] insert error:', claimErr)
    return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 })
  }

  // Send confirmation email to the claimant (fire-and-forget, non-critical)
  try {
    const { getResend, FROM_ADDRESS } = await import('@/lib/resend/index')
    const resend = getResend()
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: user.email!,
      subject: `Claim received for ${(listing as { name: string }).name} — HumbleHalal`,
      html: `<p>Hi,</p><p>We received your claim for <strong>${(listing as { name: string }).name}</strong>. Our team will review it within 2–3 business days.</p><p>— HumbleHalal</p>`,
      text: `Hi,\n\nWe received your claim for ${(listing as { name: string }).name}. Our team will review it within 2–3 business days.\n\n— HumbleHalal`,
    })
  } catch {
    // Email is non-critical; swallow error and continue
  }

  return NextResponse.json({ ok: true, claimId: (claim as { id: string }).id }, { status: 201 })
}
