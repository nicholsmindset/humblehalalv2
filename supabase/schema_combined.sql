-- ============================================================
-- Migration 001: Extensions & Enums
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE halal_status AS ENUM (
  'muis_certified',
  'muslim_owned',
  'self_declared',
  'not_applicable'
);

CREATE TYPE vertical_type AS ENUM (
  'food',
  'business',
  'catering',
  'service_provider',
  'mosque',
  'product',
  'prayer_room'
);

CREATE TYPE food_type AS ENUM (
  'restaurant',
  'hawker',
  'cafe',
  'bakery',
  'buffet',
  'fine_dining',
  'cloud_kitchen'
);

CREATE TYPE listing_status AS ENUM (
  'active',
  'pending',
  'archived',
  'flagged'
);

CREATE TYPE content_status AS ENUM (
  'queued',
  'generating',
  'draft',
  'approved',
  'scheduled',
  'published',
  'rejected'
);

CREATE TYPE moderation_action AS ENUM (
  'auto_approved',
  'auto_rejected',
  'queued',
  'manually_approved',
  'manually_rejected'
);

CREATE TYPE event_type AS ENUM (
  'bazaar',
  'class',
  'gathering',
  'workshop',
  'charity',
  'sports',
  'family'
);

CREATE TYPE classified_status AS ENUM (
  'active',
  'sold',
  'expired',
  'removed'
);

CREATE TYPE classified_condition AS ENUM (
  'new',
  'like_new',
  'good',
  'fair'
);
-- ============================================================
-- Migration 002: Core Listings Table
-- ============================================================

-- Shared updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- listings
-- ============================================================

CREATE TABLE listings (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical        vertical_type NOT NULL,
  name            varchar       NOT NULL,
  slug            varchar       NOT NULL,
  description     text,
  address         varchar,
  area            varchar       NOT NULL,
  postal_code     varchar,
  location        geography(Point, 4326),
  phone           varchar,
  website         varchar,
  email           varchar,
  social_links    jsonb,
  halal_status    halal_status  NOT NULL,
  muis_cert_no    varchar,
  muis_expiry     date,
  categories      text[],
  photos          text[],
  operating_hours jsonb,
  price_range     smallint      CHECK (price_range BETWEEN 1 AND 4),
  avg_rating      decimal(3, 2) NOT NULL DEFAULT 0,
  review_count    integer       NOT NULL DEFAULT 0,
  claimed         boolean       NOT NULL DEFAULT false,
  verified        boolean       NOT NULL DEFAULT false,
  featured        boolean       NOT NULL DEFAULT false,
  status          listing_status NOT NULL DEFAULT 'pending',
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT listings_vertical_slug_unique UNIQUE (vertical, slug)
);

-- Spatial index for proximity searches
CREATE INDEX listings_location_idx
  ON listings USING GIST (location);

-- Full-text / array containment search on categories
CREATE INDEX listings_categories_idx
  ON listings USING GIN (categories);

-- Common filter pattern: vertical + status + area
CREATE INDEX listings_vertical_status_area_idx
  ON listings (vertical, status, area);

-- Halal status filter (sponsor/featured queries)
CREATE INDEX listings_halal_status_idx
  ON listings (halal_status);

-- Name trigram index for fuzzy search
CREATE INDEX listings_name_trgm_idx
  ON listings USING GIN (name gin_trgm_ops);

-- updated_at auto-update trigger
CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ============================================================
-- Migration 003: Food Extension Table
-- ============================================================

CREATE TABLE listings_food (
  id                 uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id         uuid      NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  cuisine_types      text[],
  food_type          food_type,
  dietary_options    text[],           -- halal, vegan, vegetarian, gluten-free, etc.
  delivery_platforms text[],           -- grabfood, foodpanda, deliveroo, etc.
  reservation_link   varchar,
  menu_url           varchar,
  signature_dishes   jsonb,            -- [{name, description, price}]
  seating_capacity   integer,
  private_dining     boolean   NOT NULL DEFAULT false,

  CONSTRAINT listings_food_listing_id_unique UNIQUE (listing_id)
);

