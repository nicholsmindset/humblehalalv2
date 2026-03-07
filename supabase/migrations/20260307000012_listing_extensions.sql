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
