-- Migration 015: Travel Bookings (LiteAPI hotel booking)

-- Travel bookings table
CREATE TABLE IF NOT EXISTS travel_bookings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users ON DELETE SET NULL,
  liteapi_booking_id      VARCHAR UNIQUE,
  liteapi_prebook_id      VARCHAR,
  liteapi_transaction_id  VARCHAR,
  hotel_confirmation_code VARCHAR,
  hotel_id                VARCHAR NOT NULL,
  hotel_name              VARCHAR NOT NULL,
  hotel_city              VARCHAR,
  hotel_country           VARCHAR,
  hotel_location          geography(Point, 4326),
  check_in                DATE NOT NULL,
  check_out               DATE NOT NULL,
  guests                  JSONB NOT NULL DEFAULT '[]',
  rooms                   JSONB,
  offer_id                VARCHAR,
  total_amount            DECIMAL(12,2) NOT NULL,
  currency                VARCHAR(3) DEFAULT 'SGD',
  commission_earned       DECIMAL(12,2) DEFAULT 0,
  status                  VARCHAR DEFAULT 'pending', -- pending | confirmed | cancelled | completed
  holder_first_name       VARCHAR NOT NULL,
  holder_last_name        VARCHAR NOT NULL,
  holder_email            VARCHAR NOT NULL,
  cancellation_policy     JSONB,
  refund_amount           DECIMAL(12,2) DEFAULT 0,
  -- PDPA: PII auto-purge after 12 months
  pii_purged              BOOLEAN DEFAULT false,
  pii_purge_date          TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_travel_bookings_user ON travel_bookings(user_id);
CREATE INDEX idx_travel_bookings_status ON travel_bookings(status);
CREATE INDEX idx_travel_bookings_hotel_location ON travel_bookings USING GIST(hotel_location);
CREATE INDEX idx_travel_bookings_created ON travel_bookings(created_at DESC);

-- Travel search log (demand analytics)
CREATE TABLE IF NOT EXISTS travel_search_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      VARCHAR,
  destination     VARCHAR NOT NULL,
  check_in        DATE,
  check_out       DATE,
  guests          JSONB,
  results_count   INTEGER,
  selected_hotel  VARCHAR,
  booked          BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_travel_search_dest ON travel_search_log(destination);
CREATE INDEX idx_travel_search_created ON travel_search_log(created_at DESC);

-- RLS
ALTER TABLE travel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_search_log ENABLE ROW LEVEL SECURITY;

-- travel_bookings: owner reads own; service role inserts/updates
CREATE POLICY "Users can read own travel bookings"
  ON travel_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages travel bookings"
  ON travel_bookings FOR ALL
  USING (true)
  WITH CHECK (true);

-- travel_search_log: service role only (analytics ingestion)
CREATE POLICY "Service role manages search log"
  ON travel_search_log FOR ALL
  USING (true)
  WITH CHECK (true);

-- PDPA: PII auto-purge function (called by /api/cron/pii-purge)
CREATE OR REPLACE FUNCTION purge_travel_booking_pii()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
