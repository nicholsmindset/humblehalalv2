-- Migration 018: Analytics daily rollup table
-- Required by /api/cron/analytics-rollup

create table if not exists public.analytics_daily_rollup (
  date        date        primary key,
  stats       jsonb       not null default '{}',
  total_events integer    not null default 0,
  unique_sessions integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- Index for range queries (e.g. last 30 days)
create index if not exists idx_analytics_daily_rollup_date
  on public.analytics_daily_rollup (date desc);

-- RLS: admin-read only, no public access
alter table public.analytics_daily_rollup enable row level security;

create policy "Admin read analytics_daily_rollup"
  on public.analytics_daily_rollup
  for select
  using (public.is_admin());

create policy "Service role full access analytics_daily_rollup"
  on public.analytics_daily_rollup
  for all
  using (auth.role() = 'service_role');

comment on table public.analytics_daily_rollup is
  'Daily aggregated analytics — populated by /api/cron/analytics-rollup (Vercel Cron, daily 5PM UTC)';
