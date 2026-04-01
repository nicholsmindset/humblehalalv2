import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createPremiumListingCheckout,
  retrieveSession,
  PREMIUM_TIERS,
  type PremiumTier,
} from '@/lib/stripe/client'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://humblehalal.sg'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { listingId, tier } = await request.json()

    if (!listingId || !tier || !PREMIUM_TIERS[tier as PremiumTier]) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify listing belongs to this user
    const { data: listing } = await (supabase as any)
      .from('listings')
      .select('id, name')
      .eq('id', listingId)
      .eq('created_by', user.id)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const url = await createPremiumListingCheckout({
      listingId,
      listingName: listing.name,
      tier: tier as PremiumTier,
      userId: user.id,
      successUrl: `${SITE_URL}/business/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${SITE_URL}/business/upgrade`,
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upgrade] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET /api/listings/upgrade?session_id=xxx — called after Stripe redirect to confirm payment
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    const session = await retrieveSession(sessionId)

    if (
      session.payment_status === 'paid' &&
      session.metadata?.listing_id
    ) {
      const supabase = await createClient()
      await (supabase as any)
        .from('listings')
        .update({
          premium_tier: session.metadata.tier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.metadata.listing_id)
    }

    return NextResponse.json({ ok: true, status: session.payment_status })
  } catch (err) {
    console.error('[upgrade GET] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
