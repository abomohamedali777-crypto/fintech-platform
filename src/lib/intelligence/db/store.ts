import type { Pool } from "pg";
import type { ChunkRecord, DocumentRecord } from "@/lib/intelligence/types";

const DOCUMENT_COLUMNS = [
  "id",
  "title",
  "publisher",
  "jurisdiction",
  "document_type",
  "publication_date",
  "last_updated",
  "source_url",
  "content",
  "metadata",
  "retrieved_at",
  "version",
  "content_hash",
  "fixture",
  "dev_note",
] as const;

function toRow(doc: DocumentRecord): Record<(typeof DOCUMENT_COLUMNS)[number], unknown> {
  return {
    id: doc.id,
    title: doc.title,
    publisher: doc.publisher,
    jurisdiction: doc.jurisdiction,
    document_type: doc.documentType,
    publication_date: doc.publicationDate,
    last_updated: doc.lastUpdated ?? null,
    source_url: doc.sourceUrl,
    content: doc.content,
    metadata: doc.metadata ? JSON.stringify(doc.metadata) : null,
    retrieved_at: doc.retrievedAt,
    version: doc.version,
    content_hash: doc.contentHash,
    fixture: doc.fixture,
    dev_note: doc.devNote ?? null,
  };
}

async function ensureTables(pool: Pool): Promise<void> {
  await pool.query(`
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
  `);
}

/**
 * Best-effort durable mirror. Failures are swallowed by the caller while the
 * in-memory corpus remains the primary retrieval path (the engine works with
 * or without a database).
 */
export async function persistCorpusToDb(
  pool: Pool,
  documents: DocumentRecord[],
  chunks: ChunkRecord[],
): Promise<void> {
  if (documents.length === 0 && chunks.length === 0) return;
  await ensureTables(pool);

  for (const doc of documents) {
    const row = toRow(doc);
    const values = DOCUMENT_COLUMNS.map((c) => row[c]);
    const placeholders = DOCUMENT_COLUMNS.map((_, i) => `$${i + 1}`).join(", ");
    const conflictSet = DOCUMENT_COLUMNS.map((c) => `${c} = excluded.${c}`).join(", ");
    await pool.query(
      `insert into intel_documents (${DOCUMENT_COLUMNS.join(", ")})
       values (${placeholders})
       on conflict (id) do update set ${conflictSet}`,
      values,
    );
  }

  for (const chunk of chunks) {
    await pool.query(
      `insert into intel_chunks (id, document_id, index, text) values ($1, $2, $3, $4)
       on conflict (id) do nothing`,
      [chunk.id, chunk.documentId, chunk.index, chunk.text],
    );
  }
}

function fromRow(row: Record<string, unknown>): DocumentRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    publisher: String(row.publisher),
    jurisdiction: String(row.jurisdiction),
    documentType: String(row.document_type) as DocumentRecord["documentType"],
    publicationDate: String(row.publication_date),
    lastUpdated: row.last_updated == null ? undefined : String(row.last_updated),
    sourceUrl: String(row.source_url),
    content: String(row.content),
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : undefined,
    retrievedAt: String(row.retrieved_at),
    version: Number(row.version),
    contentHash: String(row.content_hash),
    fixture: Boolean(row.fixture),
    devNote: row.dev_note == null ? undefined : String(row.dev_note),
  };
}

/** Load persisted documents back into the in-memory corpus. */
export async function loadCorpusFromDb(pool: Pool): Promise<{ documents: DocumentRecord[]; chunks: ChunkRecord[] }> {
  await ensureTables(pool);
  const docsResult = await pool.query(`select * from intel_documents`);
  const documents = docsResult.rows.map(fromRow);
  const chunkResult = await pool.query(`select * from intel_chunks`);
  const chunks = chunkResult.rows.map((row) => ({
    id: String(row.id),
    documentId: String(row.document_id),
    index: Number(row.index),
    text: String(row.text),
  })) as ChunkRecord[];
  return { documents, chunks };
}