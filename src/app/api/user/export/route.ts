import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Gather all user data (PDPA data portability)
  const [
    { data: profile },
    { data: reviews },
    { data: forumPosts },
    { data: forumReplies },
    { data: classifieds },
    { data: events },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('reviews').select('*').eq('user_id', user.id),
    supabase.from('forum_posts').select('*').eq('user_id', user.id),
    supabase.from('forum_replies').select('*').eq('user_id', user.id),
    supabase.from('classifieds').select('*').eq('user_id', user.id),
    supabase.from('events').select('*').eq('organiser_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profile ?? null,
    reviews: reviews ?? [],
    forum_posts: forumPosts ?? [],
    forum_replies: forumReplies ?? [],
    classifieds: classifieds ?? [],
    events: events ?? [],
  }

  const json = JSON.stringify(exportData, null, 2)

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="humblehalal-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
