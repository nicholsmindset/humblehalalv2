import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account Settings | HumbleHalal',
  robots: { index: false },
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/settings')

  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('display_name, phone, email_notifications_reviews, email_notifications_events')
    .eq('user_id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-warm-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-primary text-sm hover:underline mb-6 inline-block">← Dashboard</Link>
        <h1 className="text-2xl font-extrabold text-charcoal mb-2">Account Settings</h1>
        <p className="text-charcoal/60 text-sm mb-8">Manage your profile and notification preferences.</p>

        <SettingsForm
          email={user.email ?? ''}
          initialProfile={profile ?? {}}
        />
      </div>
    </main>
  )
}
