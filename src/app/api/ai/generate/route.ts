import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  callClaude,
  CLAUDE_SONNET,
  CLAUDE_OPUS,
} from '@/lib/anthropic/client'
import {
  SYSTEM_HUMBLEHALAL,
  SYSTEM_BLOG_WRITER,
  SYSTEM_TRAVEL_WRITER,
  SYSTEM_NEWSLETTER,
  buildBlogPostPrompt,
  buildTravelGuidePrompt,
  buildNewsletterPrompt,
  buildMetaPrompt,
  buildEnrichListingPrompt,
  SYSTEM_ENRICHER,
} from '@/lib/anthropic/prompts'

type GenerateType = 'blog' | 'travel' | 'newsletter' | 'meta' | 'description'

// ── Admin auth guard ──────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated', status: 401, supabase: null }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Forbidden', status: 403, supabase: null }
  return { error: null, status: 200, supabase }
}

// ── POST /api/ai/generate ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const supabase = auth.supabase!

  const body = await request.json()
  const { type, params } = body as { type: GenerateType; params: Record<string, unknown> }

  if (!type || !params) {
    return NextResponse.json({ error: 'Missing type or params' }, { status: 400 })
  }

  try {
    switch (type) {
      case 'blog':       return handleBlog(supabase, params)
      case 'travel':     return handleTravel(supabase, params)
      case 'newsletter': return handleNewsletter(supabase, params)
      case 'meta':       return handleMeta(supabase, params)
      case 'description': return handleDescription(supabase, params)
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }
  } catch (err: unknown) {
    console.error('[ai/generate] error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── Blog post ─────────────────────────────────────────────────────────────────
async function handleBlog(supabase: Awaited<ReturnType<typeof createClient>>, params: Record<string, unknown>) {
  const keyword   = String(params.keyword ?? '')
  const area      = params.area ? String(params.area) : undefined
  const wordCount = params.word_count ? Number(params.word_count) : 800

  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const result = await callClaude(
    buildBlogPostPrompt({ keyword, area, wordCount }),
    SYSTEM_BLOG_WRITER,
    { model: CLAUDE_OPUS, maxTokens: 2500, taskType: 'blog_generation', cacheSystem: true }
  )

  // Extract H1 as title
  const titleMatch = result.text.match(/^#\s+(.+)$/m)
  const title = titleMatch?.[1] ?? keyword

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)

  const { data: draft } = await (supabase as any)
    .from('ai_content_drafts')
    .insert({
      content_type: 'blog',
      title,
      slug,
      body: result.text,
      target_keyword: keyword,
      status: 'draft',
      model_used: result.model,
      tokens_in: result.inputTokens,
      tokens_out: result.outputTokens,
      cost_usd: result.costUsd,
    })
    .select('id, title, slug, status')
    .single()

  return NextResponse.json({ ok: true, draft })
}

// ── Travel guide ──────────────────────────────────────────────────────────────
async function handleTravel(supabase: Awaited<ReturnType<typeof createClient>>, params: Record<string, unknown>) {
  const destination = String(params.destination ?? '')
  const guideType   = (params.guide_type as 'halal-food' | 'weekend-guide' | 'full-guide') ?? 'halal-food'

  if (!destination) return NextResponse.json({ error: 'destination required' }, { status: 400 })

  const result = await callClaude(
    buildTravelGuidePrompt({ destination, guideType }),
    SYSTEM_TRAVEL_WRITER,
    { model: CLAUDE_OPUS, maxTokens: 2000, taskType: 'travel_guide_generation', cacheSystem: true }
  )

  const titleMatch = result.text.match(/^#\s+(.+)$/m)
  const title = titleMatch?.[1] ?? `Halal Travel Guide: ${destination}`

  const slug = `halal-food-guide-${destination}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

  const { data: draft } = await (supabase as any)
    .from('ai_content_drafts')
    .insert({
      content_type: 'travel',
      title,
      slug,
      body: result.text,
      status: 'draft',
      model_used: result.model,
      tokens_in: result.inputTokens,
      tokens_out: result.outputTokens,
      cost_usd: result.costUsd,
    })
    .select('id, title, slug, status')
    .single()

  return NextResponse.json({ ok: true, draft })
}

// ── Newsletter ────────────────────────────────────────────────────────────────
async function handleNewsletter(supabase: Awaited<ReturnType<typeof createClient>>, params: Record<string, unknown>) {
  const weekOf           = String(params.week_of ?? new Date().toISOString().slice(0, 10))
  const newListingsCount = Number(params.new_listings_count ?? 0)
  const topSearches      = (params.top_searches as string[]) ?? []
  const upcomingEvents   = (params.upcoming_events as Array<{ name: string; date: string; area: string }>) ?? []

  const result = await callClaude(
    buildNewsletterPrompt({ weekOf, newListingsCount, topSearches, upcomingEvents }),
    SYSTEM_NEWSLETTER,
    { model: CLAUDE_OPUS, maxTokens: 1200, taskType: 'newsletter_generation', cacheSystem: true }
  )

  const { data: draft } = await (supabase as any)
    .from('ai_content_drafts')
    .insert({
      content_type: 'newsletter',
      title: `HumbleHalal Weekly — ${weekOf}`,
      body: result.text,
      status: 'draft',
      model_used: result.model,
      tokens_in: result.inputTokens,
      tokens_out: result.outputTokens,
      cost_usd: result.costUsd,
    })
    .select('id, title, status')
    .single()

  return NextResponse.json({ ok: true, draft })
}

// ── Meta tags ─────────────────────────────────────────────────────────────────
async function handleMeta(_supabase: Awaited<ReturnType<typeof createClient>>, params: Record<string, unknown>) {
  const pageType      = String(params.page_type ?? 'category') as 'listing' | 'category' | 'area' | 'event' | 'blog' | 'mosque' | 'travel'
  const primaryKeyword = String(params.keyword ?? '')
  const area          = params.area ? String(params.area) : undefined
  const entityName    = params.entity_name ? String(params.entity_name) : undefined

  if (!primaryKeyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const result = await callClaude(
    buildMetaPrompt({ pageType, primaryKeyword, area, entityName }),
    SYSTEM_HUMBLEHALAL,
    { model: CLAUDE_SONNET, maxTokens: 300, taskType: 'meta_generation' }
  )

  let parsed: { title: string; description: string }
  try {
    // Strip markdown code fences if present
    const clean = result.text.replace(/```(?:json)?\n?/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: result.text }, { status: 500 })
  }

  return NextResponse.json({ ok: true, meta: parsed })
}

// ── Listing description ───────────────────────────────────────────────────────
async function handleDescription(supabase: Awaited<ReturnType<typeof createClient>>, params: Record<string, unknown>) {
  const listingId = String(params.listing_id ?? '')

  if (!listingId) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

  const { data: listing } = await (supabase as any)
    .from('listings')
    .select('id, name, category, area, halal_status, description, tags')
    .eq('id', listingId)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const result = await callClaude(
    buildEnrichListingPrompt({
      name: listing.name,
      category: listing.category,
      area: listing.area,
      halalStatus: listing.halal_status,
      existingDescription: listing.description,
      tags: listing.tags,
    }),
    SYSTEM_ENRICHER,
    { model: CLAUDE_SONNET, maxTokens: 600, taskType: 'listing_enrichment', cacheSystem: true }
  )

  let parsed: { description: string; tags: string[]; seo_score: number; meta_title: string; meta_description: string }
  try {
    const clean = result.text.replace(/```(?:json)?\n?/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: result.text }, { status: 500 })
  }

  return NextResponse.json({ ok: true, enriched: parsed })
}
