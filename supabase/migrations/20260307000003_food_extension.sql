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
