import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Use service role for deletion operations
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  try {
    // Anonymise reviews (keep content but remove PII)
    await adminDb
      .from('reviews')
      .update({ user_id: null })
      .eq('user_id', user.id)

    // Anonymise forum posts
    await adminDb
      .from('forum_posts')
      .update({ user_id: null })
      .eq('user_id', user.id)

    // Anonymise forum replies
    await adminDb
      .from('forum_replies')
      .update({ user_id: null })
      .eq('user_id', user.id)

    // Delete classifieds
    await adminDb
      .from('classifieds')
      .delete()
      .eq('user_id', user.id)

    // Delete user profile
    await adminDb
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)

    // Delete the auth user (cascades)
    await adminDb.auth.admin.deleteUser(user.id)

    // Log deletion for audit
    await adminDb.from('ai_activity_log').insert({
      action: 'user:account-deleted',
      details: `User account deleted (ID: ${user.id.slice(0, 8)}...)`,
      metadata: { user_id: user.id, deleted_at: new Date().toISOString() },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Account deletion failed'
    console.error('[api/user/delete]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
