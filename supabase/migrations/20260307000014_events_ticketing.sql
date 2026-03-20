-- ============================================================
-- Migration 014 — Events Ticketing Platform
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'completed', 'refunded', 'partial_refund', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_item_status AS ENUM ('active', 'cancelled', 'transferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_channel AS ENUM ('email', 'whatsapp', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_field_type AS ENUM ('text', 'textarea', 'dropdown', 'checkbox', 'radio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Alter events table ──────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_ticketed              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_online                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hybrid                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recurring             BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_private               BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_code              VARCHAR,
  ADD COLUMN IF NOT EXISTS online_platform          VARCHAR,
  ADD COLUMN IF NOT EXISTS online_link              VARCHAR,
  ADD COLUMN IF NOT EXISTS recurrence_rule          JSONB,
  ADD COLUMN IF NOT EXISTS refund_policy            VARCHAR DEFAULT 'no_refund',
  ADD COLUMN IF NOT EXISTS refund_policy_text       TEXT,
  ADD COLUMN IF NOT EXISTS max_tickets_per_order    SMALLINT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS waitlist_enabled         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS organiser_stripe_account_id VARCHAR,
  ADD COLUMN IF NOT EXISTS platform_fee_percent     DECIMAL DEFAULT 3.0,
  ADD COLUMN IF NOT EXISTS total_revenue            DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tickets_sold       INTEGER DEFAULT 0;

-- ── event_tickets ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         VARCHAR NOT NULL,
  description  TEXT,
  price        DECIMAL NOT NULL DEFAULT 0,
  quantity     INTEGER NOT NULL,
  sold_count   INTEGER NOT NULL DEFAULT 0,
  sale_start   TIMESTAMPTZ,
  sale_end     TIMESTAMPTZ,
  sort_order   SMALLINT DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_tickets_event_id_idx ON event_tickets(event_id);

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_event_tickets" ON event_tickets
  FOR SELECT USING (is_active = true);

CREATE POLICY "organiser_manage_event_tickets" ON event_tickets
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE organiser_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_event_tickets" ON event_tickets
  FOR ALL TO authenticated USING (is_admin());

-- ── event_orders ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_orders (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                     UUID NOT NULL REFERENCES events(id),
  user_id                      UUID REFERENCES auth.users(id),
  order_number                 VARCHAR UNIQUE NOT NULL,
  email                        VARCHAR NOT NULL,
  name                         VARCHAR NOT NULL,
  phone                        VARCHAR,
  total_amount                 DECIMAL NOT NULL,
  platform_fee                 DECIMAL NOT NULL DEFAULT 0,
  stripe_payment_intent_id     VARCHAR,
  stripe_checkout_session_id   VARCHAR UNIQUE,
  status                       order_status NOT NULL DEFAULT 'pending',
  custom_responses             JSONB,
  promo_code_used              VARCHAR,
  refund_amount                DECIMAL DEFAULT 0,
  created_at                   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_orders_event_id_idx ON event_orders(event_id);
CREATE INDEX IF NOT EXISTS event_orders_user_id_idx  ON event_orders(user_id);
CREATE INDEX IF NOT EXISTS event_orders_status_idx   ON event_orders(status);

ALTER TABLE event_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_order_select" ON event_orders
  FOR SELECT USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "organiser_order_select" ON event_orders
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE organiser_id = auth.uid())
  );

CREATE POLICY "service_role_insert_order" ON event_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_role_update_order" ON event_orders
  FOR UPDATE USING (true);

CREATE POLICY "admin_all_event_orders" ON event_orders
  FOR ALL TO authenticated USING (is_admin());

-- ── event_order_items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES event_orders(id) ON DELETE CASCADE,
  ticket_id        UUID NOT NULL REFERENCES event_tickets(id),
  attendee_name    VARCHAR NOT NULL,
  attendee_email   VARCHAR NOT NULL,
  qr_code          VARCHAR UNIQUE NOT NULL,
  checked_in       BOOLEAN DEFAULT false,
  checked_in_at    TIMESTAMPTZ,
  checked_in_by    UUID REFERENCES auth.users(id),
  status           ticket_item_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_order_items_order_id_idx   ON event_order_items(order_id);
CREATE INDEX IF NOT EXISTS event_order_items_qr_code_idx    ON event_order_items(qr_code);
CREATE INDEX IF NOT EXISTS event_order_items_ticket_id_idx  ON event_order_items(ticket_id);

ALTER TABLE event_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_ticket_select" ON event_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM event_orders WHERE user_id = auth.uid())
  );

CREATE POLICY "public_qr_select" ON event_order_items
  FOR SELECT USING (true);  -- QR lookup must be public for check-in

CREATE POLICY "service_role_insert_items" ON event_order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "checkin_update" ON event_order_items
  FOR UPDATE USING (
    order_id IN (
      SELECT eo.id FROM event_orders eo
      JOIN events e ON e.id = eo.event_id
      WHERE e.organiser_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_event_order_items" ON event_order_items
  FOR ALL TO authenticated USING (is_admin());

-- ── event_promo_codes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code            VARCHAR NOT NULL,
  discount_type   discount_type NOT NULL,
  discount_value  DECIMAL NOT NULL,
  max_uses        INTEGER,
  used_count      INTEGER DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, code)
);

ALTER TABLE event_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organiser_promo_codes" ON event_promo_codes
  FOR ALL USING (event_id IN (SELECT id FROM events WHERE organiser_id = auth.uid()));

CREATE POLICY "public_validate_promo" ON event_promo_codes
  FOR SELECT USING (is_active = true);

-- ── event_custom_questions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS event_custom_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question    VARCHAR NOT NULL,
  field_type  question_field_type NOT NULL DEFAULT 'text',
  options     TEXT[],
  is_required BOOLEAN DEFAULT false,
  sort_order  SMALLINT DEFAULT 0
);

ALTER TABLE event_custom_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_questions" ON event_custom_questions
  FOR SELECT USING (true);

CREATE POLICY "organiser_manage_questions" ON event_custom_questions
  FOR ALL USING (event_id IN (SELECT id FROM events WHERE organiser_id = auth.uid()));

-- ── event_reminders ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   UUID NOT NULL REFERENCES event_order_items(id),
  channel         reminder_channel NOT NULL DEFAULT 'email',
  scheduled_for   TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  status          reminder_status NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS event_reminders_scheduled_idx ON event_reminders(scheduled_for)
  WHERE status = 'pending';

ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_reminders" ON event_reminders
  FOR ALL USING (true);

-- ── organiser_payouts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS organiser_payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id        UUID NOT NULL REFERENCES auth.users(id),
  event_id            UUID NOT NULL REFERENCES events(id),
  gross_amount        DECIMAL NOT NULL,
  platform_fee        DECIMAL NOT NULL,
  stripe_fee          DECIMAL NOT NULL,
  net_amount          DECIMAL NOT NULL,
  stripe_transfer_id  VARCHAR,
  status              payout_status NOT NULL DEFAULT 'pending',
  payout_date         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organiser_payouts_organiser_idx ON organiser_payouts(organiser_id);

ALTER TABLE organiser_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_payouts_select" ON organiser_payouts
  FOR SELECT USING (organiser_id = auth.uid());

CREATE POLICY "admin_all_payouts" ON organiser_payouts
  FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "service_role_insert_payouts" ON organiser_payouts
  FOR INSERT WITH CHECK (true);
