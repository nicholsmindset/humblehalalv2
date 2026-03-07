import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, forumLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { verifyCaptcha } from '@/lib/security/captcha'
import { sanitiseHTML, sanitisePlainText } from '@/lib/security/sanitise'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80)
}

async function uniqueSlug(db: any, base: string): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const { data } = await db.from('forum_posts').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to post' }, { status: 401 })

  const rl = await checkLimit(forumLimiter, getIdentifier(request, user.id))
  if (rl.limited) return rl.response

  const body = await request.json()
  const { title, body: postBody, category, tags, captchaToken } = body

  if (!await verifyCaptcha(captchaToken)) {
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
  }

  if (!title?.trim() || !postBody?.trim() || !category) {
    return NextResponse.json({ error: 'Title, body, and category are required' }, { status: 400 })
  }

  const cleanTitle = sanitisePlainText(title).trim().slice(0, 200)
  const cleanBody = sanitiseHTML(postBody)

  const baseSlug = slugify(cleanTitle)
  const slug = await uniqueSlug(db, baseSlug)

  const { data: post, error } = await db
    .from('forum_posts')
    .insert({
      slug,
      title: cleanTitle,
      body: cleanBody,
      category,
      tags: Array.isArray(tags) ? tags : [],
      user_id: user.id,
      moderation_status: 'pending',
      view_count: 0,
      reply_count: 0,
      is_pinned: false,
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('[POST /api/forum/posts]', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }

  return NextResponse.json({ id: post.id, slug: post.slug }, { status: 201 })
}
