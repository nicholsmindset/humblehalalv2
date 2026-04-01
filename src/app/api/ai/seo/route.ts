import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude, CLAUDE_SONNET } from '@/lib/anthropic/client'
import { SYSTEM_HUMBLEHALAL, buildSeoAuditPrompt } from '@/lib/anthropic/prompts'

// POST /api/ai/seo
// Body: { page_url, title?, meta_description?, h1?, word_count?, has_schema, has_internal_links, keyword? }
// Returns: { score, issues, meta_status, schema_status, recommendation }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const {
    page_url,
    title,
    meta_description,
    h1,
    word_count,
    has_schema,
    has_internal_links,
    keyword,
  } = body as {
    page_url: string
    title?: string
    meta_description?: string
    h1?: string
    word_count?: number
    has_schema: boolean
    has_internal_links: boolean
    keyword?: string
  }

  if (!page_url) {
    return NextResponse.json({ error: 'page_url required' }, { status: 400 })
  }

  const result = await callClaude(
    buildSeoAuditPrompt({
      url: page_url,
      title,
      metaDescription: meta_description,
      h1,
      wordCount: word_count,
      hasSchema: has_schema ?? false,
      hasInternalLinks: has_internal_links ?? false,
      keyword,
    }),
    SYSTEM_HUMBLEHALAL,
    { model: CLAUDE_SONNET, maxTokens: 400, taskType: 'seo_audit' }
  )

  let audit: {
    score: number
    issues: string[]
    meta_status: string
    schema_status: string
    recommendation: string
  }

  try {
    const clean = result.text.replace(/```(?:json)?\n?/g, '').trim()
    audit = JSON.parse(clean)
  } catch {
    console.error('[ai/seo] parse error:', result.text)
    return NextResponse.json({ error: 'Failed to parse AI response', raw: result.text }, { status: 500 })
  }

  // Upsert into ai_seo_audit
  const db = supabase as any
  await db
    .from('ai_seo_audit')
    .upsert(
      {
        url: page_url,
        meta_status: audit.meta_status,
        schema_status: audit.schema_status,
        last_audited: new Date().toISOString(),
      },
      { onConflict: 'url' }
    )

  return NextResponse.json({
    ok: true,
    url: page_url,
    score: audit.score,
    issues: audit.issues,
    meta_status: audit.meta_status,
    schema_status: audit.schema_status,
    recommendation: audit.recommendation,
  })
}
