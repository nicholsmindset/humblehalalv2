-- Migration 016: PDPA Compliance
-- Adds marketing consent columns to user_profiles
-- Adds PII purge tracking columns to travel_bookings and event_orders
-- Creates PII purge functions and review anonymisation trigger

-- ============================================================
-- 1. user_profiles — marketing consent
-- ============================================================
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ;

-- ============================================================
-- 2. travel_bookings — PII purge tracking
-- ============================================================
ALTER TABLE travel_bookings
  ADD COLUMN IF NOT EXISTS pii_purged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pii_purge_date TIMESTAMPTZ;

-- ============================================================
-- 3. event_orders — PII purge tracking (if table exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_orders') THEN
    ALTER TABLE event_orders
      ADD COLUMN IF NOT EXISTS pii_purged BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS pii_purge_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================
-- 4. PII purge function: travel_bookings (12-month retention)
-- ============================================================
CREATE OR REPLACE FUNCTION purge_travel_booking_pii()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE travel_bookings
  SET
    holder_first_name = 'REDACTED',
    holder_last_name  = 'REDACTED',
    holder_email      = 'REDACTED',
    pii_purged        = true,
    pii_purge_date    = now()
  WHERE
    created_at < now() - INTERVAL '12 months'
    AND pii_purged = false
    AND status IN ('completed', 'cancelled');
END;
$$;

-- ============================================================
-- 5. PII purge function: event_orders (12-month retention)
-- ============================================================
CREATE OR REPLACE FUNCTION purge_event_order_pii()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_orders') THEN
    UPDATE event_orders
    SET
      email           = 'REDACTED',
      name            = 'REDACTED',
      phone           = NULL,
      custom_responses = NULL,
      pii_purged      = true,
      pii_purge_date  = now()
    WHERE
      created_at < now() - INTERVAL '12 months'
      AND pii_purged = false
      AND status IN ('completed', 'refunded', 'cancelled');

    -- Also purge event_order_items attendee PII
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_order_items') THEN
      UPDATE event_order_items
      SET
        attendee_name  = 'REDACTED',
        attendee_email = 'REDACTED'
      FROM event_orders
      WHERE event_order_items.order_id = event_orders.id
        AND event_orders.pii_purged = true
        AND (event_order_items.attendee_name IS NULL
          OR event_order_items.attendee_name <> 'REDACTED');
    END IF;
  END IF;
END;
$$;

-- ============================================================
-- 6. Review anonymisation trigger: null user_id on account deletion
-- ============================================================
CREATE OR REPLACE FUNCTION anonymise_user_reviews()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE reviews SET user_id = NULL WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_anonymise_reviews_on_delete ON user_profiles;
CREATE TRIGGER trg_anonymise_reviews_on_delete
  BEFORE DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION anonymise_user_reviews();

-- ============================================================
-- 7. Forum anonymisation trigger on account deletion
-- ============================================================
CREATE OR REPLACE FUNCTION anonymise_user_forum_content()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE forum_posts   SET user_id = NULL WHERE user_id = OLD.id;
  UPDATE forum_replies SET user_id = NULL WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_anonymise_forum_on_delete ON user_profiles;
CREATE TRIGGER trg_anonymise_forum_on_delete
  BEFORE DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION anonymise_user_forum_content();
