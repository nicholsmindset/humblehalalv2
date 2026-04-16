-- ============================================================
-- Migration 027: Review Replies (Business Owner Responses)
-- One reply per review. Only the listing owner can post.
-- ============================================================

CREATE TABLE IF NOT EXISTS review_replies (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  -- One reply per review (owner can edit, not post multiple)
  CONSTRAINT review_replies_one_per_review UNIQUE(review_id)
);

ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_replies_public_read" ON review_replies
  FOR SELECT USING (true);

CREATE POLICY "review_replies_auth_insert" ON review_replies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_replies_auth_update" ON review_replies
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "review_replies_auth_delete" ON review_replies
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "review_replies_admin_all" ON review_replies
  FOR ALL TO authenticated USING (is_admin());

CREATE INDEX IF NOT EXISTS review_replies_review_idx ON review_replies(review_id);

-- Auto-update updated_at
CREATE TRIGGER set_review_replies_updated_at
  BEFORE UPDATE ON review_replies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
