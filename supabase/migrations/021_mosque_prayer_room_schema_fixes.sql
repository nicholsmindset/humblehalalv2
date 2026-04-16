-- ============================================================
-- Migration 021: Mosque & Prayer Room Schema Fixes
-- Adds columns that detail pages already reference but don't exist.
-- ============================================================

-- ── Mosques: add missing columns ─────────────────────────────

ALTER TABLE mosques ADD COLUMN IF NOT EXISTS postal_code varchar;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS prayer_room_available boolean DEFAULT false;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS wheelchair_accessible boolean DEFAULT false;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS friday_khutbah_time varchar;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill from existing facilities array
UPDATE mosques SET wheelchair_accessible = true
  WHERE facilities @> ARRAY['wheelchair']::text[];

UPDATE mosques SET prayer_room_available = true
  WHERE facilities @> ARRAY['prayer_room']::text[];

-- ── Prayer rooms: add missing columns ────────────────────────

ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS slug varchar;
ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS wudu_available boolean DEFAULT false;
ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS gender_separated boolean DEFAULT false;
ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS opening_hours jsonb;
ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS floor_level varchar;
ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Generate slugs for any existing rows (idempotent)
UPDATE prayer_rooms
  SET slug = lower(regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ))
  WHERE slug IS NULL OR slug = '';

-- Add unique constraint on slug (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'prayer_rooms_slug_unique'
  ) THEN
    ALTER TABLE prayer_rooms ADD CONSTRAINT prayer_rooms_slug_unique UNIQUE (slug);
  END IF;
END $$;
