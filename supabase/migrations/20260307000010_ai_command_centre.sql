-- ============================================================
-- Migration 010: AI Command Centre Tables
-- ============================================================

-- ------------------------------------------------------------
-- ai_content_drafts
-- All AI-generated content: blog posts, travel guides, social
-- captions, newsletter issues, meta descriptions, product reviews
-- ------------------------------------------------------------

CREATE TABLE ai_content_drafts (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type     varchar       NOT NULL,  -- blog | travel | social | newsletter | meta | product_review
  title            varchar,
  body             text,
  meta_title       varchar,
  meta_description varchar,
  slug             varchar,
  target_keyword   varchar,
  prompt_used      text,
  model_used       varchar,
  tokens_in        integer,
  tokens_out       integer,
  cost_usd         decimal(10, 6),
  status           content_status NOT NULL DEFAULT 'queued',
  scheduled_for    timestamptz,
  published_at     timestamptz,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX ai_content_drafts_status_idx
  ON ai_content_drafts (status);

CREATE INDEX ai_content_drafts_content_type_idx
  ON ai_content_drafts (content_type, status);

CREATE INDEX ai_content_drafts_scheduled_for_idx
  ON ai_content_drafts (scheduled_for)
  WHERE status = 'scheduled';

-- ------------------------------------------------------------
-- ai_prompts
-- Versioned prompt templates used by the Command Centre
-- ------------------------------------------------------------

CREATE TABLE ai_prompts (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar NOT NULL,
  content_type    varchar NOT NULL,
  prompt_template text    NOT NULL,
  version         integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_prompts_name_unique UNIQUE (name)
);

CREATE TRIGGER ai_prompts_set_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- ai_moderation_log
-- Record of every AI moderation decision (reviews, forum, classifieds)
-- ------------------------------------------------------------

CREATE TABLE ai_moderation_log (
  id             uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type   varchar            NOT NULL,   -- review | forum_post | forum_reply | classified
  content_id     uuid               NOT NULL,
  ai_score       decimal(4, 3),                 -- 0.000 – 1.000 confidence
  ai_reasoning   text,
  action         moderation_action  NOT NULL,
  human_override boolean            NOT NULL DEFAULT false,
  override_reason text,
  created_at     timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX ai_moderation_log_content_idx
  ON ai_moderation_log (content_type, content_id);

CREATE INDEX ai_moderation_log_action_idx
  ON ai_moderation_log (action);

CREATE INDEX ai_moderation_log_created_at_idx
  ON ai_moderation_log (created_at DESC);

-- ------------------------------------------------------------
-- ai_enrichment_queue
-- Listings awaiting AI enrichment (Places data, descriptions, photos)
-- ------------------------------------------------------------

CREATE TABLE ai_enrichment_queue (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid    NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  source           varchar NOT NULL,    -- google_places | web_scrape | manual
  enriched_data    jsonb,
  confidence_score decimal(4, 3),
  status           varchar NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_enrichment_queue_status_idx
  ON ai_enrichment_queue (status);

CREATE INDEX ai_enrichment_queue_listing_id_idx
  ON ai_enrichment_queue (listing_id);

-- ------------------------------------------------------------
-- ai_seo_audit
-- Per-URL SEO health snapshots (runs daily via cron)
-- ------------------------------------------------------------

CREATE TABLE ai_seo_audit (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  url                  varchar NOT NULL,
  meta_status          varchar,    -- ok | missing | too_short | too_long | duplicate
  schema_status        varchar,    -- ok | missing | invalid
  internal_links_count integer,
  index_status         varchar,    -- indexed | not_indexed | crawl_error
  impressions          integer,
  clicks               integer,
  position             decimal(6, 2),
  last_audited         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_seo_audit_url_idx
  ON ai_seo_audit (url);

CREATE INDEX ai_seo_audit_last_audited_idx
  ON ai_seo_audit (last_audited DESC);

-- ------------------------------------------------------------
-- ai_cost_log
-- Running cost ledger for all Anthropic API calls
-- ------------------------------------------------------------

CREATE TABLE ai_cost_log (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type         varchar NOT NULL,   -- content | moderation | enrichment | seo | embedding
  model             varchar NOT NULL,   -- claude-sonnet-4-6 | claude-opus-4-6 | etc.
  prompt_tokens     integer,
  completion_tokens integer,
  cost_usd          decimal(10, 6),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_cost_log_task_type_idx
  ON ai_cost_log (task_type, created_at DESC);

CREATE INDEX ai_cost_log_model_idx
  ON ai_cost_log (model);

-- ------------------------------------------------------------
-- ai_activity_log
-- Audit trail for all AI Command Centre operations
-- ------------------------------------------------------------

CREATE TABLE ai_activity_log (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  action     varchar NOT NULL,   -- generate_content | moderate | enrich | seo_audit | etc.
  details    text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_activity_log_action_idx
  ON ai_activity_log (action, created_at DESC);

CREATE INDEX ai_activity_log_created_at_idx
  ON ai_activity_log (created_at DESC);
