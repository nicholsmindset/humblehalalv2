-- ============================================================
-- Migration 024: Hawker Centre Fields
-- Adds hawker-specific columns to listings_food so stalls can
-- be grouped by centre. Hawker stalls are food listings with
-- food_type = 'hawker' — no new vertical needed.
-- ============================================================

ALTER TABLE listings_food ADD COLUMN IF NOT EXISTS hawker_centre_name varchar;
ALTER TABLE listings_food ADD COLUMN IF NOT EXISTS stall_number varchar;

-- Index for grouping stalls by centre (partial — only when relevant)
CREATE INDEX IF NOT EXISTS listings_food_hawker_centre_idx
  ON listings_food (hawker_centre_name)
  WHERE hawker_centre_name IS NOT NULL;
