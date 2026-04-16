import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | HumbleHalal',
  description:
    'HumbleHalal Terms of Service — rules for using Singapore\'s halal directory platform, listing policies, and user conduct.',
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold text-charcoal mb-2">Terms of Service</h1>
      <p className="text-charcoal/50 text-sm mb-10">
        Last updated: 16 April 2026 &middot;{' '}
        <a href="mailto:hello@humblehalal.sg" className="text-primary hover:underline">
          hello@humblehalal.sg
        </a>
      </p>

      <div className="prose prose-sm max-w-none text-charcoal/80 space-y-8">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using HumbleHalal (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), you agree to be bound by
            these Terms of Service. If you do not agree, please stop using the Platform immediately.
          </p>
          <p>
            These Terms apply to all visitors, registered users, and business owners who use
            HumbleHalal to browse listings, submit reviews, list businesses, purchase event tickets,
            or book travel.
          </p>
        </Section>

        <Section title="2. About HumbleHalal">
          <p>
            HumbleHalal is an independent halal directory and community platform for Singapore&apos;s
            Muslim community. We aggregate, verify, and present information about halal-certified
            restaurants, Muslim businesses, mosques, prayer rooms, events, travel destinations, and
            halal products. We are not affiliated with MUIS (Majlis Ugama Islam Singapura) unless
            explicitly stated.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be at least 13 years old to create an account.</li>
            <li>
              You are responsible for maintaining the confidentiality of your login credentials and
              for all activity that occurs under your account.
            </li>
            <li>
              You agree to provide accurate, current, and complete information when creating your
              account.
            </li>
            <li>
              We reserve the right to suspend or terminate accounts that violate these Terms or are
              used for fraudulent purposes.
            </li>
          </ul>
        </Section>

        <Section title="4. Listing Accuracy and MUIS Certification">
          <p>
            HumbleHalal makes reasonable efforts to verify halal certification statuses from MUIS
            and other sources. However:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Certification statuses can change. Always verify directly with the restaurant or
              MUIS&apos;s official portal before consuming food if certification is critical to you.
            </li>
            <li>
              &ldquo;Muslim Owned&rdquo; and &ldquo;Self Declared Halal&rdquo; badges are provided on a best-efforts basis
              and do not constitute formal MUIS certification.
            </li>
            <li>
              HumbleHalal is not liable for any harm arising from reliance on listing information.
            </li>
          </ul>
        </Section>

        <Section title="5. User-Generated Content">
          <p>
            By submitting reviews, comments, or other content to HumbleHalal, you grant us a
            non-exclusive, royalty-free, worldwide licence to use, display, and reproduce that
            content on the Platform.
          </p>
          <p className="mt-2">You agree not to post content that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Is false, misleading, or defamatory</li>
            <li>Contains hate speech or discriminatory language</li>
            <li>Violates any third party&apos;s intellectual property rights</li>
            <li>Contains spam, advertising, or solicitation</li>
            <li>Violates Singapore law</li>
          </ul>
          <p className="mt-2">
            We reserve the right to remove any content that violates these guidelines without prior
            notice.
          </p>
        </Section>

        <Section title="6. Business Listings">
          <p>
            Business owners who claim or submit listings agree that:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>All information submitted is accurate and up to date</li>
            <li>
              They have the authority to represent the business and its halal certification status
            </li>
            <li>
              Submitting false certification claims (e.g. claiming MUIS certification without holding
              one) may result in immediate removal and reporting to the relevant authorities
            </li>
          </ul>
          <p className="mt-2">
            Premium listing features are subject to separate pricing terms available at the time of
            purchase. All fees are in Singapore Dollars (SGD) and are non-refundable unless
            otherwise stated.
          </p>
        </Section>

        <Section title="7. Event Tickets and Hotel Bookings">
          <p>
            Event tickets are processed via Stripe. Hotel bookings are fulfilled via LiteAPI/Nuitee.
            By making a purchase, you agree to the respective payment processor&apos;s terms and
            conditions. HumbleHalal&apos;s liability is limited to the face value of the ticket or
            booking. Cancellation and refund policies are set by the event organiser or hotel and
            are displayed at the time of booking.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            All content on HumbleHalal — including text, graphics, logos, and software — is the
            property of HumbleHalal or its licensors and is protected by Singapore copyright law.
            You may not reproduce, distribute, or create derivative works from Platform content
            without written permission.
          </p>
          <p className="mt-2">
            The MUIS Halal Certification data used on this Platform is sourced from MUIS&apos;s public
            directory under fair use for consumer information purposes.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>
            The Platform is provided &ldquo;as is&rdquo; without any warranties, express or implied. We do not
            warrant that the Platform will be uninterrupted, error-free, or that listing information
            is always current. Your use of the Platform is at your own risk.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by Singapore law, HumbleHalal shall not be liable for
            any indirect, incidental, or consequential damages arising from your use of the
            Platform, including but not limited to losses arising from reliance on listing or
            certification information.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with the laws of Singapore.
            Any dispute arising from or relating to these Terms shall be subject to the exclusive
            jurisdiction of the Singapore courts.
          </p>
        </Section>

        <Section title="12. Changes to Terms">
          <p>
            We may update these Terms from time to time. Material changes will be notified via email
            (to registered users) or via a prominent notice on the Platform. Continued use of the
            Platform after changes constitutes acceptance of the new Terms.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Questions about these Terms?
            <br />
            <a href="mailto:hello@humblehalal.sg" className="text-primary hover:underline">
              hello@humblehalal.sg
            </a>
          </p>
          <p className="mt-2">
            Also see our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{' '}
            for information on how we handle your data.
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
