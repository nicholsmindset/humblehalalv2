import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { moderateContent } from '@/lib/anthropic/moderate'

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
  const { content_type, content_id, content } = body

  if (!content_type || !content_id || !content) {
    return NextResponse.json(
      { error: 'content_type, content_id, and content are required' },
      { status: 400 }
    )
  }

  try {
    const result = await moderateContent(content_type, content)

    // Log moderation result
    const db = getServiceClient()
    await db.from('ai_moderation_log').insert({
      content_type,
      content_id,
      action: result.action,
      ai_score: result.score,
      ai_reasoning: result.reasoning,
      human_override: false,
    })

    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Moderation failed'
    console.error('[api/ai/moderate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
