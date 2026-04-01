import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude, CLAUDE_SONNET } from '@/lib/anthropic/client'
import { SYSTEM_ENRICHER, buildEnrichListingPrompt } from '@/lib/anthropic/prompts'

// POST /api/ai/enrich
// Body: { listing_id }
// Enriches listing description, tags, seo_score and removes from enrichment queue
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { listing_id } = body as { listing_id: string }

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }

  const db = supabase as any

  // Fetch listing
  const { data: listing, error: fetchErr } = await db
    .from('listings')
    .select('id, name, category, area, halal_status, description, tags, cuisine_type')
    .eq('id', listing_id)
    .single()

  if (fetchErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Call Claude
  const result = await callClaude(
    buildEnrichListingPrompt({
      name: listing.name,
      category: listing.category,
      area: listing.area,
      halalStatus: listing.halal_status,
      existingDescription: listing.description,
      cuisine: listing.cuisine_type,
      tags: listing.tags,
    }),
    SYSTEM_ENRICHER,
    { model: CLAUDE_SONNET, maxTokens: 600, taskType: 'listing_enrichment', cacheSystem: true }
  )

  let enriched: {
    description: string
    tags: string[]
    seo_score: number
    meta_title: string
    meta_description: string
  }

  try {
    const clean = result.text.replace(/```(?:json)?\n?/g, '').trim()
    enriched = JSON.parse(clean)
  } catch {
    console.error('[ai/enrich] parse error:', result.text)
    return NextResponse.json({ error: 'Failed to parse AI response', raw: result.text }, { status: 500 })
  }

  // Update listing
  const { error: updateErr } = await db
    .from('listings')
    .update({
      description: enriched.description,
      tags: enriched.tags,
      seo_score: enriched.seo_score,
      meta_title: enriched.meta_title,
      meta_description: enriched.meta_description,
      enriched_at: new Date().toISOString(),
    })
    .eq('id', listing_id)

  if (updateErr) {
    console.error('[ai/enrich] update error:', updateErr)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }

  // Clear from enrichment queue
  await db
    .from('ai_enrichment_queue')
    .update({ status: 'completed', enriched_data: enriched })
    .eq('listing_id', listing_id)
    .eq('status', 'pending')

  // Log activity
  await db.from('ai_activity_log').insert({
    action: 'listing_enriched',
    details: `Enriched listing: ${listing.name}`,
    metadata: { listing_id, cost_usd: result.costUsd },
  })

  return NextResponse.json({
    ok: true,
    listing_id,
    enriched: {
      description: enriched.description,
      tags: enriched.tags,
      seo_score: enriched.seo_score,
    },
  })
}
