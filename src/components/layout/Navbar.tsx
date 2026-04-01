'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/search/SearchBar'

const navLinks = [
  { label: 'Restaurants', href: '/halal-food' },
  { label: 'Businesses', href: '/business' },
  { label: 'Events', href: '/events' },
  { label: 'Classifieds', href: '/classifieds' },
  { label: 'Mosques', href: '/mosque' },
  { label: 'Blog', href: '/blog' },
]

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main nav row */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl">mosque</span>
            <span className="text-xl">
              <span className="font-extrabold text-charcoal font-sans">Humble</span>
              <span className="italic text-accent font-display">Halal</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-charcoal/80 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <span className="material-symbols-outlined text-charcoal">
                {searchOpen ? 'close' : 'search'}
              </span>
            </Button>
            <Link
              href="/login"
              className="bg-accent text-charcoal rounded-lg font-bold px-4 py-2 text-sm hover:bg-accent/90 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <span className="material-symbols-outlined text-charcoal">menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                  <SearchBar
                    placeholder="Search halal food, mosques…"
                    className="mb-2"
                  />
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-base font-medium text-charcoal/80 hover:text-primary transition-colors py-2 border-b border-gray-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/login"
                    className="bg-accent text-charcoal rounded-lg font-bold px-4 py-3 text-center hover:bg-accent/90 transition-colors mt-4"
                  >
                    Sign in
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop expandable search bar */}
        {searchOpen && (
          <div className="pb-3 hidden md:block">
            <SearchBar
              placeholder="Search halal restaurants, mosques, events…"
              className="max-w-2xl mx-auto"
            />
          </div>
        )}
      </div>
    </header>
  )
}
