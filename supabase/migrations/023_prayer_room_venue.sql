-- ============================================================
-- Migration 023: Prayer Room Venue Type
-- Categorises prayer rooms by venue for Muslim-Friendly Malls feature.
-- ============================================================

ALTER TABLE prayer_rooms
  ADD COLUMN IF NOT EXISTS venue_type varchar
  DEFAULT 'other'
  CHECK (venue_type IN ('mall', 'airport', 'hospital', 'university', 'office', 'sports', 'government', 'other'));

-- Backfill from location_name patterns (runs after seed data is in place)
UPDATE prayer_rooms SET venue_type = 'airport'
  WHERE location_name ILIKE '%airport%'
     OR location_name ILIKE '%changi%'
     OR name ILIKE '%airport%';

UPDATE prayer_rooms SET venue_type = 'hospital'
  WHERE location_name ILIKE '%hospital%'
     OR name ILIKE '%hospital%';

UPDATE prayer_rooms SET venue_type = 'university'
  WHERE location_name ILIKE '%university%'
     OR location_name ILIKE '%polytechnic%'
     OR location_name ILIKE '% NUS%'
     OR location_name ILIKE '% NTU%'
     OR location_name ILIKE 'NUS %'
     OR location_name ILIKE 'NTU %'
     OR name ILIKE '%NUS%'
     OR name ILIKE '%NTU%';

UPDATE prayer_rooms SET venue_type = 'sports'
  WHERE location_name ILIKE '%sports%'
     OR location_name ILIKE '%stadium%'
     OR name ILIKE '%sports%';

UPDATE prayer_rooms SET venue_type = 'mall'
  WHERE venue_type = 'other'
    AND (
      location_name ILIKE '%mall%'
      OR location_name ILIKE '%city%'
      OR location_name ILIKE '%point%'
      OR location_name ILIKE '%plaza%'
      OR location_name ILIKE '%centre%'
      OR location_name ILIKE '%center%'
      OR location_name ILIKE '%junction%'
      OR location_name ILIKE '%square%'
      OR location_name ILIKE '%hub%'
      OR location_name ILIKE '%vivocity%'
      OR location_name ILIKE '%ion %'
      OR location_name ILIKE '%suntec%'
      OR location_name ILIKE '%marina bay sands%'
    );
