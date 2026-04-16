import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from '@/components/forms/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us — HumbleHalal Singapore | HumbleHalal',
  description: 'Get in touch with HumbleHalal. Questions about listings, partnerships, advertising, or feedback — we\'d love to hear from you.',
}

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0f231d] relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-[#D4A017] text-xs font-bold uppercase tracking-widest mb-3">
            Get in Touch
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 font-sans leading-tight">
            Contact{' '}
            <span className="italic font-display text-[#D4A017]">Us</span>
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Questions, feedback, partnership enquiries, or listing support —
            we&apos;re here to help.
          </p>
        </div>
      </section>

      {/* Contact options */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Primary contact */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8 text-center">
          <span className="material-symbols-outlined text-[#047857] text-4xl mb-4 block">mail</span>
          <h2 className="text-xl font-extrabold text-[#1C1917] mb-2 font-sans">Email Us</h2>
          <p className="text-[#1C1917]/60 mb-4 text-sm">
            The fastest way to reach us. We aim to respond within 1–2 business days.
          </p>
          <a
            href="mailto:info@humblehalal.com"
            className="inline-flex items-center gap-2 bg-[#047857] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#047857]/90 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            info@humblehalal.com
          </a>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <h2 className="text-xl font-extrabold text-[#1C1917] mb-6 font-sans">Send Us a Message</h2>
          <ContactForm />
        </div>

        {/* Topic cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: 'storefront',
              title: 'List Your Business',
              body: 'Add or claim your halal business, restaurant, or service.',
              href: '/business',
              cta: 'Get listed',
            },
            {
              icon: 'campaign',
              title: 'Advertising',
              body: 'Reach Singapore\'s Muslim community through targeted placements.',
              href: '/business',
              cta: 'Learn more',
            },
            {
              icon: 'help',
              title: 'General Enquiries',
              body: 'Feedback, corrections, partnerships, and everything else.',
              href: 'mailto:info@humblehalal.com',
              cta: 'Email us',
              external: true,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col"
            >
              <span className="material-symbols-outlined text-[#047857] text-2xl mb-3">{card.icon}</span>
              <h3 className="font-bold text-[#1C1917] text-sm mb-1">{card.title}</h3>
              <p className="text-[#1C1917]/55 text-xs leading-relaxed flex-1">{card.body}</p>
              {card.external ? (
                <a
                  href={card.href}
                  className="mt-4 text-[#047857] text-xs font-bold hover:underline inline-flex items-center gap-1"
                >
                  {card.cta}
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              ) : (
                <Link
                  href={card.href}
                  className="mt-4 text-[#047857] text-xs font-bold hover:underline inline-flex items-center gap-1"
                >
                  {card.cta}
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-[#1C1917]/50 text-sm hover:text-[#047857] transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to HumbleHalal
          </Link>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact HumbleHalal',
            url: 'https://humblehalal.sg/contact',
            description: 'Contact HumbleHalal for listing support, advertising, and general enquiries.',
            publisher: {
              '@type': 'Organization',
              name: 'HumbleHalal',
              url: 'https://humblehalal.sg',
              email: 'info@humblehalal.com',
            },
          }),
        }}
      />
    </>
  )
}
