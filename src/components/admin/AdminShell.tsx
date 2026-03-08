'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface AdminShellProps {
  email: string
  navLinks: { label: string; href: string; icon: string }[]
  children: React.ReactNode
}

export function AdminShell({ email, navLinks, children }: AdminShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background-dark text-white overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-charcoal border-r border-white/10 flex-col">
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
          {navLinks.map((link) => (
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
          <p className="text-white/40 text-xs truncate">{email}</p>
        </div>
      </aside>

      {/* Mobile top bar + content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-charcoal border-b border-white/10">
          <span className="text-lg">
            <span className="font-extrabold text-white font-sans">Humble</span>
            <span className="italic text-accent font-display">Halal</span>
          </span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="Open menu">
                <span className="material-symbols-outlined text-2xl">menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-charcoal border-white/10 text-white">
              <SheetHeader>
                <SheetTitle className="text-white">AI Command Centre</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 space-y-1" aria-label="Admin navigation">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-lg">{link.icon}</span>
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="absolute bottom-4 left-6 right-6">
                <p className="text-white/40 text-xs truncate">{email}</p>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex-1 overflow-auto">
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
