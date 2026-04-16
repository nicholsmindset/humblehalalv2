-- ============================================================
-- Migration 025: Saved Listings (User Favorites)
-- Referenced by existing dashboard /saved page but table never created.
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_listings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_listings_user_listing_unique UNIQUE(user_id, listing_id)
);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own saved listings
CREATE POLICY "saved_select_own" ON saved_listings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "saved_insert_own" ON saved_listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_delete_own" ON saved_listings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "saved_admin_all" ON saved_listings
  FOR ALL TO authenticated USING (is_admin());

CREATE INDEX IF NOT EXISTS saved_listings_user_idx ON saved_listings(user_id);
CREATE INDEX IF NOT EXISTS saved_listings_listing_idx ON saved_listings(listing_id);
