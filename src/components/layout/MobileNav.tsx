'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Food', href: '/halal-food', icon: 'restaurant' },
  { label: 'Mosques', href: '/mosque', icon: 'mosque' },
  { label: 'Events', href: '/events', icon: 'event' },
  { label: 'Search', href: '/search', icon: 'search' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-3 px-1 transition-colors ${
                isActive ? 'text-primary' : 'text-charcoal/40 hover:text-charcoal'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  isActive ? 'text-primary' : ''
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
