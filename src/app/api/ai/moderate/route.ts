export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude, CLAUDE_SONNET } from '@/lib/anthropic/client'
import { SYSTEM_MODERATOR, buildModeratePrompt } from '@/lib/anthropic/prompts'

const CONTENT_TYPES = ['review', 'forum_post', 'classified', 'listing_description'] as const
type ContentType = typeof CONTENT_TYPES[number]

const TABLE_MAP: Record<ContentType, string> = {
  review: 'reviews',
  forum_post: 'forum_posts',
  classified: 'classifieds',
  listing_description: 'listings',
}

const STATUS_MAP: Record<string, Record<string, string>> = {
  approve: {
    review: 'active',
    forum_post: 'active',
    classified: 'active',
    listing_description: 'active',
  },
  reject: {
    review: 'rejected',
    forum_post: 'rejected',
    classified: 'rejected',
    listing_description: 'rejected',
  },
  flag: {
    review: 'pending',
    forum_post: 'pending',
    classified: 'pending',
    listing_description: 'pending',
  },
}

// POST /api/ai/moderate
// Body: { entity_type, entity_id, content, entity_name? }
// Returns: { action, score, reasoning, updated_status }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { entity_type, entity_id, content, entity_name } = body as {
    entity_type: ContentType
    entity_id: string
    content: string
    entity_name?: string
  }

  if (!entity_type || !entity_id || !content) {
    return NextResponse.json({ error: 'entity_type, entity_id, and content are required' }, { status: 400 })
  }

  if (!CONTENT_TYPES.includes(entity_type)) {
    return NextResponse.json({ error: `Invalid entity_type. Must be one of: ${CONTENT_TYPES.join(', ')}` }, { status: 400 })
  }

  // Call Claude for moderation decision
  const result = await callClaude(
    buildModeratePrompt({ contentType: entity_type, content, entityName: entity_name }),
    SYSTEM_MODERATOR,
    { model: CLAUDE_SONNET, maxTokens: 200, taskType: 'moderation', cacheSystem: true }
  )

  let parsed: { action: 'approve' | 'reject' | 'flag'; score: number; reasoning: string }
  try {
    const clean = result.text.replace(/```(?:json)?\n?/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    console.error('[ai/moderate] failed to parse response:', result.text)
    return NextResponse.json({ error: 'Failed to parse AI moderation response' }, { status: 500 })
  }

  const db = supabase as any
  const table = TABLE_MAP[entity_type]
  const newStatus = STATUS_MAP[parsed.action]?.[entity_type] ?? 'pending'

  // Update entity status
  await db.from(table).update({ status: newStatus }).eq('id', entity_id)

  // Log moderation decision
  await db.from('ai_moderation_log').insert({
    content_type: entity_type,
    content_id: entity_id,
    action: parsed.action,
    ai_score: parsed.score,
    ai_reasoning: parsed.reasoning,
    human_override: false,
  })

  return NextResponse.json({
    ok: true,
    action: parsed.action,
    score: parsed.score,
    reasoning: parsed.reasoning,
    updated_status: newStatus,
  })
}
