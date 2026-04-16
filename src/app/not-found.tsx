import Link from 'next/link'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 pb-16 md:pb-0 flex items-center justify-center bg-warm-white">
        <div className="max-w-xl w-full text-center px-6 py-20">
          <span className="material-symbols-outlined text-primary text-6xl">mosque</span>
          <h1 className="mt-6 text-6xl font-extrabold text-charcoal font-sans">404</h1>
          <p className="mt-3 text-2xl text-charcoal/80 font-sans">
            We can’t find that <span className="italic text-accent font-display">page</span>.
          </p>
          <p className="mt-4 text-charcoal/60">
            It may have moved, been renamed, or never existed. Try searching or head home.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
              Return home
            </Link>
            <Link
              href="/halal-food"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-charcoal font-bold hover:bg-accent/90 transition-colors"
            >
              Browse halal food
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}
