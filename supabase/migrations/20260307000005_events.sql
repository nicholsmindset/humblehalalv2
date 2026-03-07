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
