import Link from 'next/link'
import { IslamicPattern } from './IslamicPattern'

const columns = [
  {
    heading: 'Explore',
    links: [
      { label: 'Halal Restaurants', href: '/halal-food' },
      { label: 'Muslim Businesses', href: '/business' },
      { label: 'Halal Catering', href: '/catering' },
      { label: 'Events', href: '/events' },
      { label: 'Mosques', href: '/mosque' },
      { label: 'Prayer Rooms', href: '/prayer-rooms' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Forum', href: '/community' },
      { label: 'Reviews', href: '/community/reviews' },
      { label: 'Classifieds', href: '/classifieds' },
      { label: 'Travel Guides', href: '/travel' },
      { label: 'Blog', href: '/blog' },
      { label: 'Newsletter', href: '/newsletter' },
    ],
  },
  {
    heading: 'Business',
    links: [
      { label: 'List Your Business', href: '/business/submit' },
      { label: 'Premium Listings', href: '/business/premium' },
      { label: 'Advertise', href: '/business/advertise' },
      { label: 'Business Dashboard', href: '/dashboard' },
      { label: 'Halal Products', href: '/products' },
      { label: 'Services', href: '/services' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-charcoal text-white relative overflow-hidden">
      {/* Islamic pattern at top */}
      <div className="relative h-2">
        <IslamicPattern opacity={0.15} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Logo + tagline */}
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-3xl">mosque</span>
            <span className="text-xl">
              <span className="font-extrabold text-white font-sans">Humble</span>
              <span className="italic text-accent font-display">Halal</span>
            </span>
          </Link>
          <p className="text-white/60 text-sm max-w-sm">
            Singapore&apos;s trusted halal ecosystem — restaurants, businesses,
            mosques, events, and more.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/60 text-sm hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider + disclaimer */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-white/40 text-xs max-w-2xl mb-2">
            Halal certification status is provided for reference only. Always verify with
            MUIS (Majlis Ugama Islam Singapura) for the latest certification status.
            HumbleHalal is not affiliated with MUIS.
          </p>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} HumbleHalal.sg · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
