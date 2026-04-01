-- ============================================================
-- Migration 009: User Profiles + auto-create trigger
-- ============================================================

CREATE TABLE user_profiles (
  id                  uuid    PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name        varchar,
  avatar_url          varchar,
  bio                 text,
  area                varchar,
  is_admin            boolean NOT NULL DEFAULT false,
  reputation          integer NOT NULL DEFAULT 0,
  review_count        integer NOT NULL DEFAULT 0,
  contribution_count  integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_profiles_is_admin_idx
  ON user_profiles (is_admin)
  WHERE is_admin = true;

-- updated_at auto-update
CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Trigger: auto-create profile row when a new auth user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
