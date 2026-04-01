# HumbleHalal — PDPA Compliance Spec

> **File:** `docs/PDPA_COMPLIANCE.md`
> **Status:** Required before launch
> **Date:** 7 March 2026
> **Regulation:** Singapore Personal Data Protection Act 2012 (amended 2020)

---

## 1. Compliance Summary

HumbleHalal operates under a **data minimisation by design** principle. We collect the absolute minimum personal data needed for each feature tier, let third-party processors (Stripe, LiteAPI, Beehiiv) handle sensitive payment and financial data, auto-purge transactional PII, and give users full control over their data.

### Data Protection Officer

**DPO:** Robert Nicholas (sole operator)
**Contact:** dpo@humblehalal.com
**Registration:** Must register via ACRA BizFile+ before launch

---

## 2. Three-Tier Data Architecture

### Tier 1 — Anonymous (No Account Required)

| Activity | Data Collected | Storage | PII? |
|----------|---------------|---------|------|
| Browse listings, events, guides, mosques, blog | None | — | No |
| Site search | Search term + anonymous session hash | `analytics_events` | No |
| Page views | Page URL + session hash + referrer + device type | `analytics_events` | No |
| UTM tracking | utm_source, utm_medium, utm_campaign | `analytics_events` | No |

**Session ID:** Generated as a random hash stored in a first-party cookie. Cannot be linked to any individual. No fingerprinting.

### Tier 2 — Community Account (For Reviews, Forum, Classifieds)

| Field | Collected | Where Stored | Required? | Notes |
|-------|-----------|-------------|-----------|-------|
| Display name | Yes | `user_profiles.display_name` | Yes | First name, nickname, or alias — user's choice. NOT legal name. |
| Email | Yes | `auth.users` (Supabase Auth) | Yes | For authentication only. Supabase handles hashing/storage. |
| Avatar | Optional | `user_profiles.avatar_url` (Supabase Storage URL) | No | User-uploaded photo or default. |
| Bio | Optional | `user_profiles.bio` | No | User-written, their choice of content. |
| Area | Optional | `user_profiles.area` | No | General planning area (e.g., "Tampines"), NOT street address. |

**NOT collected at Tier 2:** Full legal name, NRIC, phone number, date of birth, home address, gender, race, religion.

### Tier 3 — Transactional (Only at Checkout)

| Field | When Collected | Where Stored | Retention | Notes |
|-------|---------------|-------------|-----------|-------|
| First name | Hotel booking or event ticket purchase | `travel_bookings` or `event_orders` | 12 months after transaction | Required by hotel/Stripe for fulfillment |
| Last name | Hotel booking or event ticket purchase | `travel_bookings` or `event_orders` | 12 months after transaction | Required by hotel/Stripe for fulfillment |
| Email | Hotel booking or event ticket purchase | `travel_bookings` or `event_orders` | 12 months after transaction | For booking confirmation delivery |
| Phone | Event ticket purchase only (optional) | `event_orders` | 12 months after transaction | For WhatsApp reminders if opted in |

**NOT stored by HumbleHalal:** Credit card numbers, bank account details, payment card data. All payment processing is handled by Stripe (event tickets) and LiteAPI Payment SDK (hotel bookings). These processors have their own PCI-DSS compliance.

---

## 3. Schema Updates for PDPA Compliance

### 3.1 user_profiles — Minimised

```sql
-- UPDATED schema: remove any PII fields that were in earlier drafts
CREATE TABLE user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name      VARCHAR(100),    -- Nickname, first name, or alias. NOT legal name.
  avatar_url        VARCHAR,         -- Supabase Storage URL
  bio               TEXT,            -- User-written, optional
  area              VARCHAR(50),     -- General area (e.g., "Tampines"), NOT address
  is_admin          BOOLEAN DEFAULT false,
  reputation        INTEGER DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  contribution_count INTEGER DEFAULT 0,
  marketing_consent BOOLEAN DEFAULT false,  -- NEW: separate consent for newsletter/marketing
  consent_date      TIMESTAMPTZ,            -- NEW: when consent was given
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- NO phone, full_name, date_of_birth, nric, address, gender, race, religion fields
```

### 3.2 travel_bookings — Transactional PII with Auto-Purge

