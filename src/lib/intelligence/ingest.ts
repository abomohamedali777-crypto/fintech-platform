import type { ChunkRecord, DocumentRecord } from "@/lib/intelligence/types";
import type { SourceAdapter } from "@/lib/intelligence/sources/adapter";
import type { IntelCorpus } from "@/lib/intelligence/sources/corpus";
import { parseIngestInput } from "@/lib/intelligence/schema";

export interface IngestionDeps {
  log?: (level: "info" | "warn" | "error", event: string, meta?: Record<string, unknown>) => void;
  now?: number;
  /** Optional durable write-through (e.g. Postgres mirror). */
  persist?: (docs: DocumentRecord[], chunks: ChunkRecord[]) => Promise<void>;
}

export interface IngestionReport {
  adapterId: string;
  attempted: number;
  created: number;
  updated: number;
  skipped: number;
  rejected: number;
  errors: string[];
}

/**
 * Source → validate → extract → normalize → chunk → index → (optional)
 * persist. Adapters are expected to FETCH and EXTRACT; this function enforces
 * validation (zod), normalization + dedupe (corpus), chunking (corpus) and
 * optional durable persistence.
 */
export async function runIngestion(
  adapter: SourceAdapter,
  corpus: IntelCorpus,
  deps: IngestionDeps = {},
): Promise<IngestionReport> {
  const log =
    deps.log ??
    ((level, event, meta = {}) => {
      const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
      fn(`[intelligence] ${event} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`);
    });
  const now = deps.now ?? Date.now();

  const report: IngestionReport = {
    adapterId: adapter.id,
    attempted: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    rejected: 0,
    errors: [],
  };

  let candidates: unknown[];
  try {
    candidates = await adapter.fetchDocuments();
  } catch (err) {
    report.errors.push(`adapter fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return report;
  }
  report.attempted = candidates.length;

  for (const candidate of candidates) {
    const parsed = parseIngestInput(candidate);
    if (!parsed.ok) {
      report.rejected += 1;
      continue;
    }
    const outcome = corpus.ingest(parsed.data, now);
    if (outcome.status === "created") report.created += 1;
    else if (outcome.status === "updated") report.updated += 1;
    else report.skipped += 1;
  }

  if (deps.persist) {
    try {
      await deps.persist(corpus.list(), corpus.allChunks());
    } catch (err) {
      report.errors.push(`persist failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  log("info", "ingestion_complete", {
    adapter: adapter.id,
    attempted: report.attempted,
    created: report.created,
    updated: report.updated,
    skipped: report.skipped,
    rejected: report.rejected,
    errors: report.errors.length,
  });

  return report;
}