-- Index for cuisine type searches (array containment)
CREATE INDEX listings_food_cuisine_types_idx
  ON listings_food USING GIN (cuisine_types);

-- Index for food type filter
CREATE INDEX listings_food_food_type_idx
  ON listings_food (food_type);
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
-- ============================================================
-- Migration 005: Events
-- ============================================================

CREATE TABLE events (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title            varchar       NOT NULL,
  slug             varchar       NOT NULL,
  description      text,
  event_type       event_type    NOT NULL,
  start_datetime   timestamptz   NOT NULL,
  end_datetime     timestamptz,
  venue_name       varchar,
  address          varchar,
  area             varchar,
  location         geography(Point, 4326),
  price            varchar,                   -- free-text: "Free", "SGD $10-20", etc.
  organiser_id     uuid          REFERENCES auth.users (id) ON DELETE SET NULL,
  photos           text[],
  registration_url varchar,
  recurring        jsonb,                     -- {frequency, until, exceptions[]}
  status           listing_status NOT NULL DEFAULT 'pending',
  created_at       timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT events_slug_unique UNIQUE (slug),
  CONSTRAINT events_end_after_start CHECK (end_datetime IS NULL OR end_datetime > start_datetime)
);

CREATE INDEX events_start_datetime_idx
  ON events (start_datetime);

CREATE INDEX events_status_area_idx
  ON events (status, area);

CREATE INDEX events_location_idx
  ON events USING GIST (location);

CREATE INDEX events_event_type_idx
  ON events (event_type);
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
-- ============================================================
-- Migration 008: Mosques & Prayer Rooms
-- ============================================================

CREATE TABLE mosques (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar NOT NULL,
  slug          varchar NOT NULL,
  address       varchar NOT NULL,
  area          varchar NOT NULL,
  location      geography(Point, 4326) NOT NULL,
  phone         varchar,
  website       varchar,
  photos        text[],
  facilities    text[],           -- parking, wudu, wheelchair, library, etc.
  capacity      integer,
  jummah_times  jsonb,            -- [{prayer: "Jumu'ah", time: "13:15"}]
  programmes    jsonb,            -- [{name, schedule, description}]
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT mosques_slug_unique UNIQUE (slug)
);

CREATE INDEX mosques_location_idx
  ON mosques USING GIST (location);

CREATE INDEX mosques_area_idx
  ON mosques (area);

-- ============================================================

