import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    <div className="flex h-screen bg-background-dark text-white overflow-hidden">
      <aside className="w-64 shrink-0 bg-charcoal border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <span className="text-lg">
            <span className="font-extrabold text-white font-sans">Humble</span>
            <span className="italic text-accent font-display">Halal</span>
          </span>
          <p className="text-white/40 text-xs mt-1 font-medium uppercase tracking-wide">
            AI Command Centre
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
          {adminNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-white/40 text-xs truncate">{user.email}</p>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