```sql
-- Add retention policy columns
ALTER TABLE travel_bookings ADD COLUMN pii_purged BOOLEAN DEFAULT false;
ALTER TABLE travel_bookings ADD COLUMN pii_purge_date TIMESTAMPTZ;

-- Auto-purge function: anonymise PII after 12 months
CREATE OR REPLACE FUNCTION purge_travel_booking_pii()
RETURNS void AS $$
BEGIN
  UPDATE travel_bookings
  SET
    holder_first_name = 'REDACTED',
    holder_last_name = 'REDACTED',
    holder_email = 'REDACTED',
    pii_purged = true,
    pii_purge_date = now()
  WHERE
    created_at < now() - INTERVAL '12 months'
    AND pii_purged = false
    AND status IN ('completed', 'cancelled');
END;
$$ LANGUAGE plpgsql;
```

### 3.3 event_orders — Transactional PII with Auto-Purge

```sql
ALTER TABLE event_orders ADD COLUMN pii_purged BOOLEAN DEFAULT false;
ALTER TABLE event_orders ADD COLUMN pii_purge_date TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION purge_event_order_pii()
RETURNS void AS $$
BEGIN
  UPDATE event_orders
  SET
    email = 'REDACTED',
    name = 'REDACTED',
    phone = NULL,
    custom_responses = NULL,
    pii_purged = true,
    pii_purge_date = now()
  WHERE
    created_at < now() - INTERVAL '12 months'
    AND pii_purged = false
    AND status IN ('completed', 'refunded', 'cancelled');

  -- Also purge attendee PII
  UPDATE event_order_items
  SET
    attendee_name = 'REDACTED',
    attendee_email = 'REDACTED'
  FROM event_orders
  WHERE event_order_items.order_id = event_orders.id
    AND event_orders.pii_purged = true;
END;
$$ LANGUAGE plpgsql;
```

### 3.4 reviews — Anonymisation on Account Deletion

```sql
-- When user deletes account, keep review content but remove user link
CREATE OR REPLACE FUNCTION anonymise_user_reviews()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET user_id = NULL
  WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_anonymise_reviews_on_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION anonymise_user_reviews();
```

### 3.5 analytics_events — Confirm Zero PII

```sql
-- analytics_events should NEVER contain PII
-- Verify: no email, phone, name, or NRIC fields exist
-- session_id is an anonymous hash, not linkable to any individual
-- This table is PDPA-exempt as it contains no personal data
```

### 3.6 New Cron Job: Monthly PII Purge

Add to your cron schedule:

```
| PII Purge (travel) | Monthly 1st 3am | /api/cron/pii-purge |
| PII Purge (events)  | Monthly 1st 3am | /api/cron/pii-purge |
```

The cron endpoint calls both `purge_travel_booking_pii()` and `purge_event_order_pii()`.

---

## 4. Consent Management

### 4.1 Signup Consent (Required)

At account creation, two separate consent checkboxes:

```
☐ I agree to HumbleHalal's Privacy Policy and Terms of Service (REQUIRED)
☐ Send me the weekly Humble Halal newsletter and halal food picks (OPTIONAL)
```

- First checkbox is required to create account
- Second checkbox is OPTIONAL and NOT pre-ticked
- Marketing consent stored in `user_profiles.marketing_consent` with `consent_date`
- User can change marketing consent anytime in `/dashboard/settings`

### 4.2 Transactional Consent (At Checkout)

When booking a hotel or purchasing event tickets:

```
By completing this booking, you agree that your name and email
will be shared with [hotel name / event organiser] for booking
fulfillment. This data is retained for 12 months then deleted.
See our Privacy Policy for details.
```

This is displayed above the "Confirm Booking" / "Pay Now" button. No checkbox needed — it's a notice for transactional necessity (PDPA allows collection without consent for contract fulfillment, but transparency is still required).

### 4.3 Cookie Consent Banner

Displayed on first visit for all users:

```
We use essential cookies for site functionality and optional
analytics cookies to improve your experience.

[Accept All]  [Essential Only]  [Learn More →]
```

**Essential cookies (always on, no consent needed):**
- Supabase auth session cookie
- Anonymous session ID hash (for analytics — NOT PII)

**Optional cookies (require consent):**
- Google Analytics (GA4)
- PostHog

If user clicks "Essential Only", GA4 and PostHog do NOT load. Store preference in a `cookie_consent` cookie (value: `essential` or `all`).

---

## 5. Third-Party Data Processors

