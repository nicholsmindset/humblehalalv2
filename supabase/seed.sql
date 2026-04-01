-- HumbleHalal seed data
-- Run after migrations via: npx supabase db reset
-- Full seed scripts live in supabase/seed/ (JS files run via npm run seed:*)

-- Insert a default admin prompt template so the AI Command Centre
-- has something to display on first boot
INSERT INTO ai_prompts (name, content_type, prompt_template, version, is_active)
VALUES
  (
    'blog_post_halal_restaurant',
    'blog',
    'Write a 600-800 word blog post about {{listing_name}}, a {{cuisine_type}} halal restaurant in {{area}}, Singapore. Include: what makes it unique, must-try dishes, practical info (location, hours, price range), and a halal certification note. Tone: warm, informative, SEO-optimised for "halal {{cuisine_type}} {{area}}". End with a call to action to visit HumbleHalal.sg for more halal dining guides.',
    1,
    true
  ),
  (
    'meta_description_listing',
    'meta',
    'Write a 150-160 character meta description for {{listing_name}}, a halal {{vertical}} in {{area}}, Singapore. Include the halal status ({{halal_status}}) and one key selling point. End with "| HumbleHalal".',
    1,
    true
  ),
  (
    'travel_guide_halal_city',
    'travel',
    'Write a 1000-1200 word halal travel guide for {{city}}. Cover: top halal restaurants, prayer facilities, Muslim-friendly accommodation, local tips for Muslim travellers, and best time to visit. Tone: practical and welcoming for Muslim travellers. Include a section on halal certification standards in {{city}}.',
    1,
    true
  )
ON CONFLICT (name) DO NOTHING;
