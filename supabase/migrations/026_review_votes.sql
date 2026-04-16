-- ============================================================
-- Migration 026: Review Votes (Helpful Voting)
-- Enables users to mark reviews as "helpful". Trigger keeps
-- reviews.helpful_count in sync automatically.
-- ============================================================

CREATE TABLE IF NOT EXISTS review_votes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_votes_unique UNIQUE(review_id, user_id)
);

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_votes_public_read" ON review_votes
  FOR SELECT USING (true);

CREATE POLICY "review_votes_auth_insert" ON review_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_votes_auth_delete" ON review_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "review_votes_admin_all" ON review_votes
  FOR ALL TO authenticated USING (is_admin());

CREATE INDEX IF NOT EXISTS review_votes_review_idx ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS review_votes_user_idx ON review_votes(user_id);

-- ── Trigger: keep reviews.helpful_count in sync ───────────────
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER review_votes_count_trigger
  AFTER INSERT OR DELETE ON review_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();
