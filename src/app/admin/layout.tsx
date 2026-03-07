import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/AdminShell'

const adminNavLinks = [
  { label: 'Overview', href: '/admin', icon: 'dashboard' },
  { label: 'Content', href: '/admin/content', icon: 'auto_awesome' },
  { label: 'Listings', href: '/admin/listings', icon: 'store' },
  { label: 'Moderation', href: '/admin/moderation', icon: 'shield_check' },
  { label: 'SEO', href: '/admin/seo', icon: 'search' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'bar_chart' },
  { label: 'Reports', href: '/admin/reports', icon: 'description' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  // Use the is_admin() DB function via RPC (avoids type inference issues)
  const { data: isAdmin } = await supabase.rpc('is_admin')

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <AdminShell email={user.email ?? ''} navLinks={adminNavLinks}>
      {children}
    </AdminShell>
  )
}
