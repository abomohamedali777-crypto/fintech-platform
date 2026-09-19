-- Supabase schema v2.
-- Run in the Supabase SQL editor (or `psql "$DATABASE_URL" -f supabase-schema.sql`).
--
-- Tables:
--   public.access_requests  – landing-page access requests (written server-side only)
--   public.rate_limits      – per-key fixed-window (grid-aligned) counters for the API rate limiter
--
-- The Next.js server writes through the service-role connection string. No anon
-- or authenticated policies are defined, so the client (Supabase JS) has no
-- access to either table. Row Level Security is enabled on both.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- access_requests
-- ---------------------------------------------------------------------------

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_hash text,
  ip_hash text not null,
  user_agent text,
  company text,
  volume text,
  honeypot boolean not null default false,
  status text not null default 'new' check (status in ('new', 'contacted', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.access_requests enable row level security;

create index if not exists access_requests_created_idx
  on public.access_requests (created_at desc);

create index if not exists access_requests_email_idx
  on public.access_requests (email);

create index if not exists access_requests_status_idx
  on public.access_requests (status);

-- ---------------------------------------------------------------------------
-- rate_limits  (distributed fixed-window grid counters used by the API route)
-- ---------------------------------------------------------------------------
--
-- Contract (enforced in code, see src/lib/rateLimit/postgres.ts):
--   * bucket_key   – salted SHA-256 hash of the rate-limit subject
--                    (e.g. "ip:<hashed>:<salt>" style values), NEVER the raw
--                    IP address or raw email address.
--   * window_start – a timestamptz written as an ISO-8601 string
--                    (e.g. '2026-09-16T12:00:00.000Z').
--
-- Pitfall: PostgreSQL interprets a bare numeric token — including a JS
-- epoch-millisecond integer such as 1726502400000 — as a YEAR (see
-- Appendix B.1, "Date/Time Input Interpretation"), which is far out of range
-- and makes every insert fail. Always bind an ISO-8601 string to this column.

create table if not exists public.rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (bucket_key, window_start)
);

alter table public.rate_limits enable row level security;

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

-- Repair + guard (idempotent) for the historical epoch-integer pitfall above.
-- Remove any rows that were written with a garbage, far-future window_start
-- (the integer-instead-of-ISO bug wrote year ~54,000 values).
delete from public.rate_limits
where window_start > now() + interval '7 days';

-- Reject future writes that would repeat the mistake. The CHECK compares the
-- window_start against the current time, so epoch-integer garbage (centuries
-- in the future) is refused at the database layer too.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rate_limits_window_start_guard'
      and conrelid = 'public.rate_limits'::regclass
  ) then
    alter table public.rate_limits
      add constraint rate_limits_window_start_guard
      check (window_start is not null and window_start <= now() + interval '7 days');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Migration (safe to re-run): backfill the new v2 columns on an existing v1
-- table and label previously stored rows.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'access_requests' and column_name = 'company'
  ) then
    alter table public.access_requests add column company text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'access_requests' and column_name = 'volume'
  ) then
    alter table public.access_requests add column volume text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'access_requests' and column_name = 'email_hash'
  ) then
    alter table public.access_requests add column email_hash text;
  end if;
end $$;

update public.access_requests set status = 'new' where status is null or status = '';

-- ---------------------------------------------------------------------------
-- Optional cleanup job: keep rate-limit rows from accumulating indefinitely.
-- Run as a pg_cron schedule if Supabase scheduled jobs are available:
--
--   select cron.schedule(
--     'rate-limit-cleanup',
--     '0 * * * *',
--     $$ delete from public.rate_limits where window_start < now() - interval '24 hours'; $$
--   );
--
-- This matches real timestamps now that window_start holds ISO-8601 values
-- (the previous epoch-integer bug left it centuries in the future, so nothing
-- was ever cleaned). The Postgres store in src/lib also prunes
-- opportunistically on write, so this job is belt-and-braces rather than
-- required.
-- ---------------------------------------------------------------------------