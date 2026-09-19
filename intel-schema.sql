-- Optional durable mirror for the Intelligence Engine corpus.
-- The engine works entirely in-memory; these tables are a best-effort
-- write-through so the corpus survives restarts when INTEL_PERSIST_DB=1 and
-- a database is configured (see src/lib/db.ts getDbPool/isDbConfigured).
--
-- Deploy this schema to the same Postgres (Supabase) database, or run it as
-- part of your migration chain. This file is intentionally separate from
-- supabase-schema.sql; it never touches the website's tables.

create table if not exists intel_documents (
  id text primary key,
  title text not null,
  publisher text not null,
  jurisdiction text not null,
  document_type text not null,
  publication_date text not null,
  last_updated text,
  source_url text not null,
  content text not null,
  metadata jsonb,
  retrieved_at timestamptz not null default now(),
  version integer not null default 1,
  content_hash text not null,
  fixture boolean not null default false,
  dev_note text
);

create table if not exists intel_chunks (
  id text primary key,
  document_id text not null references intel_documents(id) on delete cascade,
  index integer not null,
  text text not null
);

create index if not exists intel_documents_jurisdiction_type_idx
  on intel_documents (jurisdiction, document_type);
create index if not exists intel_chunks_document_id_idx
  on intel_chunks (document_id);

alter table intel_documents enable row level security;
alter table intel_chunks enable row level security;

-- The engine writes through the service role only; end users have no access.
-- Re-run the appropriate policy against the normal Supabase auth.roles when a
-- privileged role is provisioned (mirror supabase-schema.sql conventions).
grant all on intel_documents, intel_chunks to service_role;