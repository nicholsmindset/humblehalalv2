import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, forumLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { verifyCaptcha } from '@/lib/security/captcha'
import { sanitiseHTML } from '@/lib/security/sanitise'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to reply' }, { status: 401 })

  const rl = await checkLimit(forumLimiter, getIdentifier(request, user.id))
  if (rl.limited) return rl.response

  const body = await request.json()
  const { post_id, body: replyBody, parent_reply_id, captchaToken } = body

  if (!await verifyCaptcha(captchaToken)) {
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
  }

  if (!post_id || !replyBody?.trim()) {
    return NextResponse.json({ error: 'post_id and body are required' }, { status: 400 })
  }

  const cleanBody = sanitiseHTML(replyBody)

  // Verify the post exists and is approved
  const { data: post } = (await db
    .from('forum_posts')
    .select('id')
    .eq('id', post_id)
    .eq('moderation_status', 'approved')
    .single()) as any

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const { error } = await db.from('forum_replies').insert({
    post_id,
    parent_reply_id: parent_reply_id ?? null,
    body: cleanBody,
    user_id: user.id,
    moderation_status: 'pending',
    helpful_count: 0,
  })

  if (error) {
    console.error('[POST /api/forum/replies]', error)
    return NextResponse.json({ error: 'Failed to submit reply' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
