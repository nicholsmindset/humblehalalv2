# Cookie Consent — Implementation Spec

> Paste this into Claude Code when building the cookie consent system.

---

## Component: `src/components/layout/CookieConsent.tsx`

Build a PDPA-compliant cookie consent banner for HumbleHalal.

### Requirements

1. **Banner appears on first visit** (no `cookie_consent` cookie exists)
2. **Position:** Fixed bottom of viewport, full-width, z-50
3. **Design:** Match HumbleHalal design system — bg-charcoal text-white with emerald/gold accents
4. **Three buttons:**
   - "Accept All" (gold CTA — `bg-accent text-charcoal font-bold`) — sets consent to `all`
   - "Essential Only" (ghost button — `border border-white/30 text-white`) — sets consent to `essential`
   - "Learn More →" (text link — `text-accent underline`) — links to `/cookies`
5. **Text:** "We use essential cookies for site functionality and optional analytics cookies to improve your experience."
6. **Cookie:** Set `cookie_consent` cookie with value `all` or `essential`, expires 365 days, path `/`, SameSite=Lax
7. **Banner disappears** after user clicks either button
8. **Re-trigger:** Small cookie icon button in footer to reopen preferences

### Analytics Gating Logic

In `src/app/layout.tsx` or a dedicated `src/components/layout/AnalyticsProvider.tsx`:

```tsx
// Only load GA4 and PostHog AFTER checking consent
'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    // Read cookie_consent cookie
    const match = document.cookie.match(/cookie_consent=(\w+)/);
    setConsent(match ? match[1] : null);
  }, []);

  useEffect(() => {
    if (consent === 'all') {
      // Load GA4
      if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`;
        script.async = true;
        document.head.appendChild(script);
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) { window.dataLayer.push(args); }
        gtag('js', new Date());
        gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
      }

      // Load PostHog
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          capture_pageview: true,
        });
      }
    }
    // If consent is 'essential' or null — GA4 and PostHog do NOT load
  }, [consent]);

  return <>{children}</>;
}
```

### Custom Analytics Tracker (Always Active)

Your custom `/api/track` analytics is NOT gated by cookie consent because:
- It uses anonymous session hashes (not PII)
- The `hh_session` cookie is classified as essential (functional, not tracking)
- It does not use any third-party tracking scripts

### Signup Consent Checkboxes

In the signup form (`src/app/(auth)/signup/page.tsx`):

```tsx
// Two separate checkboxes — NEVER pre-tick the marketing one

<label className="flex items-start gap-3">
  <input type="checkbox" required className="mt-1" />
  <span className="text-sm text-charcoal">
    I agree to HumbleHalal's{' '}
    <a href="/privacy" className="text-primary underline">Privacy Policy</a>
    {' '}and{' '}
    <a href="/terms" className="text-primary underline">Terms of Service</a>
    {' '}*
  </span>
</label>

<label className="flex items-start gap-3">
  <input
    type="checkbox"
    checked={marketingConsent}
    onChange={(e) => setMarketingConsent(e.target.checked)}
    className="mt-1"
  />
  <span className="text-sm text-gray-600">
    Send me the weekly Humble Halal newsletter and halal food picks (optional)
  </span>
</label>
```

On signup success, save `marketing_consent` and `consent_date` to `user_profiles`.

### Checkout Consent Notice

On hotel booking and event ticket checkout pages, display this notice above the "Confirm" button:

```tsx
<p className="text-xs text-gray-500 mt-4">
  By completing this {type === 'hotel' ? 'booking' : 'purchase'}, you agree that
  your name and email will be shared with{' '}
  {type === 'hotel' ? 'the hotel' : 'the event organiser'} for{' '}
  {type === 'hotel' ? 'reservation' : 'ticketing'} fulfillment. This data is
  retained for 12 months then automatically deleted.{' '}
  <a href="/privacy" className="text-primary underline">Privacy Policy</a>
</p>
```

### Settings Page: Consent Management

In `/dashboard/settings`:

```tsx
// Marketing consent toggle
<div className="flex items-center justify-between">
  <div>
    <p className="font-semibold">Newsletter & Marketing</p>
    <p className="text-sm text-gray-500">
      Receive weekly halal food picks and community updates
    </p>
  </div>
  <Switch
    checked={marketingConsent}
    onChange={handleMarketingToggle}
  />
</div>

// Cookie preferences link
<a href="#" onClick={reopenCookieBanner} className="text-primary underline text-sm">
  Manage cookie preferences
</a>

// Data export button
<Button variant="ghost" onClick={handleExportData}>
  Download my data (JSON)
</Button>

// Delete account button
<Button variant="destructive" onClick={handleDeleteAccount}>
  Delete my account
</Button>
```