| Processor | What Data They Receive | Why | Their Compliance |
|-----------|----------------------|-----|-----------------|
| **Supabase** (Database) | Email (auth), display name, all user content | Core platform infrastructure | SOC 2 Type II, GDPR compliant |
| **Stripe** (Payments) | Name, email, payment card details (for event tickets) | Payment processing | PCI-DSS Level 1 |
| **LiteAPI/Nuitee** (Hotels) | Guest name, email (for hotel bookings) | Hotel reservation fulfillment | Payment SDK is PCI-DSS compliant |
| **Resend** (Email) | Email address, display name (for transactional emails) | Booking confirmations, reminders | GDPR compliant |
| **Beehiiv** (Newsletter) | Email address (only if user opts in) | Newsletter delivery | CAN-SPAM, GDPR compliant |
| **Vercel** (Hosting) | IP addresses (in server logs, auto-deleted) | Website hosting | SOC 2 Type II |
| **Google** (GA4, Maps) | Anonymous analytics data, IP (anonymised) | Analytics, map functionality | GDPR compliant, IP anonymisation |
| **PostHog** (Analytics) | Anonymous event data | Product analytics | GDPR compliant, EU hosting option |
| **Sentry** (Monitoring) | Error stack traces (may contain URLs) | Error monitoring | SOC 2, GDPR compliant |
| **Anthropic** (AI) | Content drafts (no user PII sent to AI) | AI content generation, moderation | Enterprise privacy terms |

**Key principle:** HumbleHalal NEVER sends user PII to the Anthropic Claude API. AI moderation receives content text only, stripped of author identity.

---

## 6. User Rights Implementation

### 6.1 Right to Access (`/dashboard/settings/my-data`)

Build a page where users can:
- View all personal data HumbleHalal holds about them
- Export as JSON or CSV with one click
- Data includes: profile info, reviews, forum posts, bookings, event orders

```typescript
// /api/user/export-data — Server Action
// Queries: user_profiles, reviews, forum_posts, travel_bookings,
// event_orders, classifieds WHERE user_id = auth.uid()
// Returns JSON bundle
```

### 6.2 Right to Correction (`/dashboard/settings`)

Users can edit their display name, bio, area, and avatar at any time through the standard settings page.

### 6.3 Right to Withdraw Consent

- **Marketing:** Toggle off in `/dashboard/settings` → sets `marketing_consent = false`
- **Account:** "Delete My Account" button in settings

### 6.4 Right to Deletion (`/dashboard/settings/delete-account`)

When user clicks "Delete My Account":

1. Confirmation dialog: "This will permanently delete your account and personal data. Your reviews will be kept anonymously. This cannot be undone."
2. Require password re-entry for confirmation
3. On confirm:
   - `user_profiles` row deleted (CASCADE from auth.users)
   - `reviews.user_id` set to NULL (review content preserved anonymously)
   - `forum_posts` and `forum_replies` by this user: set `user_id = NULL`, display as "[Deleted User]"
   - `classifieds` by this user: set to `status = 'removed'`
   - `travel_bookings` and `event_orders`: PII fields set to 'REDACTED' immediately (don't wait 12 months)
   - `auth.users` row deleted via Supabase Admin API
   - Confirmation email sent to their email before deletion: "Your HumbleHalal account has been deleted"
   - Beehiiv: unsubscribe via API if they were subscribed

### 6.5 Data Breach Response Plan

1. **Detection:** Sentry alerts + Supabase audit logs + Vercel security alerts
2. **Assessment:** Within 24 hours, determine: what data was affected, how many individuals, likelihood of harm
3. **Notification to PDPC:** Within 3 calendar days of assessment if breach is notifiable (significant harm or 500+ individuals)
4. **Notification to individuals:** As soon as practicable if breach likely causes significant harm
5. **DPO contact:** dpo@humblehalal.com
6. **Incident log:** Maintained in `/admin/settings/incident-log`

---

## 7. CLAUDE.md Additions

Add this section to CLAUDE.md:

```
## PDPA Compliance (Singapore)

- NEVER add PII fields (full_name, phone, NRIC, DOB, address, gender, race) to user_profiles. Display name only.
- Transactional PII (name, email for bookings/tickets) stored ONLY in travel_bookings and event_orders, NOT in user_profiles.
- All transactional PII auto-purged after 12 months via cron job /api/cron/pii-purge.
- NEVER send user PII to the Anthropic Claude API. Strip author identity before sending content for AI moderation.
- Cookie consent: GA4 and PostHog only load after user accepts optional cookies. Check cookie_consent cookie value.
- Marketing emails require separate opt-in (user_profiles.marketing_consent). Never pre-tick.
- Account deletion cascades: anonymise reviews (keep content, null user_id), redact booking PII, delete auth.users row.
- Payment card data is NEVER stored in our DB. Stripe and LiteAPI Payment SDK handle all payment processing.
- Privacy policy at /privacy, cookie policy at /cookies. Both required before launch.
```
