import { NextRequest, NextResponse } from 'next/server'
import { generateSeoMeta } from '@/lib/anthropic/seo'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { page_type, page_data } = body

  if (!page_type) {
    return NextResponse.json({ error: 'page_type is required' }, { status: 400 })
  }

  try {
    const meta = await generateSeoMeta(page_type, page_data ?? {})
    return NextResponse.json({ ok: true, meta })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'SEO meta generation failed'
    console.error('[api/ai/seo]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
