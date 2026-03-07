-- ============================================================
-- Migration 006: Classifieds
-- ============================================================

CREATE TABLE classifieds (
  id               uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid                NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title            varchar             NOT NULL,
  description      text,
  category         varchar             NOT NULL,
  price            decimal(10, 2),
  condition        classified_condition,
  photos           text[],
  area             varchar,
  delivery_options text[],
  is_featured      boolean             NOT NULL DEFAULT false,
  status           classified_status   NOT NULL DEFAULT 'active',
  expires_at       timestamptz         NOT NULL DEFAULT (now() + interval '30 days'),
  created_at       timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX classifieds_user_id_idx
  ON classifieds (user_id);

CREATE INDEX classifieds_status_category_idx
  ON classifieds (status, category);

CREATE INDEX classifieds_expires_at_idx
  ON classifieds (expires_at)
  WHERE status = 'active';

-- Trigram index for title search
CREATE INDEX classifieds_title_trgm_idx
  ON classifieds USING GIN (title gin_trgm_ops);
