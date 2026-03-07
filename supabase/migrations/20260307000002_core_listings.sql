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
