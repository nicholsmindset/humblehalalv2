import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enrichListing } from '@/lib/anthropic/enrich'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { listing_id } = body

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
  }

  const db = getServiceClient()

  try {
    // Fetch listing data
    const { data: listing, error: fetchErr } = await db
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single()

    if (fetchErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const result = await enrichListing(listing as Record<string, unknown>)

    // Save enrichment to queue
    await db.from('ai_enrichment_queue').insert({
      listing_id,
      source: 'ai_enrichment',
      status: 'completed',
      enriched_data: result,
      confidence_score: 85,
    })

    // Update listing description if empty
    if (!listing.description && result.description) {
      await db
        .from('listings')
        .update({ description: result.description })
        .eq('id', listing_id)
    }

    return NextResponse.json({ ok: true, enrichment: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Enrichment failed'
    console.error('[api/ai/enrich]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