CREATE TABLE prayer_rooms (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 varchar NOT NULL,
  location_name        varchar NOT NULL,     -- e.g. "Changi Airport T3"
  floor_unit           varchar,              -- e.g. "Level 2, #02-45"
  address              varchar,
  area                 varchar NOT NULL,
  location             geography(Point, 4326),
  access_instructions  text,                 -- how to find / access it
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prayer_rooms_location_idx
  ON prayer_rooms USING GIST (location);

CREATE INDEX prayer_rooms_area_idx
  ON prayer_rooms (area);
-- ============================================================
-- Migration 009: User Profiles + auto-create trigger
-- ============================================================

CREATE TABLE user_profiles (
  id                  uuid    PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name        varchar,
  avatar_url          varchar,
  bio                 text,
  area                varchar,
  is_admin            boolean NOT NULL DEFAULT false,
  reputation          integer NOT NULL DEFAULT 0,
  review_count        integer NOT NULL DEFAULT 0,
  contribution_count  integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_profiles_is_admin_idx
  ON user_profiles (is_admin)
  WHERE is_admin = true;

-- updated_at auto-update
CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Trigger: auto-create profile row when a new auth user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- ============================================================
-- Migration 010: AI Command Centre Tables
-- ============================================================

-- ------------------------------------------------------------
-- ai_content_drafts
-- All AI-generated content: blog posts, travel guides, social
-- captions, newsletter issues, meta descriptions, product reviews
-- ------------------------------------------------------------

CREATE TABLE ai_content_drafts (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type     varchar       NOT NULL,  -- blog | travel | social | newsletter | meta | product_review
  title            varchar,
  body             text,
  meta_title       varchar,
  meta_description varchar,
  slug             varchar,
  target_keyword   varchar,
  prompt_used      text,
  model_used       varchar,
  tokens_in        integer,
  tokens_out       integer,
  cost_usd         decimal(10, 6),
  status           content_status NOT NULL DEFAULT 'queued',
  scheduled_for    timestamptz,
  published_at     timestamptz,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX ai_content_drafts_status_idx
  ON ai_content_drafts (status);

CREATE INDEX ai_content_drafts_content_type_idx
  ON ai_content_drafts (content_type, status);

CREATE INDEX ai_content_drafts_scheduled_for_idx
  ON ai_content_drafts (scheduled_for)
  WHERE status = 'scheduled';

-- ------------------------------------------------------------
-- ai_prompts
-- Versioned prompt templates used by the Command Centre
-- ------------------------------------------------------------

CREATE TABLE ai_prompts (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar NOT NULL,
  content_type    varchar NOT NULL,
  prompt_template text    NOT NULL,
  version         integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_prompts_name_unique UNIQUE (name)
);

CREATE TRIGGER ai_prompts_set_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- ai_moderation_log
-- Record of every AI moderation decision (reviews, forum, classifieds)
-- ------------------------------------------------------------

CREATE TABLE ai_moderation_log (
  id             uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type   varchar            NOT NULL,   -- review | forum_post | forum_reply | classified
  content_id     uuid               NOT NULL,
  ai_score       decimal(4, 3),                 -- 0.000 – 1.000 confidence
  ai_reasoning   text,
  action         moderation_action  NOT NULL,
  human_override boolean            NOT NULL DEFAULT false,
  override_reason text,
  created_at     timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX ai_moderation_log_content_idx
  ON ai_moderation_log (content_type, content_id);

CREATE INDEX ai_moderation_log_action_idx
  ON ai_moderation_log (action);

CREATE INDEX ai_moderation_log_created_at_idx
  ON ai_moderation_log (created_at DESC);

-- ------------------------------------------------------------
-- ai_enrichment_queue
-- Listings awaiting AI enrichment (Places data, descriptions, photos)
-- ------------------------------------------------------------

CREATE TABLE ai_enrichment_queue (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid    NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  source           varchar NOT NULL,    -- google_places | web_scrape | manual
  enriched_data    jsonb,
  confidence_score decimal(4, 3),
  status           varchar NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_enrichment_queue_status_idx
  ON ai_enrichment_queue (status);

CREATE INDEX ai_enrichment_queue_listing_id_idx
  ON ai_enrichment_queue (listing_id);

-- ------------------------------------------------------------
-- ai_seo_audit
-- Per-URL SEO health snapshots (runs daily via cron)
-- ------------------------------------------------------------

CREATE TABLE ai_seo_audit (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  url                  varchar NOT NULL,
  meta_status          varchar,    -- ok | missing | too_short | too_long | duplicate
  schema_status        varchar,    -- ok | missing | invalid
  internal_links_count integer,
  index_status         varchar,    -- indexed | not_indexed | crawl_error
  impressions          integer,
  clicks               integer,
  position             decimal(6, 2),
  last_audited         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_seo_audit_url_idx
  ON ai_seo_audit (url);

CREATE INDEX ai_seo_audit_last_audited_idx
  ON ai_seo_audit (last_audited DESC);

-- ------------------------------------------------------------
-- ai_cost_log
-- Running cost ledger for all Anthropic API calls
-- ------------------------------------------------------------

CREATE TABLE ai_cost_log (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type         varchar NOT NULL,   -- content | moderation | enrichment | seo | embedding
  model             varchar NOT NULL,   -- claude-sonnet-4-6 | claude-opus-4-6 | etc.
  prompt_tokens     integer,
  completion_tokens integer,
  cost_usd          decimal(10, 6),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_cost_log_task_type_idx
  ON ai_cost_log (task_type, created_at DESC);

CREATE INDEX ai_cost_log_model_idx
  ON ai_cost_log (model);

-- ------------------------------------------------------------
-- ai_activity_log
-- Audit trail for all AI Command Centre operations
-- ------------------------------------------------------------

CREATE TABLE ai_activity_log (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  action     varchar NOT NULL,   -- generate_content | moderate | enrich | seo_audit | etc.
  details    text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_activity_log_action_idx
  ON ai_activity_log (action, created_at DESC);

CREATE INDEX ai_activity_log_created_at_idx
  ON ai_activity_log (created_at DESC);
-- ============================================================
-- Migration 011: Analytics Events
-- Custom event tracker — no GA4 dependency
-- Schema matches ANALYTICS_SPEC.md exactly
-- ============================================================

CREATE TABLE analytics_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       varchar     NOT NULL,
  -- Primary lead actions: click_website | click_directions | click_phone |
  --   click_booking | click_menu | click_affiliate
  -- Secondary actions: search_query | browse_category | view_listing |
  --   save_listing | submit_review | share_listing | newsletter_click |
  --   set_notification | page_view
  timestamp        timestamptz NOT NULL DEFAULT now(),
  session_id       varchar     NOT NULL,   -- anonymous cookie hash, no PII
  page_url         varchar,
  referrer         varchar,
  listing_id       uuid,                   -- nullable; no FK to allow orphan-safe inserts
  listing_name     varchar,
  listing_category varchar,
  listing_area     varchar,
  brand_name       varchar,
  search_term      varchar,
  source_channel   varchar,                -- newsletter | directory | article | search | social
  device_type      varchar,                -- mobile | desktop
  utm_source       varchar,
  utm_medium       varchar,
  utm_campaign     varchar,
  utm_content      varchar
);

-- Primary query pattern: time-series by event type (dashboards, rollups)
CREATE INDEX analytics_events_type_timestamp_idx
  ON analytics_events (event_type, timestamp DESC);

-- Session journey explorer
CREATE INDEX analytics_events_session_idx
  ON analytics_events (session_id, timestamp ASC);

-- Listing performance queries (lead actions per listing)
CREATE INDEX analytics_events_listing_id_idx
  ON analytics_events (listing_id, event_type)
  WHERE listing_id IS NOT NULL;

-- Area demand chart (top areas by event activity)
CREATE INDEX analytics_events_area_type_idx
  ON analytics_events (listing_area, event_type)
  WHERE listing_area IS NOT NULL;

-- Newsletter attribution filter
CREATE INDEX analytics_events_utm_source_idx
  ON analytics_events (utm_source, timestamp DESC)
  WHERE utm_source IS NOT NULL;

-- Timestamp DESC for live feed (latest 50 events)
CREATE INDEX analytics_events_timestamp_idx
  ON analytics_events (timestamp DESC);

-- ============================================================
-- Note on partitioning:
-- For production scale (millions of events/month), partition by month:
--   ALTER TABLE analytics_events PARTITION BY RANGE (timestamp);
-- Create monthly partitions as needed. Omitted here to keep
-- migrations compatible with Supabase local dev (no partition mgmt).
-- ============================================================
-- ============================================================
-- Migration 012: Listing Extensions + Ownership Column
-- ============================================================

-- Add missing created_by column to listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS listings_created_by_idx
  ON listings (created_by)
  WHERE created_by IS NOT NULL;

-- ------------------------------------------------------------
-- listings_catering
-- ------------------------------------------------------------

CREATE TABLE listings_catering (
  listing_id      uuid  PRIMARY KEY REFERENCES listings (id) ON DELETE CASCADE,
  min_pax         integer,
  max_pax         integer,
  cuisines        text[],
  service_types   text[],   -- buffet | ala_carte | set_menu | bento | live_station
  price_per_pax   numrange, -- e.g. numrange(15, 35) for SGD 15–35/pax
  delivery_radius integer,  -- km
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX listings_catering_cuisines_idx
  ON listings_catering USING GIN (cuisines);

CREATE INDEX listings_catering_service_types_idx
  ON listings_catering USING GIN (service_types);

-- ------------------------------------------------------------
-- listings_services
-- ------------------------------------------------------------

CREATE TABLE listings_services (
  listing_id       uuid    PRIMARY KEY REFERENCES listings (id) ON DELETE CASCADE,
  service_category varchar NOT NULL,   -- legal | finance | healthcare | education | transport | etc.
  service_tags     text[],
  pricing_model    varchar,            -- hourly | fixed | subscription | quote
  contact_methods  text[],            -- phone | whatsapp | email | form
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX listings_services_category_idx
  ON listings_services (service_category);

CREATE INDEX listings_services_tags_idx
  ON listings_services USING GIN (service_tags);
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
-- ============================================================
-- Migration 014 — Events Ticketing Platform
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'completed', 'refunded', 'partial_refund', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_item_status AS ENUM ('active', 'cancelled', 'transferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_channel AS ENUM ('email', 'whatsapp', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_field_type AS ENUM ('text', 'textarea', 'dropdown', 'checkbox', 'radio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Alter events table ──────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_ticketed              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_online                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hybrid                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recurring             BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_private               BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_code              VARCHAR,
  ADD COLUMN IF NOT EXISTS online_platform          VARCHAR,
  ADD COLUMN IF NOT EXISTS online_link              VARCHAR,
  ADD COLUMN IF NOT EXISTS recurrence_rule          JSONB,
  ADD COLUMN IF NOT EXISTS refund_policy            VARCHAR DEFAULT 'no_refund',
  ADD COLUMN IF NOT EXISTS refund_policy_text       TEXT,
  ADD COLUMN IF NOT EXISTS max_tickets_per_order    SMALLINT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS waitlist_enabled         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS organiser_stripe_account_id VARCHAR,
  ADD COLUMN IF NOT EXISTS platform_fee_percent     DECIMAL DEFAULT 3.0,
  ADD COLUMN IF NOT EXISTS total_revenue            DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tickets_sold       INTEGER DEFAULT 0;

-- ── event_tickets ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         VARCHAR NOT NULL,
  description  TEXT,
  price        DECIMAL NOT NULL DEFAULT 0,
  quantity     INTEGER NOT NULL,
  sold_count   INTEGER NOT NULL DEFAULT 0,
  sale_start   TIMESTAMPTZ,
  sale_end     TIMESTAMPTZ,
  sort_order   SMALLINT DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_tickets_event_id_idx ON event_tickets(event_id);

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_event_tickets" ON event_tickets
  FOR SELECT USING (is_active = true);

CREATE POLICY "organiser_manage_event_tickets" ON event_tickets
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "admin_all_event_tickets" ON event_tickets
  FOR ALL USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- ── event_orders ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_orders (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                     UUID NOT NULL REFERENCES events(id),
  user_id                      UUID REFERENCES auth.users(id),
  order_number                 VARCHAR UNIQUE NOT NULL,
  email                        VARCHAR NOT NULL,
  name                         VARCHAR NOT NULL,
  phone                        VARCHAR,
  total_amount                 DECIMAL NOT NULL,
  platform_fee                 DECIMAL NOT NULL DEFAULT 0,
  stripe_payment_intent_id     VARCHAR,
  stripe_checkout_session_id   VARCHAR UNIQUE,
  status                       order_status NOT NULL DEFAULT 'pending',
  custom_responses             JSONB,
  promo_code_used              VARCHAR,
  refund_amount                DECIMAL DEFAULT 0,
  created_at                   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_orders_event_id_idx ON event_orders(event_id);
CREATE INDEX IF NOT EXISTS event_orders_user_id_idx  ON event_orders(user_id);
CREATE INDEX IF NOT EXISTS event_orders_status_idx   ON event_orders(status);

ALTER TABLE event_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_order_select" ON event_orders
  FOR SELECT USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "organiser_order_select" ON event_orders
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

CREATE POLICY "service_role_insert_order" ON event_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_role_update_order" ON event_orders
  FOR UPDATE USING (true);

CREATE POLICY "admin_all_event_orders" ON event_orders
  FOR ALL USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- ── event_order_items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES event_orders(id) ON DELETE CASCADE,
  ticket_id        UUID NOT NULL REFERENCES event_tickets(id),
  attendee_name    VARCHAR NOT NULL,
  attendee_email   VARCHAR NOT NULL,
  qr_code          VARCHAR UNIQUE NOT NULL,
  checked_in       BOOLEAN DEFAULT false,
  checked_in_at    TIMESTAMPTZ,
  checked_in_by    UUID REFERENCES auth.users(id),
  status           ticket_item_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_order_items_order_id_idx   ON event_order_items(order_id);
CREATE INDEX IF NOT EXISTS event_order_items_qr_code_idx    ON event_order_items(qr_code);
CREATE INDEX IF NOT EXISTS event_order_items_ticket_id_idx  ON event_order_items(ticket_id);

ALTER TABLE event_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_ticket_select" ON event_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM event_orders WHERE user_id = auth.uid())
  );

CREATE POLICY "public_qr_select" ON event_order_items
  FOR SELECT USING (true);  -- QR lookup must be public for check-in

CREATE POLICY "service_role_insert_items" ON event_order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "checkin_update" ON event_order_items
  FOR UPDATE USING (
    order_id IN (
      SELECT eo.id FROM event_orders eo
      JOIN events e ON e.id = eo.event_id
      WHERE e.created_by = auth.uid()
    )
  );

CREATE POLICY "admin_all_event_order_items" ON event_order_items
  FOR ALL USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- ── event_promo_codes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code            VARCHAR NOT NULL,
  discount_type   discount_type NOT NULL,
  discount_value  DECIMAL NOT NULL,
  max_uses        INTEGER,
  used_count      INTEGER DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, code)
);

ALTER TABLE event_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organiser_promo_codes" ON event_promo_codes
  FOR ALL USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "public_validate_promo" ON event_promo_codes
  FOR SELECT USING (is_active = true);

-- ── event_custom_questions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS event_custom_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question    VARCHAR NOT NULL,
  field_type  question_field_type NOT NULL DEFAULT 'text',
  options     TEXT[],
  is_required BOOLEAN DEFAULT false,
  sort_order  SMALLINT DEFAULT 0
);

ALTER TABLE event_custom_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_questions" ON event_custom_questions
  FOR SELECT USING (true);

CREATE POLICY "organiser_manage_questions" ON event_custom_questions
  FOR ALL USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

-- ── event_reminders ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   UUID NOT NULL REFERENCES event_order_items(id),
  channel         reminder_channel NOT NULL DEFAULT 'email',
  scheduled_for   TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  status          reminder_status NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS event_reminders_scheduled_idx ON event_reminders(scheduled_for)
  WHERE status = 'pending';

ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_reminders" ON event_reminders
  FOR ALL USING (true);

-- ── organiser_payouts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS organiser_payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id        UUID NOT NULL REFERENCES auth.users(id),
  event_id            UUID NOT NULL REFERENCES events(id),
  gross_amount        DECIMAL NOT NULL,
  platform_fee        DECIMAL NOT NULL,
  stripe_fee          DECIMAL NOT NULL,
  net_amount          DECIMAL NOT NULL,
  stripe_transfer_id  VARCHAR,
  status              payout_status NOT NULL DEFAULT 'pending',
  payout_date         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organiser_payouts_organiser_idx ON organiser_payouts(organiser_id);

ALTER TABLE organiser_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_payouts_select" ON organiser_payouts
  FOR SELECT USING (organiser_id = auth.uid());

CREATE POLICY "admin_all_payouts" ON organiser_payouts
  FOR ALL USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "service_role_insert_payouts" ON organiser_payouts
  FOR INSERT WITH CHECK (true);
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
