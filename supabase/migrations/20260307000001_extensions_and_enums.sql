-- ============================================================
-- Migration 001: Extensions & Enums
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE halal_status AS ENUM (
  'muis_certified',
  'muslim_owned',
  'self_declared',
  'not_applicable'
);

CREATE TYPE vertical_type AS ENUM (
  'food',
  'business',
  'catering',
  'service_provider',
  'mosque',
  'product',
  'prayer_room'
);

CREATE TYPE food_type AS ENUM (
  'restaurant',
  'hawker',
  'cafe',
  'bakery',
  'buffet',
  'fine_dining',
  'cloud_kitchen'
);

CREATE TYPE listing_status AS ENUM (
  'active',
  'pending',
  'archived',
  'flagged'
);

CREATE TYPE content_status AS ENUM (
  'queued',
  'generating',
  'draft',
  'approved',
  'scheduled',
  'published',
  'rejected'
);

CREATE TYPE moderation_action AS ENUM (
  'auto_approved',
  'auto_rejected',
  'queued',
  'manually_approved',
  'manually_rejected'
);

CREATE TYPE event_type AS ENUM (
  'bazaar',
  'class',
  'gathering',
  'workshop',
  'charity',
  'sports',
  'family'
);

CREATE TYPE classified_status AS ENUM (
  'active',
  'sold',
  'expired',
  'removed'
);

CREATE TYPE classified_condition AS ENUM (
  'new',
  'like_new',
  'good',
  'fair'
);
