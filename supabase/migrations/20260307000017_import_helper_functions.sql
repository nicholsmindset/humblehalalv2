-- ============================================================
-- Migration 017: Import Helper Functions
-- ============================================================

-- bulk_insert_listing: Inserts a single listing from JSONB data,
-- handling PostGIS geography conversion for coordinates.
-- Used by the admin import wizard.

CREATE OR REPLACE FUNCTION bulk_insert_listing(data jsonb)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO listings (
    name, slug, vertical, description, address, area,
    postal_code, location, phone, website, email,
    halal_status, categories, photos, operating_hours,
    price_range, status
  ) VALUES (
    data->>'name',
    data->>'slug',
    (data->>'vertical')::vertical_type,
    data->>'description',
    data->>'address',
    data->>'area',
    data->>'postal_code',
    CASE WHEN data->>'latitude' IS NOT NULL AND data->>'longitude' IS NOT NULL
      THEN ST_MakePoint((data->>'longitude')::float, (data->>'latitude')::float)::geography
      ELSE NULL
    END,
    data->>'phone',
    data->>'website',
    data->>'email',
    (data->>'halal_status')::halal_status,
    CASE WHEN data->'categories' IS NOT NULL AND jsonb_typeof(data->'categories') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(data->'categories'))
      ELSE NULL
    END,
    CASE WHEN data->'photos' IS NOT NULL AND jsonb_typeof(data->'photos') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(data->'photos'))
      ELSE NULL
    END,
    data->'operating_hours',
    (data->>'price_range')::smallint,
    COALESCE((data->>'status')::listing_status, 'pending')
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- bulk_insert_food_extension: Inserts a food extension record for a listing.
CREATE OR REPLACE FUNCTION bulk_insert_food_extension(data jsonb)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO listings_food (
    listing_id, cuisine_types, food_type
  ) VALUES (
    (data->>'listing_id')::uuid,
    CASE WHEN data->'cuisine_types' IS NOT NULL AND jsonb_typeof(data->'cuisine_types') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(data->'cuisine_types'))
      ELSE NULL
    END,
    CASE WHEN data->>'food_type' IS NOT NULL
      THEN (data->>'food_type')::food_type
      ELSE NULL
    END
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
