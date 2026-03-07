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
