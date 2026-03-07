import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, avatar_url, is_admin')
    .eq('id', user.id)
    .single() as any

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-charcoal">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}
          </h1>
          <p className="text-charcoal/60 text-sm mt-1">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DashCard
            icon="rate_review"
            label="My Reviews"
            description="Manage reviews you've written"
            href="/dashboard/reviews"
          />
          <DashCard
            icon="bookmark"
            label="Saved Places"
            description="Listings you've bookmarked"
            href="/dashboard/saved"
          />
          <DashCard
            icon="store"
            label="My Listings"
            description="Claim and manage your business"
            href="/dashboard/listings"
          />
          <DashCard
            icon="person"
            label="Account Settings"
            description="Update your profile and preferences"
            href="/dashboard/settings"
          />
        </div>

        {profile?.is_admin && (
          <div className="mt-6">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-primary font-medium text-sm hover:underline"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              Go to AI Command Centre
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="text-charcoal/50 text-sm hover:text-charcoal transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function DashCard({
  icon,
  label,
  description,
  href,
}: {
  icon: string
  label: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-start gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <div>
        <p className="font-bold text-charcoal text-sm">{label}</p>
        <p className="text-charcoal/50 text-xs mt-0.5">{description}</p>
      </div>
    </Link>
  )
}
