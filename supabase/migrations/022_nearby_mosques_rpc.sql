-- ============================================================
-- Migration 022: Nearby Mosque & Prayer Room RPC Functions
-- PostGIS-powered distance queries for the Nearby Finder feature.
-- ============================================================

-- ── Nearby mosques within a radius ───────────────────────────

CREATE OR REPLACE FUNCTION nearby_mosques(
  lat          double precision,
  lng          double precision,
  radius_m     integer DEFAULT 3000,
  lim          integer DEFAULT 10
)
RETURNS TABLE (
  id                   uuid,
  name                 varchar,
  slug                 varchar,
  area                 varchar,
  address              varchar,
  facilities           text[],
  wheelchair_accessible boolean,
  capacity             integer,
  distance_m           double precision
)
LANGUAGE sql STABLE AS $$
  SELECT
    m.id,
    m.name,
    m.slug,
    m.area,
    m.address,
    m.facilities,
    m.wheelchair_accessible,
    m.capacity,
    ST_Distance(
      m.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_m
  FROM mosques m
  WHERE ST_DWithin(
    m.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_m
  )
  ORDER BY distance_m ASC
  LIMIT lim;
$$;

-- ── Nearby prayer rooms within a radius ──────────────────────

CREATE OR REPLACE FUNCTION nearby_prayer_rooms(
  lat          double precision,
  lng          double precision,
  radius_m     integer DEFAULT 2000,
  lim          integer DEFAULT 10
)
RETURNS TABLE (
  id               uuid,
  name             varchar,
  slug             varchar,
  location_name    varchar,
  area             varchar,
  wudu_available   boolean,
  gender_separated boolean,
  floor_level      varchar,
  distance_m       double precision
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.location_name,
    p.area,
    p.wudu_available,
    p.gender_separated,
    p.floor_level,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_m
  FROM prayer_rooms p
  WHERE p.location IS NOT NULL
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
  ORDER BY distance_m ASC
  LIMIT lim;
$$;
