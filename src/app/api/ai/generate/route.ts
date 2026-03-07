import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBlogPost, generateTravelGuide } from '@/lib/anthropic/content'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  // Admin-only: verify auth
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { content_type, topic, keyword, vertical, area, city, country } = body

  if (!content_type || !topic) {
    return NextResponse.json(
      { error: 'content_type and topic are required' },
      { status: 400 }
    )
  }

  const db = getServiceClient()

  try {
    let title: string
    let postBody: string
    let metaTitle: string | undefined
    let metaDescription: string | undefined
    let targetKeyword: string | undefined

    if (content_type === 'travel') {
      const result = await generateTravelGuide(city ?? topic, country ?? 'Singapore')
      title = result.title
      postBody = result.body
    } else {
      const result = await generateBlogPost(topic, keyword ?? topic, vertical, area)
      title = result.title
      postBody = result.body
      metaTitle = result.meta_title
      metaDescription = result.meta_description
      targetKeyword = result.target_keyword
    }

    // Save as draft
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data, error } = await db
      .from('ai_content_drafts')
      .insert({
        content_type,
        title,
        slug,
        body: postBody,
        meta_title: metaTitle,
        meta_description: metaDescription,
        target_keyword: targetKeyword,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, draft: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    console.error('[api/ai/generate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
