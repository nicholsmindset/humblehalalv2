-- ============================================================
-- Migration 013: Row Level Security Policies
-- ============================================================

-- ============================================================
-- Helper: is_admin()
-- Returns true if the current user has is_admin = true
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE listings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings_food         ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings_catering     ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosques               ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_drafts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_moderation_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enrichment_queue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_seo_audit          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_activity_log       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- listings  (created_by added in migration 012)
-- ============================================================

CREATE POLICY "listings_public_select"
  ON listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "listings_auth_insert"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "listings_auth_update"
  ON listings FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "listings_admin_all"
  ON listings FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- listings_food
-- ============================================================

CREATE POLICY "listings_food_public_select"
  ON listings_food FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'active'
    )
  );

CREATE POLICY "listings_food_auth_insert"
  ON listings_food FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "listings_food_auth_update"
  ON listings_food FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "listings_food_admin_all"
  ON listings_food FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- listings_catering
-- ============================================================

CREATE POLICY "listings_catering_public_select"
  ON listings_catering FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'active'
    )
  );

CREATE POLICY "listings_catering_auth_insert"
  ON listings_catering FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "listings_catering_auth_update"
  ON listings_catering FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "listings_catering_admin_all"
  ON listings_catering FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- listings_services
-- ============================================================

CREATE POLICY "listings_services_public_select"
  ON listings_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'active'
    )
  );

CREATE POLICY "listings_services_auth_insert"
  ON listings_services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "listings_services_auth_update"
  ON listings_services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "listings_services_admin_all"
  ON listings_services FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- reviews  (user_id column)
-- ============================================================

CREATE POLICY "reviews_public_select"
  ON reviews FOR SELECT
  USING (status = 'active');

CREATE POLICY "reviews_auth_insert"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_auth_update"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_auth_delete"
  ON reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "reviews_admin_all"
  ON reviews FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- events  (organiser_id column)
-- ============================================================

CREATE POLICY "events_public_select"
  ON events FOR SELECT
  USING (status = 'active');

CREATE POLICY "events_auth_insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (organiser_id = auth.uid());

CREATE POLICY "events_auth_update"
  ON events FOR UPDATE
  TO authenticated
  USING (organiser_id = auth.uid())
  WITH CHECK (organiser_id = auth.uid());

CREATE POLICY "events_admin_all"
  ON events FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- classifieds  (user_id column)
-- ============================================================

CREATE POLICY "classifieds_public_select"
  ON classifieds FOR SELECT
  USING (
    status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "classifieds_auth_insert"
  ON classifieds FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "classifieds_auth_update"
  ON classifieds FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "classifieds_auth_delete"
  ON classifieds FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "classifieds_admin_all"
  ON classifieds FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- forum_posts  (user_id column)
-- ============================================================

CREATE POLICY "forum_posts_public_select"
  ON forum_posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "forum_posts_auth_insert"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "forum_posts_auth_update"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "forum_posts_admin_all"
  ON forum_posts FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- forum_replies  (user_id column; visible when parent post active)
-- ============================================================

CREATE POLICY "forum_replies_public_select"
  ON forum_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_posts fp
      WHERE fp.id = post_id AND fp.status = 'active'
    )
  );

CREATE POLICY "forum_replies_auth_insert"
  ON forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "forum_replies_auth_update"
  ON forum_replies FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "forum_replies_admin_all"
  ON forum_replies FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- mosques & prayer_rooms (public read, admin write)
-- ============================================================

CREATE POLICY "mosques_public_select"
  ON mosques FOR SELECT
  USING (true);

CREATE POLICY "mosques_admin_all"
  ON mosques FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "prayer_rooms_public_select"
  ON prayer_rooms FOR SELECT
  USING (true);

CREATE POLICY "prayer_rooms_admin_all"
  ON prayer_rooms FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- user_profiles
-- ============================================================

CREATE POLICY "user_profiles_public_select"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "user_profiles_auth_update"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_admin_all"
  ON user_profiles FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- analytics_events (service role insert only, admin select)
-- ============================================================

CREATE POLICY "analytics_events_service_insert"
  ON analytics_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "analytics_events_admin_select"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================================
-- AI Command Centre tables (admin only)
-- ============================================================

CREATE POLICY "ai_content_drafts_admin_all"
  ON ai_content_drafts FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "ai_prompts_admin_all"
  ON ai_prompts FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "ai_moderation_log_admin_all"
  ON ai_moderation_log FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "ai_enrichment_queue_admin_all"
  ON ai_enrichment_queue FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "ai_seo_audit_admin_all"
  ON ai_seo_audit FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "ai_cost_log_admin_all"
  ON ai_cost_log FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "ai_activity_log_admin_all"
  ON ai_activity_log FOR ALL
  TO authenticated
  USING (is_admin());
