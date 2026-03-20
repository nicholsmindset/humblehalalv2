-- ============================================================
-- Migration 017: Helper Functions & Search Vector
-- Fixes audit items C40, C41, C42 and broken admin policies
-- ============================================================

-- ============================================================
-- 1. Add search_vector TSVECTOR column to listings
-- ============================================================
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE listings SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(address, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(area, '')), 'C');

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS listings_search_vector_idx
  ON listings USING GIN (search_vector);

-- ============================================================
-- 2. Trigger: auto-update search_vector on INSERT/UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.area, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_listing_search_vector
  BEFORE INSERT OR UPDATE OF name, description, address, area
  ON listings
  FOR EACH ROW EXECUTE FUNCTION update_listing_search_vector();

-- ============================================================
-- 3. RPC: nearby_businesses(lat, lng, radius_m, lim)
-- Returns listings within radius_m metres of the given point
-- ============================================================
CREATE OR REPLACE FUNCTION nearby_businesses(
  lat       double precision,
  lng       double precision,
  radius_m  integer DEFAULT 2000,
  lim       integer DEFAULT 20
)
RETURNS TABLE (
  id            uuid,
  name          varchar,
  slug          varchar,
  vertical      vertical_type,
  area          varchar,
  halal_status  halal_status,
  avg_rating    decimal,
  review_count  integer,
  photos        text[],
  distance_m    double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.slug,
    l.vertical,
    l.area,
    l.halal_status,
    l.avg_rating,
    l.review_count,
    l.photos,
    ST_Distance(l.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_m
  FROM listings l
  WHERE l.status = 'active'
    AND l.location IS NOT NULL
    AND ST_DWithin(l.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_m)
  ORDER BY distance_m ASC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 4. RPC: search_businesses(query_text, area_filter, vertical_filter, lim)
-- Full-text search with ranking using TSVECTOR
-- ============================================================
CREATE OR REPLACE FUNCTION search_businesses(
  query_text      text,
  area_filter     text DEFAULT NULL,
  vertical_filter text DEFAULT NULL,
  lim             integer DEFAULT 20
)
RETURNS TABLE (
  id            uuid,
  name          varchar,
  slug          varchar,
  vertical      vertical_type,
  area          varchar,
  halal_status  halal_status,
  avg_rating    decimal,
  review_count  integer,
  photos        text[],
  rank          real
) AS $$
DECLARE
  tsquery_val tsquery;
BEGIN
  tsquery_val := websearch_to_tsquery('english', query_text);

  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.slug,
    l.vertical,
    l.area,
    l.halal_status,
    l.avg_rating,
    l.review_count,
    l.photos,
    ts_rank_cd(l.search_vector, tsquery_val) AS rank
  FROM listings l
  WHERE l.status = 'active'
    AND (
      l.search_vector @@ tsquery_val
      OR l.name % query_text  -- trigram fuzzy match fallback
    )
    AND (area_filter IS NULL OR l.area = area_filter)
    AND (vertical_filter IS NULL OR l.vertical::text = vertical_filter)
  ORDER BY rank DESC, l.avg_rating DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 5. Fix broken admin policies in events ticketing tables
-- Migration 014 referenced "role = 'admin'" but user_profiles
-- has is_admin BOOLEAN, not a role column. Replace with is_admin().
-- ============================================================

-- event_tickets
DROP POLICY IF EXISTS "admin_all_event_tickets" ON event_tickets;
CREATE POLICY "admin_all_event_tickets" ON event_tickets
  FOR ALL TO authenticated USING (is_admin());

-- event_orders
DROP POLICY IF EXISTS "admin_all_event_orders" ON event_orders;
CREATE POLICY "admin_all_event_orders" ON event_orders
  FOR ALL TO authenticated USING (is_admin());

-- event_order_items
DROP POLICY IF EXISTS "admin_all_event_order_items" ON event_order_items;
CREATE POLICY "admin_all_event_order_items" ON event_order_items
  FOR ALL TO authenticated USING (is_admin());

-- organiser_payouts
DROP POLICY IF EXISTS "admin_all_payouts" ON organiser_payouts;
CREATE POLICY "admin_all_payouts" ON organiser_payouts
  FOR ALL TO authenticated USING (is_admin());

-- ============================================================
-- 6. Add admin read policy for travel_bookings
-- ============================================================
CREATE POLICY "admin_all_travel_bookings" ON travel_bookings
  FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "admin_all_travel_search_log" ON travel_search_log
  FOR ALL TO authenticated USING (is_admin());
