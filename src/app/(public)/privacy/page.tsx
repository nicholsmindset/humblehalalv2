import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | HumbleHalal',
  description:
    'How HumbleHalal collects, uses, and protects your personal data under the Singapore PDPA.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold text-charcoal mb-2">Privacy Policy</h1>
      <p className="text-charcoal/50 text-sm mb-10">
        Last updated: 7 March 2026 &middot;{' '}
        <a href="mailto:dpo@humblehalal.com" className="text-primary hover:underline">
          dpo@humblehalal.com
        </a>
      </p>

      <div className="prose prose-sm max-w-none text-charcoal/80 space-y-8">
        <Section title="1. About This Policy">
          <p>
            HumbleHalal (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is a platform operated in Singapore that helps the
            Muslim community discover halal food, businesses, events, travel, and services. This
            Privacy Policy explains what personal data we collect, why we collect it, how we use and
            protect it, and your rights under the Singapore Personal Data Protection Act 2012
            (&ldquo;PDPA&rdquo;).
          </p>
          <p>By using HumbleHalal, you agree to the practices described in this policy.</p>
        </Section>

        <Section title="2. What We Collect">
          <h3 className="font-bold text-charcoal mt-4 mb-2">Browsing (No Account Required)</h3>
          <p>
            When you browse our site without an account, we do not collect any personal data that
            can identify you. We use an anonymous session identifier (a random code stored in a
            cookie) to understand how visitors use the site. This code cannot be linked to you as an
            individual.
          </p>

          <h3 className="font-bold text-charcoal mt-4 mb-2">Community Account</h3>
          <p>
            When you create an account to write reviews, post in the forum, list classifieds, or
            save listings, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Display name</strong> — a first name, nickname, or alias of your choosing.
              Displayed publicly. Does not need to be your legal name.
            </li>
            <li>
              <strong>Email address</strong> — used for account login and transactional
              notifications. Managed by Supabase Auth.
            </li>
          </ul>
          <p className="mt-2">Optionally: profile photo, short bio, general area (e.g. &ldquo;Tampines&rdquo;).</p>
          <p className="mt-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            We do <strong>not</strong> collect: full legal name, NRIC, phone number, home address,
            date of birth, gender, race, or religion.
          </p>

          <h3 className="font-bold text-charcoal mt-4 mb-2">Bookings and Purchases</h3>
          <p>
            When you book a hotel or purchase event tickets, we additionally collect first name,
            last name, and email (required for fulfilment). Phone number is only collected for event
            ticket orders if you opt in to WhatsApp reminders. This transactional data is
            automatically deleted 12 months after the transaction is completed.
          </p>
          <p className="mt-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            We do <strong>not</strong> store credit card numbers, bank details, or payment card
            information. All payment processing is handled by Stripe (event tickets) and LiteAPI
            (hotel bookings).
          </p>
        </Section>

        <Section title="3. How We Use Your Data">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Data</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Purpose</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Legal Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Anonymous session ID', 'Understand site usage, improve the platform', 'Legitimate business purpose (no PII)'],
                ['Display name', 'Show your identity on reviews and posts', 'Consent (provided at signup)'],
                ['Email address', 'Authentication, booking confirmations, resets', 'Contractual necessity'],
                ['Booking name and email', 'Process hotel/event purchases', 'Contractual necessity'],
                ['Marketing emails', 'Weekly newsletter and halal picks', 'Separate opt-in consent'],
              ].map(([data, purpose, basis]) => (
                <tr key={data}>
                  <td className="px-3 py-2 font-medium text-charcoal">{data}</td>
                  <td className="px-3 py-2 text-charcoal/70">{purpose}</td>
                  <td className="px-3 py-2 text-charcoal/60">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-charcoal/60">
            We will never sell your data, use it for targeted advertising, or share it with
            advertisers.
          </p>
        </Section>

        <Section title="4. Who We Share Data With">
          <p className="mb-3">
            We share data only with service providers who need it to operate the platform. We do not
            sell, trade, or rent your personal data.
          </p>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Provider</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">What They Receive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Supabase (Ireland/US)', 'Email, display name — authentication and DB hosting'],
                ['Stripe (US)', 'Name, email, payment card — event ticket payments'],
                ['LiteAPI / Nuitee (EU)', 'Guest name, email — hotel booking fulfilment'],
                ['Resend (US)', 'Email, display name — transactional emails'],
                ['Beehiiv (US)', 'Email address (only if you opt in) — newsletter'],
                ['Vercel (US)', 'IP address in server logs (auto-deleted) — hosting'],
                ['Google (US)', 'Anonymous usage data (if you accept analytics cookies)'],
              ].map(([provider, what]) => (
                <tr key={provider}>
                  <td className="px-3 py-2 font-medium text-charcoal whitespace-nowrap">{provider}</td>
                  <td className="px-3 py-2 text-charcoal/70">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="5. Cookies">
          <p>
            We use essential cookies to keep the site working and, with your permission, optional
            analytics cookies. See our{' '}
            <Link href="/cookies" className="text-primary hover:underline">
              Cookies Policy
            </Link>{' '}
            for full details.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Data</th>
                <th className="px-3 py-2 text-left font-semibold text-charcoal/70">Retention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Account profile', 'Until you delete your account'],
                ['Reviews and forum posts', 'Indefinitely (anonymised if you delete your account)'],
                ['Booking data (name, email)', '12 months after transaction, then auto-deleted'],
                ['Analytics events (anonymous)', '24 months'],
                ['Cookie consent preference', '12 months (then banner shown again)'],
              ].map(([data, retention]) => (
                <tr key={data}>
                  <td className="px-3 py-2 font-medium text-charcoal">{data}</td>
                  <td className="px-3 py-2 text-charcoal/70">{retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="7. Your Rights">
          <ul className="space-y-3">
            {[
              ['Access', 'View and download all personal data we hold about you from your account settings.'],
              ['Correct', 'Update your display name, email, bio, and profile photo at any time in account settings.'],
              ['Withdraw consent', 'Turn off marketing emails in account settings. Change cookie preferences via the footer.'],
              ['Delete', 'Permanently delete your account from account settings. Reviews are preserved anonymously.'],
              ['Complain', 'Contact dpo@humblehalal.com or the PDPC at pdpc.gov.sg.'],
            ].map(([right, description]) => (
              <li key={right as string} className="flex gap-2">
                <span className="font-semibold text-charcoal shrink-0">{right}:</span>
                <span className="text-charcoal/70">{description}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="8. Security">
          <p>
            All data is encrypted in transit (HTTPS/TLS) and at rest. Payment card data is never
            stored on our servers. Database access is protected by Row Level Security policies.
            Authentication is handled by Supabase with industry-standard security practices.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            <strong>Data Protection Officer:</strong> Robert Nicholas
            <br />
            <strong>Email:</strong>{' '}
            <a href="mailto:dpo@humblehalal.com" className="text-primary hover:underline">
              dpo@humblehalal.com
            </a>
            <br />
            <strong>PDPC:</strong>{' '}
            <a
              href="https://www.pdpc.gov.sg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              pdpc.gov.sg
            </a>
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold text-charcoal mb-3 pb-2 border-b border-gray-200">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}
