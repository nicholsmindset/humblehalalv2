import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TABLE_MAP: Record<string, string> = {
  review: 'reviews',
  classified: 'classifieds',
  forum_post: 'forum_posts',
  forum_reply: 'forum_replies',
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, content_type, action } = await request.json()

  if (!id || !content_type || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const table = TABLE_MAP[content_type]
  if (!table) {
    return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'active' : 'rejected'

  const { error } = (await (supabase as any)
    .from(table)
    .update({ status: newStatus })
    .eq('id', id)) as any

  if (error) {
    console.error('[moderate] update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
