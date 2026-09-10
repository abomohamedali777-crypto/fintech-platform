-- Supabase: run in the SQL editor to create the access_requests table.

create extension if not exists "pgcrypto";

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_hash text not null,
  user_agent text,
  honeypot boolean not null default false,
  created_at timestamptz not null default now()
);

-- Restrict access: the table is only ever written from the server via the
-- service role connection string, never from the client.
alter table public.access_requests enable row level security;

create index if not exists access_requests_created_idx
  on public.access_requests (created_at desc);

create index if not exists access_requests_email_idx
  on public.access_requests (email);