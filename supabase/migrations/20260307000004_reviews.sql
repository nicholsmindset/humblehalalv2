-- ============================================================
-- Migration 004: Reviews + avg_rating Trigger
-- ============================================================

CREATE TABLE reviews (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     uuid          NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  user_id        uuid          NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  rating         smallint      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title          varchar,
  body           text,
  photos         text[],
  visit_date     date,
  helpful_count  integer       NOT NULL DEFAULT 0,
  verified_visit boolean       NOT NULL DEFAULT false,
  status         listing_status NOT NULL DEFAULT 'pending',
  created_at     timestamptz   NOT NULL DEFAULT now(),

  -- One review per user per listing
  CONSTRAINT reviews_user_listing_unique UNIQUE (user_id, listing_id)
);

CREATE INDEX reviews_listing_status_idx
  ON reviews (listing_id, status);

CREATE INDEX reviews_user_id_idx
  ON reviews (user_id);

-- ============================================================
-- Trigger: keep listings.avg_rating + review_count in sync
-- Fires after INSERT, UPDATE (status/rating), or DELETE on reviews
-- Only counts reviews with status = 'active'
-- ============================================================

CREATE OR REPLACE FUNCTION update_listing_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_id uuid;
  v_avg        decimal(3, 2);
  v_count      integer;
BEGIN
  -- Determine which listing_id to refresh
  IF TG_OP = 'DELETE' THEN
    v_listing_id := OLD.listing_id;
  ELSE
    v_listing_id := NEW.listing_id;
  END IF;

  SELECT
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg, v_count
  FROM reviews
  WHERE listing_id = v_listing_id
    AND status = 'active';

  UPDATE listings
  SET
    avg_rating   = v_avg,
    review_count = v_count,
    updated_at   = now()
  WHERE id = v_listing_id;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_update_listing_rating
  AFTER INSERT OR UPDATE OF rating, status OR DELETE
  ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_listing_rating();
