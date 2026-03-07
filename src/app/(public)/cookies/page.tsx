import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookies Policy | HumbleHalal',
  description:
    'How HumbleHalal uses cookies and how you can manage your cookie preferences.',
}

export default function CookiesPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold text-charcoal mb-2">Cookies Policy</h1>
      <p className="text-charcoal/50 text-sm mb-10">Last updated: 7 March 2026</p>

      <div className="space-y-8 text-sm text-charcoal/80 leading-relaxed">
        <section>
          <h2 className="text-lg font-extrabold text-charcoal mb-3 pb-2 border-b border-gray-200">
            What Are Cookies?
          </h2>
          <p>
            Cookies are small text files placed on your device when you visit a website. They help
            the site remember your preferences and understand how you use it. HumbleHalal uses a
            minimal number of cookies, categorised below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-charcoal mb-3 pb-2 border-b border-gray-200">
            Essential Cookies (Always Active)
          </h2>
          <p className="mb-3">
            These cookies are required for the site to function. They cannot be disabled.
          </p>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Cookie</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Purpose</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['sb-access-token', 'Supabase authentication session', 'Session'],
                ['sb-refresh-token', 'Supabase session refresh', '7 days'],
                ['hh_session', 'Anonymous session ID for site analytics (random hash — not PII)', '30 days'],
                ['cookie_consent', 'Remembers your cookie preference', '365 days'],
              ].map(([name, purpose, duration]) => (
                <tr key={name as string}>
                  <td className="px-3 py-2 font-mono text-xs text-charcoal">{name}</td>
                  <td className="px-3 py-2 text-charcoal/70">{purpose}</td>
                  <td className="px-3 py-2 text-charcoal/60 whitespace-nowrap">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-charcoal/50">
            The <code className="bg-gray-100 px-1 rounded">hh_session</code> cookie is classified
            as essential because it uses an anonymous random hash that cannot identify you. It
            powers our first-party analytics (no third-party scripts involved).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-charcoal mb-3 pb-2 border-b border-gray-200">
            Optional Analytics Cookies (Require Your Consent)
          </h2>
          <p className="mb-3">
            These cookies only load if you click <strong>Accept All</strong> on the cookie banner.
            They help us understand how visitors use the site in aggregate.
          </p>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Cookie</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Provider</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['_ga, _ga_*', 'Google Analytics (GA4)', 'Anonymous site usage analytics'],
                ['ph_*', 'PostHog', 'Product analytics (anonymous, self-hosted option)'],
              ].map(([name, provider, purpose]) => (
                <tr key={name as string}>
                  <td className="px-3 py-2 font-mono text-xs text-charcoal">{name}</td>
                  <td className="px-3 py-2 text-charcoal/70">{provider}</td>
                  <td className="px-3 py-2 text-charcoal/60">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-charcoal/50">
            If you choose &ldquo;Essential Only&rdquo;, Google Analytics and PostHog will not be loaded at
            all — no scripts, no cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-charcoal mb-3 pb-2 border-b border-gray-200">
            Managing Your Preferences
          </h2>
          <p>
            You can change your cookie preferences at any time by clicking the{' '}
            <strong>Cookie preferences</strong> link in the site footer. This clears the stored
            preference and shows the banner again on next page load.
          </p>
          <p className="mt-3">
            You can also block or delete cookies through your browser settings. Note that disabling
            essential cookies may affect site functionality (e.g., you may be signed out).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-charcoal mb-3 pb-2 border-b border-gray-200">
            No Advertising Cookies
          </h2>
          <p>
            HumbleHalal does not use advertising cookies, retargeting cookies, or any cookies that
            track you across other websites. We do not share data with any advertising network.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-charcoal mb-3 pb-2 border-b border-gray-200">
            Contact
          </h2>
          <p>
            Questions about our cookie use? Email{' '}
            <a href="mailto:dpo@humblehalal.com" className="text-primary hover:underline">
              dpo@humblehalal.com
            </a>{' '}
            or read our full{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
