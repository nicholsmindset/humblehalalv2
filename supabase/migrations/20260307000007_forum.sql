-- ============================================================
-- Migration 007: Forum (Posts + Replies)
-- ============================================================

CREATE TABLE forum_posts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title           varchar       NOT NULL,
  slug            varchar       NOT NULL,
  body            text          NOT NULL,
  category        varchar       NOT NULL,
  tags            text[],
  upvotes         integer       NOT NULL DEFAULT 0,
  reply_count     integer       NOT NULL DEFAULT 0,
  is_pinned       boolean       NOT NULL DEFAULT false,
  is_answered     boolean       NOT NULL DEFAULT false,
  linked_listings uuid[],                   -- listing IDs discussed in the thread
  status          listing_status NOT NULL DEFAULT 'active',
  created_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT forum_posts_slug_unique UNIQUE (slug)
);

CREATE INDEX forum_posts_category_status_idx
  ON forum_posts (category, status);

CREATE INDEX forum_posts_user_id_idx
  ON forum_posts (user_id);

CREATE INDEX forum_posts_tags_idx
  ON forum_posts USING GIN (tags);

CREATE INDEX forum_posts_title_trgm_idx
  ON forum_posts USING GIN (title gin_trgm_ops);

-- ============================================================

CREATE TABLE forum_replies (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid    NOT NULL REFERENCES forum_posts (id) ON DELETE CASCADE,
  user_id       uuid    NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body          text    NOT NULL,
  upvotes       integer NOT NULL DEFAULT 0,
  is_accepted   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX forum_replies_post_id_idx
  ON forum_replies (post_id);

CREATE INDEX forum_replies_user_id_idx
  ON forum_replies (user_id);

-- ============================================================
-- Trigger: keep forum_posts.reply_count in sync
-- ============================================================

CREATE OR REPLACE FUNCTION update_forum_reply_count()
RETURNS TRIGGER AS $$
DECLARE
  v_post_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_post_id := OLD.post_id;
  ELSE
    v_post_id := NEW.post_id;
  END IF;

  UPDATE forum_posts
  SET reply_count = (
    SELECT COUNT(*) FROM forum_replies WHERE post_id = v_post_id
  )
  WHERE id = v_post_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forum_replies_update_count
  AFTER INSERT OR DELETE
  ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_forum_reply_count();
