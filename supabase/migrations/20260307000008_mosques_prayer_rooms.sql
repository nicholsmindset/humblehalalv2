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
